import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { computeInvoiceTotals } from "@/lib/invoice";
import { formatINR, formatDateTime } from "@/lib/utils";
import { updateOrderStatus, deleteChallan } from "@/actions/admin-actions";
import { createDeliveryChallan } from "@/actions/dispatch-actions";
import { OrderStatusBadge } from "@/components/order/order-status";
import { AddressBlock } from "@/components/order/address-block";
import { ChallanTrackingForm } from "@/components/admin/challan-tracking-form";
import { ChallanDownload } from "@/components/challan-download";
import { parseOrderAddresses } from "@/lib/order-address";
import { QuoteForm } from "@/components/admin/quote-form";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { ConfirmForm } from "@/components/ui/confirm-form";
import { StampedCopyUpload } from "@/components/admin/stamped-copy-upload";

export const metadata: Metadata = { title: "Order Detail" };

const STATUS_OPTIONS = [
  "PLACED", "QUOTED", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED",
];
const PAYMENT_OPTIONS = ["PENDING", "PARTIAL", "PAID", "REFUNDED"];

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, businessName: true } },
      items: true,
      challans: { include: { items: true }, orderBy: { createdAt: "desc" } },
      documentArchives: { orderBy: { uploadedAt: "desc" } },
    },
  });
  if (!order) notFound();

  const { billing, shipping } = parseOrderAddresses(order.addressSnapshot, order.shippingAddressSnapshot);
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

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/orders" className="text-sm font-medium text-brand-600 hover:underline">← Back to orders</Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{order.orderNumber}</h1>
            <p className="mt-1 text-sm text-gray-500">Placed {formatDateTime(order.createdAt)}</p>
          </div>
          <OrderStatusBadge status={order.status} className="text-sm" />
        </div>
      </div>

      {/* Status controls */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-bold text-gray-900">Update Status</h2>
        <form action={updateOrderStatus} className="mt-3 flex flex-wrap items-end gap-3">
          <input type="hidden" name="id" value={order.id} />
          <Field label="Order status">
            <select
              name="status"
              defaultValue={order.status}
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Payment status">
            <select
              name="paymentStatus"
              defaultValue={order.paymentStatus}
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm"
            >
              {PAYMENT_OPTIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </Field>
          <Field label="Admin note (sent to customer)">
            <input
              name="adminNote"
              defaultValue={order.adminNote ?? ""}
              className="h-10 w-64 rounded-lg border border-gray-300 px-3 text-sm"
              placeholder="e.g. Delivery expected Thursday"
            />
          </Field>
          <Button type="submit">Save</Button>
        </form>
      </section>

      {allQuoted && (
        <div className="flex flex-wrap gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          {fullyDelivered ? (
            <a href={`/api/orders/${order.orderNumber}/invoice`} target="_blank">
              <Button variant="dark">Download GST Invoice</Button>
            </a>
          ) : (
            <span className="inline-flex items-center rounded-lg border border-dashed border-emerald-300 px-3 py-2 text-xs font-medium text-emerald-700">
              Invoice unlocks once the order is fully dispatched ({order.items.filter((it) => it.deliveredQty < it.quantity).length} item(s) pending)
            </span>
          )}
          {fullyDelivered && (
            <StampedCopyUpload orderId={order.id} docType="INVOICE" label="Upload stamped invoice copy" />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Quote form */}
          {order.status === "PLACED" && (
            <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
              <h2 className="text-lg font-bold text-gray-900">Set Quotation</h2>
              <p className="mt-1 text-sm text-gray-500">
                Enter the wholesale price for each item. The total (with GST) is computed automatically.
              </p>
              <div className="mt-4">
                <QuoteForm orderId={order.id} items={order.items} />
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="text-lg font-bold text-gray-900">Items</h2>
            <ul className="mt-3 divide-y divide-gray-100 text-sm">
              {order.items.map((it) => (
                <li key={it.id} className="flex justify-between gap-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900">{it.name}</p>
                    <p className="text-xs text-gray-400">
                      {it.quantity} × {it.unit} · HSN {it.hsnCode ?? "-"} · GST {it.gstRate}%
                    </p>
                    {allQuoted && (
                      <p className="mt-0.5 text-xs text-gray-400">
                        Delivered {it.deliveredQty} of {it.quantity}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {it.unitPrice != null ? formatINR(it.unitPrice * it.quantity) : <span className="text-amber-600">Unquoted</span>}
                    </p>
                    {it.unitPrice != null && <p className="text-xs text-gray-400">{formatINR(it.unitPrice)} / {it.unit}</p>}
                  </div>
                </li>
              ))}
            </ul>
            {totals ? (
              <dl className="mt-3 space-y-1.5 border-t border-gray-100 pt-3 text-sm">
                <div className="flex justify-between text-gray-600"><dt>Subtotal</dt><dd className="font-medium text-gray-900">{formatINR(totals.subtotal)}</dd></div>
                {totals.cgst > 0 && <div className="flex justify-between text-gray-600"><dt>CGST</dt><dd className="font-medium text-gray-900">{formatINR(totals.cgst)}</dd></div>}
                {totals.sgst > 0 && <div className="flex justify-between text-gray-600"><dt>SGST</dt><dd className="font-medium text-gray-900">{formatINR(totals.sgst)}</dd></div>}
                {totals.igst > 0 && <div className="flex justify-between text-gray-600"><dt>IGST</dt><dd className="font-medium text-gray-900">{formatINR(totals.igst)}</dd></div>}
                <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-bold text-gray-900"><dt>Total</dt><dd>{formatINR(totals.grandTotal)}</dd></div>
              </dl>
            ) : (
              <p className="mt-3 text-sm text-gray-400">Quote the order to see the GST breakdown.</p>
            )}
          </section>

          {/* Dispatch / Delivery challans */}
          {allQuoted && order.status !== "CANCELLED" && (
            <section className="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 className="text-lg font-bold text-gray-900">Dispatch — Delivery Challan</h2>
              <p className="mt-1 text-sm text-gray-500">
                Enter how many units go out in this lot. Pending quantities are listed below.
              </p>
              <form action={createDeliveryChallan} className="mt-4 space-y-3">
                <input type="hidden" name="id" value={order.id} />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Field label="Courier (optional)">
                    <input
                      name="courierName"
                      className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
                      placeholder="e.g. Delhivery"
                    />
                  </Field>
                  <Field label="Tracking / AWB (optional)">
                    <input
                      name="trackingNumber"
                      className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
                      placeholder="e.g. 2837788500730"
                    />
                  </Field>
                  <Field label="Tracking URL (optional)">
                    <input
                      name="trackingUrl"
                      className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
                      placeholder="https://… overrides courier link"
                    />
                  </Field>
                </div>
                <div className="divide-y divide-gray-100 rounded-xl border border-gray-200">
                  {order.items.map((it) => {
                    const remaining = it.quantity - it.deliveredQty;
                    return (
                      <div key={it.id} className="flex items-center justify-between gap-4 px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{it.name}</p>
                          <p className="text-xs text-gray-400">
                            {it.unitPrice != null ? `${formatINR(it.unitPrice)} / ${it.unit}` : ""} · Pending: {remaining}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">Qty</span>
                          <input
                            type="number"
                            name={`qty_${it.id}`}
                            min={0}
                            max={remaining}
                            defaultValue={0}
                            className="h-9 w-24 rounded-lg border border-gray-300 px-3 text-sm"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Button type="submit">Create Delivery Challan</Button>
              </form>

              {order.challans.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-bold text-gray-900">Challan history ({order.challans.length})</h3>
                  <ul className="mt-2 divide-y divide-gray-100">
                    {order.challans.map((c) => (
                      <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
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
                          <ChallanTrackingForm
                            challan={{
                              id: c.id,
                              courierName: c.courierName,
                              trackingNumber: c.trackingNumber,
                              trackingUrl: c.trackingUrl,
                            }}
                          />
                          <ChallanDownload href={`/api/orders/${order.orderNumber}/challan/${c.challanNumber}`} />
                          <StampedCopyUpload orderId={order.id} docType="CHALLAN" challanId={c.id} label="Upload stamped copy" />
                          <ConfirmForm message={`Delete challan "${c.challanNumber}"? This cannot be undone.`} action={deleteChallan}>
                            <input type="hidden" name="id" value={c.id} />
                            <input type="hidden" name="orderNumber" value={order.orderNumber} />
                            <Button type="submit" variant="outline" className="h-8 border-red-200 px-3 text-xs text-red-600 hover:bg-red-50">
                              Delete
                            </Button>
                          </ConfirmForm>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {order.documentArchives.length > 0 && (
            <section className="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 className="text-lg font-bold text-gray-900">Stamped copies</h2>
              <p className="mt-1 text-xs text-gray-500">
                Scanned stamped copies archived in Cloudinary · {order.documentArchives.length} file(s)
              </p>
              <ul className="mt-3 divide-y divide-gray-100 text-sm">
                {order.documentArchives.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{a.fileName}</p>
                      <p className="text-xs text-gray-400">
                        {a.docType === "INVOICE" ? "Invoice" : "Delivery Challan"} · {formatDateTime(a.uploadedAt)}
                      </p>
                      <p className="text-[11px] text-gray-400">{a.folderPath}</p>
                    </div>
                    {a.driveUrl ? (
                      <a href={a.driveUrl} target="_blank" className="text-xs font-medium text-brand-600 hover:underline">
                        View
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="text-lg font-bold text-gray-900">Customer</h2>
            <div className="mt-3 text-sm text-gray-700">
              <p className="font-semibold text-gray-900">
                {order.user.businessName ? `${order.user.name} (${order.user.businessName})` : order.user.name}
              </p>
              <p className="mt-1">{order.user.email}</p>
              {order.user.phone ? <p>{order.user.phone}</p> : null}
              <Link href={`/admin/customers`} className="mt-2 inline-block text-xs font-medium text-brand-600 hover:underline">
                View customer
              </Link>
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <AddressBlock title="Billing Address" address={billing} />
          <AddressBlock title="Shipping Address" address={shipping} />

          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="text-lg font-bold text-gray-900">Payment</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600"><dt>Method</dt><dd className="font-medium text-gray-900">{order.paymentMethod}</dd></div>
              <div className="flex justify-between text-gray-600"><dt>Status</dt><dd className="font-medium text-gray-900">{order.paymentStatus}</dd></div>
              {order.invoiceNumber ? (
                <>
                  <div className="flex justify-between text-gray-600"><dt>Invoice #</dt><dd className="font-medium text-gray-900">{order.invoiceNumber}</dd></div>
                  <div className="flex justify-between text-gray-600"><dt>Invoice date</dt><dd className="font-medium text-gray-900">{order.invoiceDate ? formatDateTime(order.invoiceDate) : "—"}</dd></div>
                </>
              ) : (
                <p className="text-xs text-gray-400">Invoice number is assigned on first download (after full dispatch).</p>
              )}
            </dl>
          </section>

          {order.customerNote && (
            <section className="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 className="text-sm font-bold text-gray-900">Customer note</h2>
              <p className="mt-2 text-sm text-gray-600">{order.customerNote}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
