import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatINR, formatDateTime } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/order/order-status";
import { Button } from "@/components/ui/button";

export default async function AdminDashboardPage() {
  const [
    orders,
    newEnquiries,
    newQuotes,
    products,
    customers,
    categories,
    todayOrders,
    outstanding,
  ] = await Promise.all([
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.enquiry.count({ where: { status: "NEW", type: "ENQUIRY" } }),
    prisma.enquiry.count({ where: { status: "NEW", type: "QUOTATION" } }),
    prisma.product.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.category.count({ where: { isActive: true } }),
    prisma.order.count({
      where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }),
    prisma.outstanding.findMany({
      where: { status: { not: "SETTLED" } },
      select: { amount: true, paidAmount: true },
    }),
  ]);
  const outstandingBalance = outstanding.reduce((s, o) => s + (o.amount - o.paidAmount), 0);

  const pendingQuotes = await prisma.order.count({ where: { status: "PLACED" } });
  const quoted = await prisma.order.count({ where: { status: "QUOTED" } });
  const confirmed = await prisma.order.findMany({
    where: { status: { in: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] }, amount: { not: null } },
    select: { amount: true },
  });
  const confirmedRevenue = confirmed.reduce((s, o) => s + (o.amount ?? 0), 0);

  const stats = [
    { label: "Orders today", value: String(todayOrders) },
    { label: "Awaiting quote", value: String(pendingQuotes), href: "/admin/orders" },
    { label: "Quoted, awaiting confirm", value: String(quoted), href: "/admin/orders" },
    { label: "Confirmed revenue", value: formatINR(confirmedRevenue) },
    { label: "New enquiries", value: String(newEnquiries), href: "/admin/enquiries" },
    { label: "New quotations", value: String(newQuotes), href: "/admin/quotes" },
    { label: "Active products", value: String(products) },
    { label: "Active categories", value: String(categories) },
    { label: "Customers", value: String(customers), href: "/admin/customers" },
    { label: "Outstanding", value: formatINR(outstandingBalance), href: "/admin/outstanding" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">A quick overview of your business.</p>
        </div>
        <Button asChild>
          <Link href="/admin/orders">View Orders</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
          >
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
            <p className="mt-1 text-xs font-medium text-gray-400">{s.label}</p>
            {s.href ? (
              <Link href={s.href} className="mt-2 inline-block text-xs font-medium text-brand-600 hover:text-brand-700">
                View →
              </Link>
            ) : null}
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            View all
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                <th className="pb-2 pr-4 font-semibold">Order</th>
                <th className="pb-2 pr-4 font-semibold">Date</th>
                <th className="pb-2 pr-4 font-semibold">Amount</th>
                <th className="pb-2 pr-4 font-semibold">Status</th>
                <th className="pb-2 font-semibold">Payment</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-gray-50 last:border-b-0">
                  <td className="py-3 pr-4">
                    <Link href={`/admin/orders/${o.orderNumber}`} className="font-medium text-brand-600 hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-gray-500">{formatDateTime(o.createdAt)}</td>
                  <td className="py-3 pr-4 font-medium text-gray-900">
                    {o.amount != null ? formatINR(o.amount) : "—"}
                  </td>
                  <td className="py-3 pr-4"><OrderStatusBadge status={o.status} /></td>
                  <td className="py-3 text-gray-500">{o.paymentStatus}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
