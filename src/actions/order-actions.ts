"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { generateOrderNumber } from "@/lib/utils";
import { parseAddressFields, type ResolvedAddress } from "@/lib/address-parser";

export type OrderState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function placeOrder(
  _prev: OrderState | undefined,
  formData: FormData
): Promise<OrderState> {
  const session = await requireUser();
  const paymentMethod = String(formData.get("paymentMethod") ?? "COD");
  const customerNote = String(formData.get("customerNote") ?? "").trim();
  const addressId = String(formData.get("addressId") ?? "");
  const createNew = String(formData.get("createNew") ?? "");
  const sameAsBilling = formData.get("sameAsBilling") === "1";

  if (!["COD", "BANK_TRANSFER", "WHATSAPP"].includes(paymentMethod)) {
    return { error: "Invalid payment method." };
  }

  const user = await prisma.user.findUnique({ where: { id: session.id } });

  // Resolve billing address
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

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: session.id },
    include: { product: true },
  });

  if (cartItems.length === 0) return { error: "Your cart is empty." };

  const addressSnapshot = JSON.stringify({
    ...billing,
    name: billing.name || user?.name || "",
    businessName: billing.businessName || user?.businessName || "",
    email: billing.email || user?.email || "",
  });

  const orderNumber = generateOrderNumber();

  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: session.id,
      addressSnapshot,
      shippingAddressSnapshot,
      paymentMethod: paymentMethod as "COD" | "BANK_TRANSFER" | "WHATSAPP",
      status: "PLACED",
      customerNote: customerNote || null,
      items: {
        create: cartItems.map((ci) => ({
          productId: ci.productId,
          name: ci.product.name,
          unit: ci.product.unit,
          quantity: ci.quantity,
          unitPrice: ci.product.price ?? null,
          gstRate: ci.product.gstRate,
          hsnCode: ci.product.hsnCode,
        })),
      },
    },
  });

  await prisma.cartItem.deleteMany({ where: { userId: session.id } });
  revalidatePath("/cart");

  redirect(`/account/orders/${order.orderNumber}?placed=1`);
}

export async function cancelOrder(formData: FormData) {
  const session = await requireUser();
  const orderNumber = String(formData.get("orderNumber") ?? "");

  await prisma.order.updateMany({
    where: { orderNumber, userId: session.id, status: { in: ["PLACED", "QUOTED"] } },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });
  revalidatePath(`/account/orders/${orderNumber}`);
}
