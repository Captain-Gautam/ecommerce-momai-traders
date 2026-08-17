"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { setSessionCookie } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { slugify, round2 } from "@/lib/utils";
import { productSchema, categorySchema, loginSchema } from "@/lib/validators";
import type { OrderStatus, PaymentStatus } from "@/generated/prisma/client";

export type AdminState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

// ---------- Auth ----------

export async function adminLogin(
  _prev: AdminState | undefined,
  formData: FormData
): Promise<AdminState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || user.role !== "ADMIN" || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "Invalid credentials or no admin access." };
  }
  await setSessionCookie({ id: user.id, name: user.name, email: user.email, role: user.role });
  const next = formData.get("next");
  redirect(typeof next === "string" && next.startsWith("/admin") ? next : "/admin");
}

// ---------- Categories ----------

export async function createCategory(
  _prev: AdminState | undefined,
  formData: FormData
): Promise<AdminState> {
  await requireAdmin();
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    image: formData.get("image") || undefined,
    gstRate: formData.get("gstRate"),
    sortOrder: formData.get("sortOrder"),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const slug = uniqueSlug(parsed.data.name, "category");
  await prisma.category.create({
    data: {
      name: parsed.data.name,
      slug,
      description: parsed.data.description || null,
      image: parsed.data.image || null,
      gstRate: parsed.data.gstRate,
      sortOrder: parsed.data.sortOrder,
      isActive: parsed.data.isActive,
    },
  });
  revalidatePath("/admin/categories");
  return { success: true };
}

export async function updateCategory(
  _prev: AdminState | undefined,
  formData: FormData
): Promise<AdminState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    image: formData.get("image") || undefined,
    gstRate: formData.get("gstRate"),
    sortOrder: formData.get("sortOrder"),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) return { error: "Category not found." };

  await prisma.category.update({
    where: { id },
    data: {
      name: parsed.data.name,
      slug: parsed.data.name === category.name ? category.slug : uniqueSlug(parsed.data.name, "category"),
      description: parsed.data.description || null,
      image: parsed.data.image || null,
      gstRate: parsed.data.gstRate,
      sortOrder: parsed.data.sortOrder,
      isActive: parsed.data.isActive,
    },
  });

  if (parsed.data.gstRate !== category.gstRate) {
    await prisma.product.updateMany({
      where: { categoryId: id },
      data: { gstRate: parsed.data.gstRate },
    });
    revalidatePath("/admin/products");
  }

  revalidatePath("/admin/categories");
  return { success: true };
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) {
    // Move products to "Uncategorised" instead of failing
    return;
  }
  await prisma.category.deleteMany({ where: { id } });
  revalidatePath("/admin/categories");
}

// ---------- Products ----------

export async function createProduct(
  _prev: AdminState | undefined,
  formData: FormData
): Promise<AdminState> {
  await requireAdmin();
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    categoryId: formData.get("categoryId"),
    description: formData.get("description") || undefined,
    specifications: formData.get("specifications") || undefined,
    unit: formData.get("unit") || "pcs",
    price: formData.get("price"),
    gstRate: formData.get("gstRate"),
    hsnCode: formData.get("hsnCode") || undefined,
    minOrderQty: formData.get("minOrderQty"),
    stock: formData.get("stock"),
    isActive: formData.get("isActive") === "on",
    isFeatured: formData.get("isFeatured") === "on",
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const slug = uniqueSlug(parsed.data.name, "product");
  const image = String(formData.get("image") ?? "").trim();

  await prisma.product.create({
    data: {
      name: parsed.data.name,
      slug,
      categoryId: parsed.data.categoryId,
      description: parsed.data.description || null,
      specifications: parsed.data.specifications || null,
      images: image ? [image] : [],
      unit: parsed.data.unit,
      price: parsed.data.price ?? null,
      gstRate: parsed.data.gstRate,
      hsnCode: parsed.data.hsnCode || null,
      minOrderQty: parsed.data.minOrderQty,
      stock: parsed.data.stock ?? null,
      isActive: parsed.data.isActive,
      isFeatured: parsed.data.isFeatured,
    },
  });
  revalidatePath("/admin/products");
  return { success: true };
}

export async function updateProduct(
  _prev: AdminState | undefined,
  formData: FormData
): Promise<AdminState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    categoryId: formData.get("categoryId"),
    description: formData.get("description") || undefined,
    specifications: formData.get("specifications") || undefined,
    unit: formData.get("unit") || "pcs",
    price: formData.get("price"),
    gstRate: formData.get("gstRate"),
    hsnCode: formData.get("hsnCode") || undefined,
    minOrderQty: formData.get("minOrderQty"),
    stock: formData.get("stock"),
    isActive: formData.get("isActive") === "on",
    isFeatured: formData.get("isFeatured") === "on",
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return { error: "Product not found." };

  const image = String(formData.get("image") ?? "").trim();
  const images = image ? [image, ...product.images.filter((i) => i !== image).slice(0, 4)] : product.images;

  await prisma.product.update({
    where: { id },
    data: {
      name: parsed.data.name,
      slug: parsed.data.name === product.name ? product.slug : uniqueSlug(parsed.data.name, "product"),
      categoryId: parsed.data.categoryId,
      description: parsed.data.description || null,
      specifications: parsed.data.specifications || null,
      images,
      unit: parsed.data.unit,
      price: parsed.data.price ?? null,
      gstRate: parsed.data.gstRate,
      hsnCode: parsed.data.hsnCode || null,
      minOrderQty: parsed.data.minOrderQty,
      stock: parsed.data.stock ?? null,
      isActive: parsed.data.isActive,
      isFeatured: parsed.data.isFeatured,
    },
  });
  revalidatePath("/admin/products");
  revalidatePath(`/products/${product.slug}`);
  return { success: true };
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await prisma.product.deleteMany({ where: { id } });
  revalidatePath("/admin/products");
}

// ---------- Orders ----------

export async function updateOrderStatus(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const paymentStatus = String(formData.get("paymentStatus") ?? "");
  const adminNote = String(formData.get("adminNote") ?? "");

  const validStatuses: OrderStatus[] = [
    "PLACED", "QUOTED", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED",
  ];
  const validPayments: PaymentStatus[] = ["PENDING", "PARTIAL", "PAID", "REFUNDED"];
  if (!validStatuses.includes(status as OrderStatus)) return;
  if (!validPayments.includes(paymentStatus as PaymentStatus)) return;

  const data: Record<string, unknown> = { status, paymentStatus };
  if (adminNote) data.adminNote = adminNote;
  if (status === "SHIPPED") data.shippedAt = new Date();
  if (status === "DELIVERED") data.deliveredAt = new Date();
  if (status === "CANCELLED") data.cancelledAt = new Date();

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return;

  await prisma.order.update({ where: { id }, data });
  revalidatePath(`/admin/orders/${order.orderNumber}`);
  revalidatePath("/admin/orders");
}

export async function quoteOrder(
  _prev: AdminState | undefined,
  formData: FormData
): Promise<AdminState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) return { error: "Order not found." };

  // Read per-item unit price + gstRate from the form
  const updates = order.items.map((item) => {
    const unitPrice = Number(formData.get(`price_${item.id}`) ?? "");
    const gstRate = Number(formData.get(`gst_${item.id}`) ?? item.gstRate);
    return {
      id: item.id,
      unitPrice: Number.isFinite(unitPrice) && unitPrice > 0 ? round2(unitPrice) : null,
      gstRate: Number.isFinite(gstRate) ? gstRate : item.gstRate,
    };
  });

  if (updates.some((u) => u.unitPrice == null)) {
    return { error: "Every item needs a quote price." };
  }

  await prisma.$transaction(
    updates.map((u) =>
      prisma.orderItem.update({
        where: { id: u.id },
        data: { unitPrice: u.unitPrice, gstRate: u.gstRate },
      })
    )
  );

  // Recompute totals and set status to QUOTED
  const refreshed = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  const address = JSON.parse(order.addressSnapshot) as Record<string, string>;
  const totals = computeOrderTotals(refreshed!.items, address.state);

  await prisma.order.update({
    where: { id },
    data: {
      status: "QUOTED",
      amount: totals.grandTotal,
      taxAmount: totals.totalTax,
    },
  });

  revalidatePath(`/admin/orders/${order.orderNumber}`);
  return { success: true };
}

export async function deleteChallan(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const orderNumber = String(formData.get("orderNumber") ?? "");

  const challan = await prisma.deliveryChallan.findUnique({
    where: { id },
    include: { items: true, order: { select: { id: true, orderNumber: true } } },
  });
  if (!challan) return;

  await prisma.$transaction(async (tx) => {
    for (const item of challan.items) {
      await tx.orderItem.update({
        where: { id: item.orderItemId },
        data: { deliveredQty: { decrement: item.quantity } },
      });
    }
    await tx.deliveryChallan.delete({ where: { id } });

    const order = await tx.order.findUnique({
      where: { id: challan.orderId },
      include: { items: true },
    });
    if (order) {
      const anyDelivered = order.items.some((it) => it.deliveredQty > 0);
      const allDelivered =
        order.items.length > 0 && order.items.every((it) => it.deliveredQty >= it.quantity);
      const data: Record<string, unknown> = {};
      if (order.status === "DELIVERED" && !allDelivered) data.status = anyDelivered ? "SHIPPED" : "CONFIRMED";
      if (!anyDelivered) {
        data.shippedAt = null;
        data.deliveredAt = null;
      }
      if (Object.keys(data).length > 0) await tx.order.update({ where: { id: order.id }, data });
    }
  });

  revalidatePath(`/admin/orders/${orderNumber}`);
  revalidatePath("/admin/orders");
}

// ---------- Enquiries ----------

export async function updateEnquiryStatus(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["NEW", "RESPONDED", "CLOSED"].includes(status)) return;
  await prisma.enquiry.updateMany({ where: { id }, data: { status: status as "NEW" | "RESPONDED" | "CLOSED" } });
  revalidatePath("/admin/enquiries");
}

// ---------- Settings ----------

export async function updateSettings(
  _prev: AdminState | undefined,
  formData: FormData
): Promise<AdminState> {
  await requireAdmin();
  const keys = [
    "storeName", "tagline", "phone1", "phone2", "email", "whatsapp", "address",
    "businessHours", "mapEmbed", "gstin", "stateCode", "legalName", "invoicePrefix",
    "challanPrefix", "invoiceFooterNote", "currency", "bankName", "bankAccount",
    "bankIfsc", "bankBranch", "upiId",
  ];
  for (const key of keys) {
    const value = String(formData.get(key) ?? "").trim();
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
  revalidatePath("/admin/settings");
  return { success: true };
}

// ---------- Helpers ----------

function uniqueSlug(name: string, type: "product" | "category"): string {
  const base = slugify(name) || type;
  return base;
}

function computeOrderTotals(
  items: { quantity: number; unitPrice: number | null; gstRate: number }[],
  buyerState?: string
) {
  const intraState = (buyerState ?? "").trim().toUpperCase() === "24";
  let subtotal = 0;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  for (const it of items) {
    const taxable = round2((it.unitPrice ?? 0) * it.quantity);
    const tax = round2((taxable * it.gstRate) / 100);
    subtotal += taxable;
    if (intraState) {
      cgst += round2(tax / 2);
      sgst += round2(tax / 2);
    } else {
      igst += tax;
    }
  }
  const totalTax = round2(cgst + sgst + igst);
  return { subtotal: round2(subtotal), cgst, sgst, igst, totalTax, grandTotal: round2(subtotal + totalTax) };
}
