"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession, requireUser } from "@/lib/auth";

export async function addToCart(formData: FormData): Promise<{ added: boolean; qty: number }> {
  const productId = String(formData.get("productId") ?? "");
  const quantity = Math.max(1, Number(formData.get("quantity") ?? 1) || 1);
  const next = String(formData.get("next") ?? "/products");

  const session = await getSession();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  const product = await prisma.product.findUnique({
    where: { id: productId, isActive: true },
    select: { id: true, price: true, minOrderQty: true },
  });
  if (!product) return { added: false, qty: 0 };

  const qty = Math.max(quantity, product.minOrderQty);
  const existing = await prisma.cartItem.findUnique({
    where: { userId_productId: { userId: session.id, productId } },
  });

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + qty },
    });
  } else {
    await prisma.cartItem.create({
      data: { userId: session.id, productId, quantity: qty },
    });
  }

  const count = await prisma.cartItem.count({ where: { userId: session.id } });
  return { added: true, qty: count };
}

export async function updateCartItem(formData: FormData) {
  const session = await requireUser();
  const id = String(formData.get("id") ?? "");
  const quantity = Math.max(1, Number(formData.get("quantity") ?? 1) || 1);

  await prisma.cartItem.updateMany({
    where: { id, userId: session.id },
    data: { quantity },
  });
  revalidatePath("/cart");
}

export async function removeCartItem(formData: FormData) {
  const session = await requireUser();
  const id = String(formData.get("id") ?? "");
  await prisma.cartItem.deleteMany({ where: { id, userId: session.id } });
  revalidatePath("/cart");
}

export async function clearCart() {
  const session = await requireUser();
  await prisma.cartItem.deleteMany({ where: { userId: session.id } });
}
