"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { sendMail } from "@/lib/mail";
import { signQuoteToken } from "@/lib/quote-token";
import { buildQuoteExcel } from "@/lib/quote-excel";
import { quoteRequestSchema } from "@/lib/validators";

export type QuoteState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

type QuoteItem = {
  name: string;
  unit: string;
  quantity: number;
  hsnCode: string | null;
  gstRate: number;
};

export async function submitQuoteRequest(
  _prev: QuoteState | undefined,
  formData: FormData
): Promise<QuoteState> {
  const session = await getSession();
  if (!session) {
    redirect(`/login?next=/quote`);
  }

  let itemsRaw: unknown = [];
  try {
    itemsRaw = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    itemsRaw = [];
  }

  const parsed = quoteRequestSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    message: formData.get("message") || undefined,
    items: itemsRaw,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const productIds = parsed.data.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    select: { id: true, name: true, unit: true, hsnCode: true, gstRate: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const validItems = parsed.data.items.filter((i) => productMap.has(i.productId));
  if (validItems.length === 0) {
    return { error: "None of the selected products are available. Please pick valid products." };
  }

  const quoteItems: QuoteItem[] = validItems.map((i) => {
    const p = productMap.get(i.productId)!;
    return {
      name: p.name,
      unit: i.unit?.trim() || p.unit,
      quantity: i.quantity,
      hsnCode: p.hsnCode,
      gstRate: p.gstRate,
    };
  });

  const itemLines = quoteItems.map((i) => `${i.quantity} × ${i.name} (${i.unit})`);
  const message =
    parsed.data.message?.trim() ||
    "Please share wholesale pricing and availability for the items listed.";

  const enquiry = await prisma.enquiry.create({
    data: {
      userId: session?.id ?? null,
      type: "QUOTATION",
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      specs: itemLines.join("\n"),
      message,
    },
  });

  await prisma.quotationItem.createMany({
    data: validItems.map((i) => {
      const p = productMap.get(i.productId)!;
      return {
        enquiryId: enquiry.id,
        productId: i.productId,
        name: p.name,
        unit: i.unit?.trim() || p.unit,
        quantity: i.quantity,
        gstRate: p.gstRate,
        hsnCode: p.hsnCode,
      };
    }),
  });

  const token = await signQuoteToken(enquiry.id);
  await prisma.enquiry.update({
    where: { id: enquiry.id },
    data: { token },
  });

  await sendQuoteEmail({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    items: quoteItems,
    message,
  });

  return { success: true };
}

async function sendQuoteEmail({
  name,
  email,
  phone,
  items,
  message,
}: {
  name: string;
  email?: string;
  phone?: string;
  items: QuoteItem[];
  message: string;
}) {
  const settings = await getSettings();

  const to = process.env.NOTIFY_EMAIL?.trim() || settings.email;

  const rows = items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#1f2937;">${escapeHtml(i.name)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#1f2937;">${escapeHtml(i.unit)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#1f2937;">${i.quantity}</td>
        </tr>`
    )
    .join("");

  const contactBits = [
    name ? `Name: <strong>${escapeHtml(name)}</strong>` : null,
    email ? `Email: <strong>${escapeHtml(email)}</strong>` : null,
    phone ? `Phone: <strong>${escapeHtml(phone)}</strong>` : null,
  ]
    .filter(Boolean)
    .join("<br/>");

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;">
    <h2 style="color:#1d4ed8;margin:0 0 4px;">New Quote Request</h2>
    <p style="color:#6b7280;margin:0 0 16px;">Received from the storefront quote form</p>
    <table style="width:100%;border-collapse:collapse;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;font-size:14px;">
      <thead>
        <tr>
          <th style="text-align:left;padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">Product</th>
          <th style="text-align:left;padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">Unit</th>
          <th style="text-align:left;padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">Qty</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin:16px 0 0;font-size:14px;color:#374151;">Requirement:</p>
    <p style="margin:4px 0 16px;padding:12px;background:#eff6ff;border-radius:8px;color:#1e40af;font-size:14px;">${escapeHtml(message)}</p>
    <p style="margin:0;padding:12px;background:#f9fafb;border-radius:8px;color:#6b7280;font-size:13px;">${contactBits}</p>
    <p style="margin-top:16px;font-size:12px;color:#9ca3af;">The full product list is attached as an Excel file.</p>
  </div>
  `;

  const text = [
    "New Quote Request",
    `From: ${name}${email ? ` (${email})` : ""}${phone ? `, ${phone}` : ""}`,
    "",
    "Items requested:",
    ...items.map((i) => `${i.quantity} ${i.unit} × ${i.name}`),
    "",
    `Requirement: ${message}`,
  ].join("\n");

  const attachment = await buildQuoteExcel(items, { name, email, phone, message }, settings);

  await sendMail({
    to,
    subject: `New Quote Request — ${name}`,
    text,
    html,
    replyTo: email || undefined,
    attachments: [{ filename: "quote-request.xlsx", content: attachment }],
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
