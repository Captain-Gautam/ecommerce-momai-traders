import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { generateChallanPdf } from "@/lib/delivery-challan";
import { parseOrderAddresses } from "@/lib/order-address";
import { formatDate } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ orderNumber: string; challanNumber: string }> };

export async function GET(req: Request, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { challanNumber } = await params;
  const showGst = new URL(req.url).searchParams.get("tax") === "gst";

  const challan = await prisma.deliveryChallan.findUnique({
    where: { challanNumber },
    include: {
      order: { select: { id: true, userId: true, orderNumber: true, user: { select: { role: true } } } },
      items: {
        orderBy: { id: "asc" },
        include: { orderItem: { select: { gstRate: true, unitPrice: true } } },
      },
    },
  });
  if (!challan) return NextResponse.json({ error: "Delivery challan not found" }, { status: 404 });

  const isOwner = challan.order.userId === session.id;
  const isAdmin = session.role === "ADMIN";
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const order = await prisma.order.findUnique({
    where: { id: challan.orderId },
    select: { addressSnapshot: true, shippingAddressSnapshot: true },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const settings = await getSettings();
  const { shipping } = parseOrderAddresses(order.addressSnapshot, order.shippingAddressSnapshot);

  const pdf = await generateChallanPdf({
    challanNumber: challan.challanNumber,
    challanDate: formatDate(challan.createdAt),
    orderNumber: challan.order.orderNumber,
    courierName: challan.courierName,
    trackingNumber: challan.trackingNumber,
    seller: {
      legalName: settings.legalName,
      gstin: settings.gstin,
      address: settings.address,
      phone: settings.phone1,
      email: settings.email,
    },
    buyer: {
      name: shipping.name ?? "Customer",
      businessName: shipping.businessName ?? null,
      line1: shipping.line1 ?? "",
      line2: shipping.line2 ?? null,
      city: shipping.city ?? "",
      state: shipping.state ?? "",
      pincode: shipping.pincode ?? "",
    },
    items: challan.items.map((it) => ({
      name: it.name,
      unit: it.unit,
      quantity: it.quantity,
      hsnCode: it.hsnCode,
      gstRate: it.orderItem?.gstRate,
      unitPrice: it.orderItem?.unitPrice,
    })),
    showGst,
  });

  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="challan-${challan.challanNumber}.pdf"`,
    },
  });
}
