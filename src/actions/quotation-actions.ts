"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin, getSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { sendMail } from "@/lib/mail";
import { verifyQuoteToken } from "@/lib/quote-token";
import { buildQuoteExcel } from "@/lib/quote-excel";
import { computeInvoiceTotals } from "@/lib/invoice";
import { generateOrderNumber, round2, formatINR } from "@/lib/utils";
import { parseAddressFields, type ResolvedAddress } from "@/lib/address-parser";

export type QuotationState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  acceptanceLink?: string;
};

// ---------- Admin: save prices and/or respond ----------

export async function submitQuotationPricing(
  _prev: QuotationState | undefined,
  formData: FormData
): Promise<QuotationState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const intent = String(formData.get("intent") ?? "save");

  const enquiry = await prisma.enquiry.findUnique({ where: { id }, include: { items: true } });
  if (!enquiry) return { error: "Quotation not found." };

  const updates = enquiry.items.map((item) => {
    const unitPrice = Number(formData.get(`price_${item.id}`) ?? "");
    const gstRate = Number(formData.get(`gst_${item.id}`) ?? item.gstRate);
    const qty = Math.floor(Number(formData.get(`qty_${item.id}`) ?? item.quantity));
    const hsnCode = String(formData.get(`hsn_${item.id}`) ?? "").trim();
    return {
      id: item.id,
      unitPrice: Number.isFinite(unitPrice) && unitPrice > 0 ? round2(unitPrice) : null,
      gstRate: Number.isFinite(gstRate) ? gstRate : item.gstRate,
      quantity: Number.isFinite(qty) && qty > 0 ? qty : item.quantity,
      hsnCode: hsnCode || null,
    };
  });

  await prisma.$transaction(
    updates.map((u) =>
      prisma.quotationItem.update({
        where: { id: u.id },
        data: {
          unitPrice: u.unitPrice,
          gstRate: u.gstRate,
          quantity: u.quantity,
          hsnCode: u.hsnCode,
        },
      })
    )
  );

  if (intent === "respond") {
    const refreshed = await prisma.enquiry.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!refreshed || refreshed.items.some((it) => it.unitPrice == null)) {
      return { error: "Every item needs a quote price before responding." };
    }
    const link = await respondQuotation(refreshed);
    revalidatePath("/admin/quotes");
    revalidatePath(`/admin/quotes/${id}`);
    return { success: true, acceptanceLink: link };
  }

  revalidatePath(`/admin/quotes/${id}`);
  return { success: true };
}

async function respondQuotation(
  enquiry: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    message: string;
    token: string | null;
    items: Array<{
      name: string;
      unit: string;
      quantity: number;
      unitPrice: number | null;
      gstRate: number;
      hsnCode: string | null;
    }>;
  }
): Promise<string> {
  const settings = await getSettings();

  const items = enquiry.items.map((it) => ({
    name: it.name,
    unit: it.unit,
    quantity: it.quantity,
    hsnCode: it.hsnCode,
    gstRate: it.gstRate,
    unitPrice: it.unitPrice,
  }));

  const totals = computeInvoiceTotals(items, settings.stateCode);
  const excel = await buildQuoteExcel(
    items,
    {
      name: enquiry.name,
      email: enquiry.email ?? undefined,
      phone: enquiry.phone ?? undefined,
      message: enquiry.message,
    },
    settings,
    { priced: true, grandTotal: totals.grandTotal }
  );

  const baseUrl = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const link = `${baseUrl}/quote/${enquiry.token}`;

  await prisma.enquiry.update({
    where: { id: enquiry.id },
    data: { status: "RESPONDED", quotedAt: new Date() },
  });

  if (enquiry.email) {
    const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#1d4ed8;margin:0 0 4px;">Your Quotation is Ready</h2>
      <p style="color:#6b7280;margin:0 0 16px;">from ${escapeHtml(settings.storeName)}</p>
      <p style="font-size:14px;color:#374151;">
        Thanks for your interest, <strong>${escapeHtml(enquiry.name)}</strong>! Your itemised quotation with wholesale
        prices is attached as an Excel file. The total comes to <strong>${formatINR(totals.grandTotal)}</strong> (incl. GST).
      </p>
      <p style="font-size:14px;color:#374151;">
        To accept the quote (and adjust quantities if needed), click the button below:
      </p>
      <p style="margin:20px 0;">
        <a href="${link}"
           style="display:inline-block;background:#1d4ed8;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
          Review &amp; Accept Quotation
        </a>
      </p>
      <p style="font-size:12px;color:#9ca3af;">This link is personal to this quotation and expires in 30 days.</p>
    </div>`;
    const text = `Your Quotation is Ready from ${settings.storeName}.\n\nTotal (incl. GST): ${formatINR(
      totals.grandTotal
    )}\n\nReview and accept your quotation here: ${link}\n\nThe itemised priced Excel is attached.`;

    await sendMail({
      to: enquiry.email,
      subject: `Your Quotation from ${settings.storeName} — Total ${formatINR(totals.grandTotal)}`,
      text,
      html,
      attachments: [{ filename: `quotation-${enquiry.id.slice(0, 8)}.xlsx`, content: excel }],
    });
  }

  return link;
}

// ---------- Customer: accept or request changes ----------

export async function acceptQuotation(
  _prev: QuotationState | undefined,
  formData: FormData
): Promise<QuotationState> {
  const token = String(formData.get("token") ?? "");
  const enquiryId = await verifyQuoteToken(token);
  if (!enquiryId) return { error: "This quote link is invalid or has expired." };

  const session = await getSession();
  if (!session) redirect(`/login?next=/quote/${encodeURIComponent(token)}`);

  const enquiry = await prisma.enquiry.findUnique({
    where: { id: enquiryId },
    include: { items: true },
  });
  if (!enquiry) return { error: "Quotation not found." };

  if (enquiry.orderId) {
    const existing = await prisma.order.findUnique({ where: { id: enquiry.orderId } });
    if (existing) redirect(`/account/orders/${existing.orderNumber}`);
    return { error: "This quotation has already been converted into an order." };
  }
  if (enquiry.items.some((it) => it.unitPrice == null)) {
    return { error: "This quotation has not been priced yet. Please try again later." };
  }
  if (enquiry.email && enquiry.email.toLowerCase() !== session.email.toLowerCase()) {
    return {
      error: `Please log in with the email used for this quote (${enquiry.email}) to accept it.`,
    };
  }

  const items = enquiry.items.map((it) => {
    const qty = Math.floor(Number(formData.get(`qty_${it.id}`) ?? it.quantity));
    return { ...it, quantity: Number.isFinite(qty) && qty > 0 ? qty : it.quantity };
  });

  const user = await prisma.user.findUnique({ where: { id: session.id } });

  // Resolve billing address (saved address or new form fields)
  const addressId = String(formData.get("addressId") ?? "");
  const createNew = String(formData.get("createNew") ?? "");
  const sameAsBilling = formData.get("sameAsBilling") === "1";

  let billing: ResolvedAddress;

  if (createNew === "1" || !addressId) {
    const parsed = parseAddressFields(formData, "", { requireContact: true });
    if (!parsed.ok) return { fieldErrors: parsed.fieldErrors };
    billing = parsed.address;
    await prisma.address.create({
      data: {
        userId: session.id,
        line1: billing.line1,
        line2: billing.line2 || null,
        city: billing.city,
        state: billing.state,
        pincode: billing.pincode,
        phone: billing.phone,
        isDefault: (await prisma.address.count({ where: { userId: session.id } })) === 0,
      },
    });
  } else {
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId: session.id },
    });
    if (!address) return { error: "Selected address not found." };
    billing = {
      name: user?.name ?? "",
      businessName: user?.businessName ?? "",
      email: user?.email ?? "",
      line1: address.line1,
      line2: address.line2 ?? "",
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      phone: address.phone ?? "",
    };
  }

  // Resolve shipping address
  let shipping = billing;
  let shippingAddressSnapshot: string | null = null;
  if (!sameAsBilling) {
    const parsed = parseAddressFields(formData, "shipping_", { requireContact: true });
    if (!parsed.ok) return { fieldErrors: parsed.fieldErrors };
    shipping = parsed.address;
    shippingAddressSnapshot = JSON.stringify({
      ...shipping,
      name: shipping.name || user?.name || "",
      businessName: shipping.businessName || user?.businessName || "",
      email: shipping.email || user?.email || "",
    });
  }

  const addressSnapshot = JSON.stringify({
    ...billing,
    name: billing.name || user?.name || "",
    businessName: billing.businessName || user?.businessName || "",
    email: billing.email || user?.email || "",
  });

  const totals = computeInvoiceTotals(
    items.map((it) => ({
      name: it.name,
      hsnCode: it.hsnCode,
      quantity: it.quantity,
      unit: it.unit,
      unitPrice: it.unitPrice,
      gstRate: it.gstRate,
    })),
    billing.state
  );

  const orderNumber = generateOrderNumber();
  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: session.id,
      addressSnapshot,
      shippingAddressSnapshot,
      status: "CONFIRMED",
      paymentMethod: "COD",
      amount: totals.grandTotal,
      taxAmount: totals.totalTax,
      items: {
        create: items.map((it) => ({
          productId: it.productId,
          name: it.name,
          unit: it.unit,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          gstRate: it.gstRate,
          hsnCode: it.hsnCode,
        })),
      },
    },
  });

  await prisma.enquiry.update({
    where: { id: enquiry.id },
    data: { orderId: order.id, status: "CLOSED", acceptedAt: new Date() },
  });

  const settings = await getSettings();
  const adminTo = process.env.NOTIFY_EMAIL?.trim() || settings.email;
  const adminMessage = `Hi, ${enquiry.name} accepted their quotation.\n\nOrder: ${orderNumber}\nTotal: ${formatINR(
    totals.grandTotal
  )}\n\nView it in the dashboard: ${baseUrl()}/admin/orders/${orderNumber}`;
  const customerMessage = `Hi ${user?.name ?? ""}, your order ${orderNumber} is confirmed. Total: ${formatINR(
    totals.grandTotal
  )} (incl. GST). We'll begin preparing your items. You can track it anytime in your account.`;

  await sendMail({
    to: adminTo,
    subject: `Quotation accepted — order ${orderNumber}`,
    text: adminMessage,
    html: `<div style="font-family:Arial,Helvetica,sans-serif;"><p>Hi, ${escapeHtml(
      enquiry.name
    )} accepted their quotation.</p><p><strong>Order:</strong> ${orderNumber}<br/><strong>Total:</strong> ${formatINR(
      totals.grandTotal
    )}</p><p><a href="${baseUrl()}/admin/orders/${orderNumber}">Open in dashboard</a></p></div>`,
  });
  await sendMail({
    to: session.email,
    subject: `Order confirmed — ${orderNumber}`,
    text: customerMessage,
    html: `<div style="font-family:Arial,Helvetica,sans-serif;"><p>Hi ${escapeHtml(
      user?.name ?? ""
    )},</p><p>Your order <strong>${orderNumber}</strong> is confirmed. Total: <strong>${formatINR(
      totals.grandTotal
    )}</strong> (incl. GST).</p><p>We'll begin preparing your items. Track it anytime in your account.</p></div>`,
  });

  revalidatePath("/admin/quotes");
  redirect(`/account/orders/${orderNumber}?converted=1`);
}

export async function requestQuoteChanges(
  _prev: QuotationState | undefined,
  formData: FormData
): Promise<QuotationState> {
  const token = String(formData.get("token") ?? "");
  const message = String(formData.get("message") ?? "").trim();
  if (message.length < 5) return { error: "Please describe the changes you need." };

  const enquiryId = await verifyQuoteToken(token);
  if (!enquiryId) return { error: "This quote link is invalid or has expired." };

  const enquiry = await prisma.enquiry.findUnique({ where: { id: enquiryId } });
  if (!enquiry) return { error: "Quotation not found." };

  const settings = await getSettings();
  const adminTo = process.env.NOTIFY_EMAIL?.trim() || settings.email;
  await sendMail({
    to: adminTo,
    subject: `Quote change request — ${enquiry.name}`,
    text: `Requested changes for the quote from ${enquiry.name}${enquiry.email ? ` (${enquiry.email})` : ""}:\n\n${message}\n\nOpen quote: ${baseUrl()}/admin/quotes/${enquiry.id}`,
    html: `<div style="font-family:Arial,Helvetica,sans-serif;"><h3 style="color:#1d4ed8;">Quote change request</h3><p>From <strong>${escapeHtml(
      enquiry.name
    )}</strong>${enquiry.email ? ` (${escapeHtml(enquiry.email)})` : ""}</p><blockquote style="background:#f9fafb;padding:12px;border-radius:8px;">${escapeHtml(
      message
    )}</blockquote><p><a href="${baseUrl()}/admin/quotes/${enquiry.id}">Open quotation</a></p></div>`,
  });

  return { success: true };
}

function baseUrl(): string {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
