import { addressSchema, contactAddressSchema } from "@/lib/validators";

export type ResolvedAddress = {
  name?: string;
  businessName?: string;
  email?: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
};

export function parseAddressFields(
  formData: FormData,
  prefix: string,
  opts?: { requireContact?: boolean }
): { ok: true; address: ResolvedAddress } | { ok: false; fieldErrors: Record<string, string[]> } {
  const schema = opts?.requireContact ? contactAddressSchema : addressSchema;
  const parsed = schema.safeParse({
    name: formData.get(`${prefix}name`) || undefined,
    company: formData.get(`${prefix}company`) || undefined,
    email: formData.get(`${prefix}email`) || undefined,
    line1: formData.get(`${prefix}line1`),
    line2: formData.get(`${prefix}line2`) || undefined,
    city: formData.get(`${prefix}city`),
    state: formData.get(`${prefix}state`),
    pincode: formData.get(`${prefix}pincode`),
    phone: formData.get(`${prefix}phone`) || undefined,
  });
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  const a = parsed.data;
  return {
    ok: true,
    address: {
      name: a.name || undefined,
      businessName: a.company || undefined,
      email: a.email || undefined,
      line1: a.line1,
      line2: a.line2 || "",
      city: a.city,
      state: a.state,
      pincode: a.pincode,
      phone: a.phone,
    },
  };
}
