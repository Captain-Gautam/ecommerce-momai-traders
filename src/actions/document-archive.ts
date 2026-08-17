"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { parseOrderAddresses } from "@/lib/order-address";
import { uploadStampedCopy } from "@/lib/cloudinary";

export type ArchiveUploadState = {
  success?: boolean;
  error?: string;
};

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB — Vercel Hobby body limit is ~4.5 MB

const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "application/pdf": "pdf",
};

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

export async function uploadStampedCopyAction(
  _prev: ArchiveUploadState | undefined,
  formData: FormData
): Promise<ArchiveUploadState> {
  await requireAdmin();

  const orderId = String(formData.get("orderId") ?? "");
  const docTypeRaw = String(formData.get("docType") ?? "INVOICE");
  const challanId = String(formData.get("challanId") ?? "") || null;
  const file = formData.get("file");

  if (!orderId) return { error: "Missing order." };
  if (!(file instanceof File)) return { error: "Choose a file to upload." };
  if (file.size === 0) return { error: "The selected file is empty." };
  if (file.size > MAX_BYTES) return { error: "File is too large — keep it under 4 MB." };
  const ext = MIME_TO_EXT[file.type];
  if (!ext) return { error: "Only PDF, PNG or JPG files are allowed." };

  const docType = docTypeRaw === "CHALLAN" ? "CHALLAN" : "INVOICE";

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true, challans: true },
  });
  if (!order) return { error: "Order not found." };

  const challan = challanId ? order.challans.find((c) => c.id === challanId) : undefined;
  if (docType === "CHALLAN" && challanId && !challan) return { error: "Challan not found on this order." };

  const { shipping } = parseOrderAddresses(order.addressSnapshot, order.shippingAddressSnapshot);
  const company = shipping.businessName || order.user.businessName || order.user.name || "Unknown";
  const state = shipping.state || "No State";

  const docDate = challan ? challan.createdAt : (order.invoiceDate ?? new Date());
  const docRef = challan ? challan.challanNumber : (order.invoiceNumber ?? order.orderNumber);
  const fileName = `${challan ? "challan" : "invoice"}-${docRef}-${timestamp()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  let uploaded: { publicId: string; secureUrl: string; folderPath: string };
  try {
    uploaded = await uploadStampedCopy({
      company,
      state,
      date: docDate,
      docType,
      fileName,
      mimeType: file.type,
      buffer,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { error: `Upload failed: ${message}` };
  }

  await prisma.documentArchive.create({
    data: {
      orderId: order.id,
      challanId: challan?.id ?? null,
      docType,
      fileName,
      driveFileId: uploaded.publicId,
      driveUrl: uploaded.secureUrl,
      folderPath: uploaded.folderPath,
    },
  });

  revalidatePath(`/admin/orders/${order.orderNumber}`);
  return { success: true };
}
