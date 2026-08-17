import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generateInvoicePdf } from "@/lib/invoice";
import { buildInvoiceForOrder } from "@/lib/invoice-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ orderNumber: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { orderNumber } = await params;

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true, user: { select: { role: true } } },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const isOwner = order.userId === session.id;
  const isAdmin = session.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (order.status === "CANCELLED") {
    return NextResponse.json({ error: "This order is cancelled" }, { status: 409 });
  }
  if (order.items.some((it) => it.unitPrice == null)) {
    return NextResponse.json(
      { error: "Prices not confirmed yet — the invoice is available once your order is quoted." },
      { status: 409 }
    );
  }
  if (!order.items.every((it) => it.deliveredQty >= it.quantity)) {
    return NextResponse.json(
      { error: "The invoice is generated once your order has been fully dispatched." },
      { status: 409 }
    );
  }

  const { data } = await buildInvoiceForOrder(order);
  const pdf = await generateInvoicePdf(data);

  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${order.orderNumber}.pdf"`,
    },
  });
}
