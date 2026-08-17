import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { formatINR, formatDateTime } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/order/order-status";
import { EmptyState } from "@/components/ui";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "My Orders" };

export default async function OrdersPage() {
  const session = await getSession();
  if (!session) return null;

  const orders = await prisma.order.findMany({
    where: { userId: session.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  if (orders.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <div className="mt-6">
          <EmptyState
            title="No orders yet"
            description="When you place an order, it will show up here with live status updates."
          >
            <Button asChild size="lg">
              <Link href="/products">Browse Products</Link>
            </Button>
          </EmptyState>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
      <p className="mt-1 text-sm text-gray-500">Track status, download GST invoices and manage your orders.</p>

      <ul className="mt-6 space-y-4">
        {orders.map((o) => (
          <li key={o.id}>
            <Link
              href={`/account/orders/${o.orderNumber}`}
              className="block rounded-2xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{o.orderNumber}</p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {formatDateTime(o.createdAt)} · {o.items.reduce((s, it) => s + it.quantity, 0)} items
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900">
                    {o.amount != null ? formatINR(o.amount) : "Quote pending"}
                  </span>
                  <OrderStatusBadge status={o.status} />
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
