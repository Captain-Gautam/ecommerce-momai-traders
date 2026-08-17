export type OrderAddress = {
  name?: string;
  businessName?: string;
  email?: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  phone?: string;
};

export function parseOrderAddresses(
  billingSnapshot: string,
  shippingSnapshot: string | null
): { billing: OrderAddress; shipping: OrderAddress } {
  const billing = JSON.parse(billingSnapshot) as OrderAddress;
  let shipping = billing;
  if (shippingSnapshot) {
    try {
      shipping = JSON.parse(shippingSnapshot) as OrderAddress;
    } catch {
      shipping = billing;
    }
  }
  return { billing, shipping };
}
