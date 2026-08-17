"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { round2 } from "@/lib/utils";
import type { PaymentMode, OutstandingStatus } from "@/generated/prisma/client";

export type PaymentFormState = {
  success?: boolean;
  error?: string;
};

const MODES: PaymentMode[] = ["CHEQUE", "NEFT_RTGS_UPI", "CASH"];

function strOrNull(value: FormDataEntryValue | null): string | null {
  const s = typeof value === "string" ? value.trim() : "";
  return s || null;
}

function parseChequeDate(raw: string): Date | null | undefined {
  if (!raw) return null;
  const d = new Date(`${raw}T00:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function parsePaymentDate(raw: string): Date | null | undefined {
  return parseChequeDate(raw);
}

export async function recordOutstandingPayment(
  _prev: PaymentFormState | undefined,
  formData: FormData
): Promise<PaymentFormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const amount = Number(formData.get("amount") ?? "");
  const modeRaw = String(formData.get("mode") ?? "CHEQUE");

  if (!MODES.includes(modeRaw as PaymentMode)) return { error: "Invalid payment mode." };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter a valid amount." };

  const outstanding = await prisma.outstanding.findUnique({ where: { id } });
  if (!outstanding) return { error: "Outstanding entry not found." };

  const balance = round2(outstanding.amount - outstanding.paidAmount);
  if (amount > balance + 0.001) {
    return { error: `Amount exceeds the balance of ${balance.toFixed(2)}.` };
  }

  const chequeDate = parseChequeDate(String(formData.get("chequeDate") ?? ""));
  if (chequeDate === undefined) return { error: "Invalid cheque date." };
  const paymentDate = parsePaymentDate(String(formData.get("paymentDate") ?? ""));
  if (paymentDate === undefined) return { error: "Invalid payment date." };

  const paidAfter = round2(outstanding.paidAmount + amount);
  const settled = paidAfter >= outstanding.amount - 0.001;
  const status: OutstandingStatus = settled ? "SETTLED" : "PARTIALLY_PAID";

  await prisma.$transaction(async (tx) => {
    await tx.outstandingPayment.create({
      data: {
        outstandingId: outstanding.id,
        amount: round2(amount),
        mode: modeRaw as PaymentMode,
        referenceNo: strOrNull(formData.get("referenceNo")),
        bankName: strOrNull(formData.get("bankName")),
        branch: strOrNull(formData.get("branch")),
        chequeDate,
        paymentDate: paymentDate ?? new Date(),
        note: strOrNull(formData.get("note")),
      },
    });
    await tx.outstanding.update({
      where: { id: outstanding.id },
      data: { paidAmount: paidAfter, status },
    });
    if (settled) {
      await tx.order.update({
        where: { id: outstanding.orderId },
        data: { paymentStatus: "PAID" },
      });
    }
  });

  revalidatePath("/admin/outstanding");
  return { success: true };
}

export async function updateOutstandingPayment(
  _prev: PaymentFormState | undefined,
  formData: FormData
): Promise<PaymentFormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const amount = Number(formData.get("amount") ?? "");
  const modeRaw = String(formData.get("mode") ?? "CHEQUE");

  if (!MODES.includes(modeRaw as PaymentMode)) return { error: "Invalid payment mode." };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter a valid amount." };

  const payment = await prisma.outstandingPayment.findUnique({
    where: { id },
    include: { outstanding: true },
  });
  if (!payment) return { error: "Payment not found." };

  // Balance available for this payment = invoice balance + this payment's own amount.
  const otherPaid = round2(payment.outstanding.paidAmount - payment.amount);
  const available = round2(payment.outstanding.amount - otherPaid);
  if (amount > available + 0.001) {
    return { error: `Amount exceeds the balance of ${available.toFixed(2)}.` };
  }

  const chequeDate = parseChequeDate(String(formData.get("chequeDate") ?? ""));
  if (chequeDate === undefined) return { error: "Invalid cheque date." };
  const paymentDate = parsePaymentDate(String(formData.get("paymentDate") ?? ""));
  if (paymentDate === undefined) return { error: "Invalid payment date." };

  const paidAfter = round2(otherPaid + amount);
  const settled = paidAfter >= payment.outstanding.amount - 0.001;
  const status: OutstandingStatus =
    settled ? "SETTLED" : paidAfter <= 0.001 ? "OPEN" : "PARTIALLY_PAID";

  await prisma.$transaction(async (tx) => {
    await tx.outstandingPayment.update({
      where: { id },
      data: {
        amount: round2(amount),
        mode: modeRaw as PaymentMode,
        referenceNo: strOrNull(formData.get("referenceNo")),
        bankName: strOrNull(formData.get("bankName")),
        branch: strOrNull(formData.get("branch")),
        chequeDate,
        paymentDate,
        note: strOrNull(formData.get("note")),
      },
    });
    await tx.outstanding.update({
      where: { id: payment.outstandingId },
      data: { paidAmount: paidAfter, status },
    });
    if (settled) {
      await tx.order.update({
        where: { id: payment.outstanding.orderId },
        data: { paymentStatus: "PAID" },
      });
    }
  });

  revalidatePath("/admin/outstanding");
  return { success: true };
}

export async function deleteOutstandingPayment(
  _prev: PaymentFormState | undefined,
  formData: FormData
): Promise<PaymentFormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const payment = await prisma.outstandingPayment.findUnique({
    where: { id },
    include: { outstanding: true },
  });
  if (!payment) return { error: "Payment not found." };

  const paidAfter = round2(payment.outstanding.paidAmount - payment.amount);
  const status: OutstandingStatus =
    paidAfter <= 0.001
      ? "OPEN"
      : paidAfter >= payment.outstanding.amount - 0.001
        ? "SETTLED"
        : "PARTIALLY_PAID";

  await prisma.$transaction(async (tx) => {
    await tx.outstandingPayment.delete({ where: { id } });
    await tx.outstanding.update({
      where: { id: payment.outstandingId },
      data: { paidAmount: Math.max(0, paidAfter), status },
    });
  });

  revalidatePath("/admin/outstanding");
  return { success: true };
}
