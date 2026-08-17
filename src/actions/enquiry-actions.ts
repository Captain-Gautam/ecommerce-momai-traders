"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { enquirySchema } from "@/lib/validators";

export type EnquiryState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function submitEnquiry(
  _prev: EnquiryState | undefined,
  formData: FormData
): Promise<EnquiryState> {
  const parsed = enquirySchema.safeParse({
    name: formData.get("name"),
    company: formData.get("company") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    subject: formData.get("subject") || undefined,
    quantity: formData.get("quantity") || undefined,
    unit: formData.get("unit") || undefined,
    specs: formData.get("specs") || undefined,
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const session = await getSession();
  const productIdRaw = formData.get("productId");
  const productId =
    typeof productIdRaw === "string" && productIdRaw ? productIdRaw : null;

  await prisma.enquiry.create({
    data: {
      userId: session?.id ?? null,
      productId,
      type: "ENQUIRY",
      name: parsed.data.name,
      company: parsed.data.company || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      subject: parsed.data.subject || null,
      quantity: parsed.data.quantity ?? null,
      unit: parsed.data.unit || null,
      specs: parsed.data.specs || null,
      message: parsed.data.message,
    },
  });

  return { success: true };
}
