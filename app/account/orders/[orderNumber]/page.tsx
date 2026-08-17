import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { cancelOrder } from "@/actions/order-actions";
import { computeInvoiceTotals } from "@/lib/invoice";
import { formatINR, formatDateTime } from "@/lib/utils";
import { OrderStatusBadge, OrderStatusTimeline } from "@/components/order/order-status";
import { AddressBlock } from "@/components/order/address-block";
import { Button } from "@/components/ui/button";
import { parseOrderAddresses } from "@/lib/order-address";
import { buildTrackingUrl } from "@/lib/tracking";
import { ChallanDownload } from "@/components/challan-download";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Order Details" };

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ placed?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const { orderNumber } = await params;
  const { placed } = await searchParams;

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true, challans: { include: { items: true }, orderBy: { createdAt: "desc" } } },
  });

  if (!order || order.userId !== session.id) notFound();

  const { billing, shipping } = parseOrderAddresses(order.addressSnapshot, order.shippingAddressSnapshot);
  const settings = await getSettings();
  const allQuoted = order.items.every((it) => it.unitPrice != null);
  const fullyDelivered =
    order.items.length > 0 && order.items.every((it) => it.deliveredQty >= it.quantity);
  const totals = allQuoted
    ? computeInvoiceTotals(
        order.items.map((it) => ({
          name: it.name,
          hsnCode: it.hsnCode,
          quantity: it.quantity,
          unit: it.unit,
          unitPrice: it.unitPrice,
          gstRate: it.gstRate,
        })),
        billing.state
      )
    : null;

  const cancellable = order.status === "PLACED" || order.status === "QUOTED";
  const canDownload = allQuoted && fullyDelivered && order.status !== "CANCELLED";

  return (
    <div className="mx-auto max-w-4xl">
      {placed === "1" && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <h2 className="text-lg font-bold text-emerald-800">Order placed successfully!</h2>
          <p className="mt-1 text-sm text-emerald-700">
            No payment is needed yet. Our team will send you the final quote on WhatsApp/phone within business hours.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-gray-500">Placed on {formatDateTime(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} className="text-sm" />
      </div>

      <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-5">
        <OrderStatusTimeline status={order.status} />
        <div className="mt-4 flex flex-wrap gap-3 border-t border-gray-100 pt-4">
          {canDownload && (
            <Button asChild>
              <a href={`/api/orders/${order.orderNumber}/invoice`} target="_blank">
                Download GST Invoice
              </a>
            </Button>
          )}
          {allQuoted && !fullyDelivered && order.status !== "CANCELLED" && (
            <span className="inline-flex items-center rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs font-medium text-gray-500">
              GST invoice will unlock once your order is fully dispatched
            </span>
          )}
          {cancellable && (
            <form action={cancelOrder} className="inline">
              <input type="hidden" name="orderNumber" value={order.orderNumber} />
              <Button type="submit" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                Cancel Order
              </Button>
            </form>
          )}
        </div>
      </div>

      {!allQuoted && order.status !== "CANCELLED" && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Your order is awaiting a price quote from our team. You&apos;ll be notified on WhatsApp once the final price
          is confirmed.
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="text-lg font-bold text-gray-900">Items</h2>
            <ul className="mt-3 divide-y divide-gray-100 text-sm">
              {order.items.map((it) => (
                <li key={it.id} className="flex justify-between gap-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900">{it.name}</p>
                    <p className="text-xs text-gray-400">
                      {it.quantity} × {it.unit} {it.hsnCode ? `· HSN ${it.hsnCode}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {it.unitPrice != null ? formatINR(it.unitPrice * it.quantity) : "—"}
                    </p>
                    {it.unitPrice != null && (
                      <p className="text-xs text-gray-400">{formatINR(it.unitPrice)} / {it.unit}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-4 space-y-4">
            <AddressBlock title="Billing Address" address={billing} />
            <AddressBlock title="Shipping Address" address={shipping} />
          </div>

          {order.challans.length > 0 && (
            <section className="mt-4 rounded-2xl border border-gray-200 bg-white p-5">
              <h2 className="text-lg font-bold text-gray-900">Deliveries ({order.challans.length})</h2>
              <ul className="mt-3 divide-y divide-gray-100">
                {order.challans.map((c) => {
                  const trackUrl = buildTrackingUrl(c.courierName, c.trackingNumber, c.trackingUrl);
                  return (
                    <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{c.challanNumber}</p>
                        <p className="text-xs text-gray-400">
                          {formatDateTime(c.createdAt)} · {c.items.reduce((s, i) => s + i.quantity, 0)} units
                          {c.courierName || c.trackingNumber
                            ? ` · ${[c.courierName, c.trackingNumber].filter(Boolean).join(" · ")}`
                            : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {trackUrl ? (
                          <a href={trackUrl} target="_blank" rel="noreferrer">
                            <Button variant="outline" className="h-8 px-3 text-xs">Track package</Button>
                          </a>
                        ) : null}
                        <ChallanDownload
                          label="Delivery Challan"
                          href={`/api/orders/${order.orderNumber}/challan/${c.challanNumber}`}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="text-lg font-bold text-gray-900">Summary</h2>
            {totals ? (
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <dt>Subtotal</dt>
                  <dd className="font-medium text-gray-900">{formatINR(totals.subtotal)}</dd>
                </div>
                {totals.cgst > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <dt>CGST</dt>
                    <dd className="font-medium text-gray-900">{formatINR(totals.cgst)}</dd>
                  </div>
                )}
                {totals.sgst > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <dt>SGST</dt>
                    <dd className="font-medium text-gray-900">{formatINR(totals.sgst)}</dd>
                  </div>
                )}
                {totals.igst > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <dt>IGST</dt>
                    <dd className="font-medium text-gray-900">{formatINR(totals.igst)}</dd>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-bold text-gray-900">
                  <dt>Total</dt>
                  <dd>{formatINR(totals.grandTotal)}</dd>
                </div>
              </dl>
            ) : (
              <p className="mt-3 text-sm text-gray-500">Total will appear once our team confirms the quote.</p>
            )}
            <dl className="mt-4 space-y-2 border-t border-gray-100 pt-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <dt>Payment</dt>
                <dd className="font-medium text-gray-900">{paymentLabel(order.paymentMethod)}</dd>
              </div>
              <div className="flex justify-between text-gray-600">
                <dt>Payment status</dt>
                <dd className={cn("font-medium", order.paymentStatus === "PAID" ? "text-emerald-600" : "text-amber-600")}>
                  {order.paymentStatus}
                </dd>
              </div>
            </dl>
            {order.customerNote && (
              <div className="mt-4 rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-600">
                <strong className="text-gray-900">Note:</strong> {order.customerNote}
              </div>
            )}
          </section>

          <p className="text-center text-xs text-gray-400">
            Need help? Call {settings.phone1} · {settings.phone2}
          </p>
        </div>
      </div>
    </div>
  );
}

function paymentLabel(method: string): string {
  switch (method) {
    case "COD":
      return "Cash on Delivery";
    case "BANK_TRANSFER":
      return "Bank Transfer / UPI";
    case "WHATSAPP":
      return "WhatsApp";
    default:
      return method;
  }
}
