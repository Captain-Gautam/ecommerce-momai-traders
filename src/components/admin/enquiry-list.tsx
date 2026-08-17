import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import { EnquiryStatusSelect } from "@/components/admin/enquiry-status-select";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  NEW: "bg-amber-50 text-amber-700",
  RESPONDED: "bg-sky-50 text-sky-700",
  CLOSED: "bg-gray-100 text-gray-500",
};

export async function EnquiryList({
  type,
  title,
  description,
  basePath,
  status,
  emptyLabel,
  actionLabel,
}: {
  type: "ENQUIRY" | "QUOTATION";
  title: string;
  description: string;
  basePath: string;
  status?: string;
  emptyLabel: string;
  actionLabel?: string;
}) {
  const [enquiries, counts] = await Promise.all([
    prisma.enquiry.findMany({
      where: {
        type,
        ...(status && status !== "all" ? { status: status as never } : {}),
      },
      include: {
        product: { select: { name: true, slug: true } },
        order: { select: { orderNumber: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.enquiry.groupBy({
      by: ["status"],
      where: { type },
      _count: true,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {["all", "NEW", "RESPONDED", "CLOSED"].map((s) => {
          const count = s === "all" ? enquiries.length : counts.find((c) => c.status === s)?._count ?? 0;
          const isActive = (status ?? "") === s;
          return (
            <a
              key={s}
              href={s === "all" ? basePath : `${basePath}?status=${s}`}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${isActive ? "bg-brand-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}
            >
              {s === "all" ? "All" : s} ({count})
            </a>
          );
        })}
      </div>

      <div className="space-y-4">
        {enquiries.map((e) => (
          <div key={e.id} className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-gray-900">{e.name}</p>
                  {e.company && <span className="text-sm text-gray-500">· {e.company}</span>}
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", STATUS_STYLES[e.status])}>
                    {e.status}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-gray-400">{formatDateTime(e.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                {actionLabel && !e.order && (
                  <a
                    href={`${basePath}/${e.id}`}
                    className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
                  >
                    {actionLabel}
                  </a>
                )}
                {e.order && (
                  <a
                    href={`/admin/orders/${e.order.orderNumber}`}
                    className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-100"
                  >
                    Order {e.order.orderNumber}
                  </a>
                )}
                <EnquiryStatusSelect id={e.id} status={e.status} />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
              {e.email && <span>✉ {e.email}</span>}
              {e.phone && <span>☎ {e.phone}</span>}
              {e.quantity && <span>Qty: {e.quantity} {e.unit ?? ""}</span>}
              {e.product && (
                <span>
                  Product: <a href={`/admin/products?q=${encodeURIComponent(e.product.name)}`} className="text-brand-600 hover:underline">{e.product.name}</a>
                </span>
              )}
            </div>
            {e.specs && (
              <div className="mt-3 rounded-xl bg-gray-50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Items requested</p>
                <div className="mt-1 whitespace-pre-line text-sm text-gray-700">{e.specs}</div>
              </div>
            )}
            <p className="mt-3 rounded-xl bg-brand-50/60 px-3 py-2 text-sm text-gray-700">
              {e.subject ? (
                <span className="font-semibold">{e.subject}: </span>
              ) : null}
              {e.message}
            </p>
          </div>
        ))}
        {enquiries.length === 0 && (
          <p className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
            {emptyLabel}
          </p>
        )}
      </div>
    </div>
  );
}
