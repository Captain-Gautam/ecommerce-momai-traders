import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatINR, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { OutstandingPayments } from "@/components/admin/outstanding-payments";
import type { OutstandingStatus } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Outstanding" };

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "PARTIALLY_PAID", label: "Partial" },
  { value: "SETTLED", label: "Settled" },
];

function formatDateInput(d: Date | null | undefined): string {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    OPEN: "bg-red-50 text-red-700 ring-red-200",
    PARTIALLY_PAID: "bg-amber-50 text-amber-700 ring-amber-200",
    SETTLED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  };
  const labels: Record<string, string> = {
    OPEN: "Open",
    PARTIALLY_PAID: "Partial",
    SETTLED: "Settled",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${styles[status] ?? "bg-gray-50 text-gray-600 ring-gray-200"}`}>
      {labels[status] ?? status}
    </span>
  );
}

export default async function AdminOutstandingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; state?: string }>;
}) {
  const sp = await searchParams;
  const status = sp.status ?? "";
  const q = (sp.q ?? "").trim();
  const state = (sp.state ?? "").trim();

  const statusFilter: OutstandingStatus | undefined =
    status === "OPEN" || status === "PARTIALLY_PAID" || status === "SETTLED"
      ? (status as OutstandingStatus)
      : undefined;

  const where = {
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(q
      ? {
          OR: [
            { company: { contains: q, mode: "insensitive" as const } },
            { contactName: { contains: q, mode: "insensitive" as const } },
            { city: { contains: q, mode: "insensitive" as const } },
            { invoiceNumber: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(state ? { state: { contains: state, mode: "insensitive" as const } } : {}),
  };

  const [rows, counts, states] = await Promise.all([
    prisma.outstanding.findMany({
      where,
      include: {
        order: { select: { orderNumber: true } },
        payments: { orderBy: { receivedOn: "desc" } },
      },
      orderBy: [{ company: "asc" }, { city: "asc" }, { invoiceDate: "desc" }],
    }),
    prisma.outstanding.groupBy({ by: ["status"], _count: true }),
    prisma.outstanding.findMany({ distinct: ["state"], select: { state: true }, orderBy: { state: "asc" } }),
  ]);

  const groups = new Map<string, (typeof rows)[number][]>();
  for (const r of rows) {
    const key = `${r.company}||${r.city}||${r.state}`;
    const list = groups.get(key) ?? [];
    list.push(r);
    groups.set(key, list);
  }

  const groupEntries = [...groups.entries()]
    .map(([, list]) => ({
      company: list[0].company,
      contactName: list[0].contactName,
      city: list[0].city,
      state: list[0].state,
      list,
      totalAmount: list.reduce((s, r) => s + r.amount, 0),
      totalBalance: list.reduce((s, r) => s + (r.amount - r.paidAmount), 0),
      settledCount: list.filter((r) => r.status === "SETTLED").length,
    }))
    .sort((a, b) => a.company.localeCompare(b.company));

  const totalAmount = rows.reduce((s, r) => s + r.amount, 0);
  const totalPaid = rows.reduce((s, r) => s + r.paidAmount, 0);
  const totalBalance = totalAmount - totalPaid;
  const openInvoices = rows.filter((r) => r.status !== "SETTLED").length;

  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (q) params.set("q", q);
  if (state) params.set("state", state);
  const exportHref = `/api/admin/outstanding/export${params.size ? `?${params.toString()}` : ""}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Outstanding</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track unpaid invoices and record payments received.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={exportHref}>Export Excel</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-xl font-bold text-gray-900">{formatINR(totalAmount)}</p>
          <p className="mt-1 text-xs font-medium text-gray-400">Total invoiced</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-xl font-bold text-gray-900">{formatINR(totalPaid)}</p>
          <p className="mt-1 text-xs font-medium text-gray-400">Received</p>
        </div>
        <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4">
          <p className="text-xl font-bold text-brand-700">{formatINR(totalBalance)}</p>
          <p className="mt-1 text-xs font-medium text-brand-600">Balance due</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-xl font-bold text-gray-900">{openInvoices}</p>
          <p className="mt-1 text-xs font-medium text-gray-400">Invoices pending</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((f) => {
          const count = f.value ? counts.find((c) => c.status === f.value)?._count ?? 0 : rows.length;
          const isActive = status === f.value;
          const href = new URLSearchParams();
          if (f.value) href.set("status", f.value);
          if (q) href.set("q", q);
          if (state) href.set("state", state);
          return (
            <Link
              key={f.value || "all"}
              href={`/admin/outstanding${href.size ? `?${href.toString()}` : ""}`}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${isActive ? "bg-brand-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}
            >
              {f.label} <span className={isActive ? "opacity-70" : "text-gray-400"}>({count})</span>
            </Link>
          );
        })}
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-2xl border border-gray-200 bg-white p-4">
        <Field label="Search" className="min-w-56 flex-1">
          <Input name="q" defaultValue={q} placeholder="Company, contact, city or invoice no." />
        </Field>
        <Field label="State" className="w-40">
          <Select name="state" defaultValue={state}>
            <option value="">All states</option>
            {states.map((s) => (
              <option key={s.state} value={s.state}>{s.state}</option>
            ))}
          </Select>
        </Field>
        <Button type="submit">Filter</Button>
        {(q || state) ? (
          <Button asChild variant="outline">
            <Link href="/admin/outstanding">Clear</Link>
          </Button>
        ) : null}
      </form>

      {groupEntries.length === 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-400">
          No outstanding invoices found.
        </div>
      )}

      {groupEntries.map((group) => (
        <section key={`${group.company}||${group.city}||${group.state}`} className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50 px-5 py-3">
            <div className="flex items-center gap-3">
              <div>
                <p className="font-bold text-gray-900">{group.company}</p>
                <p className="text-xs text-gray-500">
                  {group.city}{group.state ? `, ${group.state}` : ""}
                  {group.contactName ? ` · ${group.contactName}` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-500">
                <span className="font-medium text-gray-900">{group.list.length}</span> invoice{group.list.length === 1 ? "" : "s"}
                {group.settledCount === group.list.length ? " · settled" : ""}
              </span>
              <span className="font-bold text-gray-900">{formatINR(group.totalBalance)}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3 font-semibold">Invoice</th>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 text-right font-semibold">Amount</th>
                  <th className="px-4 py-3 text-right font-semibold">Paid</th>
                  <th className="px-4 py-3 text-right font-semibold">Balance</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Payments</th>
                </tr>
              </thead>
              <tbody>
                {group.list.map((r) => {
                  const balance = Math.round((r.amount - r.paidAmount) * 100) / 100;
                  const settled = r.status === "SETTLED";
                  return (
                    <tr key={r.id} className="border-b border-gray-50 last:border-b-0 align-top hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{r.invoiceNumber}</p>
                        {r.order ? (
                          <Link href={`/admin/orders/${r.order.orderNumber}`} className="text-xs text-brand-600 hover:underline">
                            {r.order.orderNumber}
                          </Link>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{r.order?.orderNumber ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(r.invoiceDate)}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">{formatINR(r.amount)}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{formatINR(r.paidAmount)}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">{formatINR(balance)}</td>
                      <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-4 py-3">
                        <details className="group">
                          <summary className="cursor-pointer list-none text-xs font-medium text-brand-600 hover:underline">
                            {r.payments.length > 0 ? `View (${r.payments.length})` : "Record payment"}
                          </summary>
                          <OutstandingPayments
                            outstandingId={r.id}
                            balance={balance}
                            settled={settled}
                            payments={r.payments.map((p) => ({
                              id: p.id,
                              amount: p.amount,
                              mode: p.mode,
                              referenceNo: p.referenceNo,
                              bankName: p.bankName,
                              branch: p.branch,
                              chequeDate: formatDateInput(p.chequeDate),
                              paymentDate: formatDateInput(p.paymentDate),
                              note: p.note,
                              receivedOn: p.receivedOn.toISOString(),
                            }))}
                          />
                        </details>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
