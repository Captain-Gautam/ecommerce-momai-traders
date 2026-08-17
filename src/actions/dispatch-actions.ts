"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { generateChallanNumber } from "@/lib/utils";

export type DispatchState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};
export async function createDeliveryChallan(formData: FormData): Promise<void> {
  await requireAdmin();
  const orderId = String(formData.get("id") ?? "");
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return;
  if (order.status === "CANCELLED") return;
  if (order.items.some((it) => it.unitPrice == null)) return;

  const updates = order.items.map((item) => {
    const raw = formData.get(`qty_${item.id}`);
    const qty = Math.floor(Number(raw ?? "0"));
    const remaining = item.quantity - item.deliveredQty;
    const value = Number.isFinite(qty) && qty > 0 ? qty : 0;
    return {
      orderItem: item,
      qty: Math.min(value, remaining),
      remaining,
    };
  });

  const invalid = updates.filter((u) => u.qty > u.remaining || u.qty < 0);
  if (invalid.length > 0) return;
  if (updates.every((u) => u.qty === 0)) return;

  const settings = await getSettings();
  const count = await prisma.deliveryChallan.count();
  const challanNumber = generateChallanNumber(settings.challanPrefix, count + 1);

  const courierName = String(formData.get("courierName") ?? "").trim();
  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim();
  const trackingUrl = String(formData.get("trackingUrl") ?? "").trim();

  await prisma.$transaction(async (tx) => {
    await tx.deliveryChallan.create({
      data: {
        challanNumber,
        orderId: order.id,
        courierName: courierName || null,
        trackingNumber: trackingNumber || null,
        trackingUrl: trackingUrl || null,
        items: {
          create: updates
            .filter((u) => u.qty > 0)
            .map((u) => ({
              orderItemId: u.orderItem.id,
              name: u.orderItem.name,
              unit: u.orderItem.unit,
              quantity: u.qty,
              hsnCode: u.orderItem.hsnCode,
            })),
        },
      },
    });

    for (const u of updates) {
      if (u.qty === 0) continue;
      await tx.orderItem.update({
        where: { id: u.orderItem.id },
        data: { deliveredQty: { increment: u.qty } },
      });
    }

    const refreshed = await tx.order.findUnique({
      where: { id: order.id },
      include: { items: true },
    });
    const allDelivered =
      refreshed!.items.length > 0 && refreshed!.items.every((it) => it.deliveredQty >= it.quantity);

    const data: Record<string, unknown> = {};
    if (!order.shippedAt) data.shippedAt = new Date();
    if (allDelivered) {
      data.status = "DELIVERED";
      data.deliveredAt = new Date();
    }
    if (Object.keys(data).length > 0) {
      await tx.order.update({ where: { id: order.id }, data });
    }
  });

  revalidatePath(`/admin/orders/${order.orderNumber}`);
  revalidatePath("/admin/orders");
}

export async function updateChallanTracking(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const courierName = String(formData.get("courierName") ?? "").trim();
  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim();
  const trackingUrl = String(formData.get("trackingUrl") ?? "").trim();
  if (!id) return;

  await prisma.deliveryChallan.update({
    where: { id },
    data: {
      courierName: courierName || null,
      trackingNumber: trackingNumber || null,
      trackingUrl: trackingUrl || null,
    },
  });

  const challan = await prisma.deliveryChallan.findUnique({
    where: { id },
    select: { order: { select: { orderNumber: true } } },
  });
  if (challan) {
    revalidatePath(`/admin/orders/${challan.order.orderNumber}`);
    revalidatePath("/admin/orders");
  }
}
