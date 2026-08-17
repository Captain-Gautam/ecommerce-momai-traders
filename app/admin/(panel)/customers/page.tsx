import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatINR, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Customers" };

export default async function AdminCustomersPage() {
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    include: {
      _count: { select: { orders: true } },
      orders: { select: { amount: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="mt-1 text-sm text-gray-500">{customers.length} registered customers.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">Orders</th>
                <th className="px-4 py-3 font-semibold">Lifetime value</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const lifetime = c.orders
                  .filter((o) => o.amount != null && o.status !== "CANCELLED")
                  .reduce((s, o) => s + (o.amount ?? 0), 0);
                return (
                  <tr key={c.id} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{c.phone ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders`} className="font-medium text-brand-600 hover:underline">
                        {c._count.orders}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{formatINR(lifetime)}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDateTime(c.createdAt)}</td>
                  </tr>
                );
              })}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400">No customers yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
