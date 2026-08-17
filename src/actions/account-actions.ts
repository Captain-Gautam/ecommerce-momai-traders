"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { addressSchema } from "@/lib/validators";

export type ProfileState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function updateProfile(
  _prev: ProfileState | undefined,
  formData: FormData
): Promise<ProfileState> {
  const session = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const businessName = String(formData.get("businessName") ?? "").trim();

  if (name.length < 2) return { fieldErrors: { name: ["Please enter your full name"] } };
  if (!/^[0-9+\s-]{10,15}$/.test(phone)) {
    return { fieldErrors: { phone: ["Please enter a valid phone number"] } };
  }

  await prisma.user.update({
    where: { id: session.id },
    data: {
      name,
      phone,
      businessName: businessName || null,
    },
  });

  revalidatePath("/account");
  return { success: true };
}

export async function changePassword(
  _prev: ProfileState | undefined,
  formData: FormData
): Promise<ProfileState> {
  const session = await requireUser();
  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) return { error: "User not found." };

  const { verifyPassword } = await import("@/lib/password");
  if (!(await verifyPassword(current, user.passwordHash))) {
    return { error: "Current password is incorrect." };
  }
  if (next.length < 8) return { error: "New password must be at least 8 characters." };
  if (next !== confirm) return { error: "New passwords do not match." };

  await prisma.user.update({
    where: { id: session.id },
    data: { passwordHash: await hashPassword(next) },
  });
  return { success: true };
}

export async function addAddress(
  _prev: ProfileState | undefined,
  formData: FormData
): Promise<ProfileState> {
  const session = await requireUser();
  const parsed = addressSchema.safeParse({
    line1: formData.get("line1"),
    line2: formData.get("line2") || undefined,
    city: formData.get("city"),
    state: formData.get("state"),
    pincode: formData.get("pincode"),
    phone: formData.get("phone") || undefined,
    isDefault: formData.get("isDefault") === "on",
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const a = parsed.data;
  const count = await prisma.address.count({ where: { userId: session.id } });
  const makeDefault = a.isDefault || count === 0;

  if (makeDefault) {
    await prisma.address.updateMany({ where: { userId: session.id }, data: { isDefault: false } });
  }
  await prisma.address.create({
    data: {
      userId: session.id,
      line1: a.line1,
      line2: a.line2 || null,
      city: a.city,
      state: a.state,
      pincode: a.pincode,
      phone: a.phone || null,
      isDefault: makeDefault,
    },
  });
  revalidatePath("/account/addresses");
  return { success: true };
}

export async function updateAddress(
  _prev: ProfileState | undefined,
  formData: FormData
): Promise<ProfileState> {
  const session = await requireUser();
  const id = String(formData.get("id") ?? "");
  const parsed = addressSchema.safeParse({
    line1: formData.get("line1"),
    line2: formData.get("line2") || undefined,
    city: formData.get("city"),
    state: formData.get("state"),
    pincode: formData.get("pincode"),
    phone: formData.get("phone") || undefined,
    isDefault: formData.get("isDefault") === "on",
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const existing = await prisma.address.findFirst({ where: { id, userId: session.id } });
  if (!existing) return { error: "Address not found." };

  if (parsed.data.isDefault) {
    await prisma.address.updateMany({ where: { userId: session.id }, data: { isDefault: false } });
  }
  await prisma.address.update({
    where: { id },
    data: {
      line1: parsed.data.line1,
      line2: parsed.data.line2 || null,
      city: parsed.data.city,
      state: parsed.data.state,
      pincode: parsed.data.pincode,
      phone: parsed.data.phone || null,
      isDefault: parsed.data.isDefault || existing.isDefault,
    },
  });
  revalidatePath("/account/addresses");
  return { success: true };
}

export async function deleteAddress(formData: FormData) {
  const session = await requireUser();
  const id = String(formData.get("id") ?? "");
  const deleted = await prisma.address.deleteMany({ where: { id, userId: session.id } });
  if (deleted.count > 0) {
    const any = await prisma.address.findFirst({ where: { userId: session.id } });
    if (any) {
      await prisma.address.updateMany({ where: { userId: session.id }, data: { isDefault: false } });
      await prisma.address.update({ where: { id: any.id }, data: { isDefault: true } });
    }
  }
  revalidatePath("/account/addresses");
}

export async function setDefaultAddress(formData: FormData) {
  const session = await requireUser();
  const id = String(formData.get("id") ?? "");
  await prisma.address.updateMany({ where: { userId: session.id }, data: { isDefault: false } });
  await prisma.address.updateMany({ where: { id, userId: session.id }, data: { isDefault: true } });
  revalidatePath("/account/addresses");
}
