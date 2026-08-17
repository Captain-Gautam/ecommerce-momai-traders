import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatINR, formatDateTime } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/order/order-status";

export const metadata: Metadata = { title: "Orders" };

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "PLACED", label: "Awaiting quote" },
  { value: "QUOTED", label: "Quoted" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const orders = await prisma.order.findMany({
    where: status && status !== "all" ? { status: status as never } : undefined,
    include: { user: { select: { name: true } }, items: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const counts = await prisma.order.groupBy({ by: ["status"], _count: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="mt-1 text-sm text-gray-500">
          Quote prices, confirm and track customer orders.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => {
          const count = f.value ? counts.find((c) => c.status === f.value)?._count ?? 0 : orders.length;
          const isActive = (status ?? "") === f.value;
          return (
            <Link
              key={f.value || "all"}
              href={f.value ? `/admin/orders?status=${f.value}` : "/admin/orders"}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${isActive ? "bg-brand-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}
            >
              {f.label} <span className={isActive ? "opacity-70" : "text-gray-400"}>({count})</span>
            </Link>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Items</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.orderNumber}`} className="font-medium text-brand-600 hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{o.user.name}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {o.items.reduce((s, it) => s + it.quantity, 0)}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {o.amount != null ? formatINR(o.amount) : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{o.paymentStatus}</td>
                  <td className="px-4 py-3"><OrderStatusBadge status={o.status} /></td>
                  <td className="px-4 py-3 text-gray-500">{formatDateTime(o.createdAt)}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">No orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
