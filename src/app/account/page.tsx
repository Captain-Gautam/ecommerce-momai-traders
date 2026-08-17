import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { formatINR, formatDateTime } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/order/order-status";
import { Button } from "@/components/ui/button";

export const metadata = { title: "My Account" };

export default async function AccountPage() {
  const session = await getSession();
  if (!session) return null;

  const [orders, addressCount, cartCount] = await Promise.all([
    prisma.order.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.address.count({ where: { userId: session.id } }),
    prisma.cartItem.count({ where: { userId: session.id } }),
  ]);

  const pendingQuotes = orders.filter((o) => o.status === "PLACED" || o.status === "QUOTED").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your orders, addresses and account details.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Orders" value={String(orders.length)} href="/account/orders" />
        <StatCard label="Awaiting quote" value={String(pendingQuotes)} href="/account/orders" />
        <StatCard label="Saved addresses" value={String(addressCount)} href="/account/addresses" />
        <StatCard label="Cart items" value={String(cartCount)} href="/cart" />
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
          <Link href="/account/orders" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            View all
          </Link>
        </div>
        {orders.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-gray-200 p-8 text-center">
            <p className="text-sm text-gray-500">You haven&apos;t placed any orders yet.</p>
            <Button asChild className="mt-3">
              <Link href="/products">Browse products</Link>
            </Button>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-gray-100">
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/account/orders/${o.orderNumber}`}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 hover:bg-brand-50/50"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{o.orderNumber}</p>
                    <p className="text-xs text-gray-400">{formatDateTime(o.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900">
                      {o.amount != null ? formatINR(o.amount) : "Quote pending"}
                    </span>
                    <OrderStatusBadge status={o.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-xs font-medium text-gray-400">{label}</p>
    </Link>
  );
}
