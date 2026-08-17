import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { buildOutstandingExcel } from "@/lib/outstanding-excel";
import type { OutstandingStatus } from "@/generated/prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? "";
  const q = url.searchParams.get("q") ?? "";
  const state = url.searchParams.get("state") ?? "";

  const statusFilter: OutstandingStatus | undefined =
    status === "OPEN" || status === "PARTIALLY_PAID" || status === "SETTLED"
      ? (status as OutstandingStatus)
      : undefined;

  const where = {
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(q.trim()
      ? {
          OR: [
            { company: { contains: q.trim(), mode: "insensitive" as const } },
            { contactName: { contains: q.trim(), mode: "insensitive" as const } },
            { city: { contains: q.trim(), mode: "insensitive" as const } },
            { invoiceNumber: { contains: q.trim(), mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(state.trim()
      ? { state: { contains: state.trim(), mode: "insensitive" as const } }
      : {}),
  };

  const rows = await prisma.outstanding.findMany({
    where,
    include: { order: { select: { orderNumber: true } } },
    orderBy: [{ company: "asc" }, { city: "asc" }, { invoiceDate: "desc" }],
  });

  const buffer = await buildOutstandingExcel(
    rows.map((r) => ({
      company: r.company,
      contactName: r.contactName,
      city: r.city,
      state: r.state,
      invoiceNumber: r.invoiceNumber,
      orderNumber: r.order?.orderNumber ?? "",
      invoiceDate: r.invoiceDate,
      amount: r.amount,
      paidAmount: r.paidAmount,
      balance: Math.round((r.amount - r.paidAmount) * 100) / 100,
      status: r.status,
    }))
  );

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="outstanding.xlsx"`,
    },
  });
}
