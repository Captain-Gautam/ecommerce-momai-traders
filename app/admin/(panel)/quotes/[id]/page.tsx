import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import { QuotationPriceForm } from "@/components/admin/quotation-price-form";
import { EnquiryStatusSelect } from "@/components/admin/enquiry-status-select";

export const metadata: Metadata = { title: "Quotation" };

export default async function AdminQuotationPricingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const enquiry = await prisma.enquiry.findUnique({
    where: { id },
    include: {
      items: true,
      order: { select: { orderNumber: true } },
    },
  });
  if (!enquiry) notFound();

  const allPriced = enquiry.items.length > 0 && enquiry.items.every((it) => it.unitPrice != null);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link href="/admin/quotes" className="text-sm font-medium text-brand-600 hover:underline">
          ← Back to quotations
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quotation — {enquiry.name}</h1>
            <p className="mt-1 text-sm text-gray-500">Received {formatDateTime(enquiry.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            {enquiry.order && (
              <Link
                href={`/admin/orders/${enquiry.order.orderNumber}`}
                className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-100"
              >
                Converted to order {enquiry.order.orderNumber}
              </Link>
            )}
            <EnquiryStatusSelect id={enquiry.id} status={enquiry.status} />
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-bold text-gray-900">Customer</h2>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
          {enquiry.email && <span>✉ {enquiry.email}</span>}
          {enquiry.phone && <span>☎ {enquiry.phone}</span>}
          {enquiry.company && <span>🏢 {enquiry.company}</span>}
        </div>
        {enquiry.message && (
          <p className="mt-3 rounded-xl bg-brand-50/60 px-3 py-2 text-sm text-gray-700">{enquiry.message}</p>
        )}
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
        <h2 className="text-lg font-bold text-gray-900">Set Quotation Prices</h2>
        <p className="mt-1 text-sm text-gray-500">
          Enter the wholesale price for each item, then press <strong>Save</strong> to store them or{" "}
          <strong>Save & Respond</strong> to email the priced Excel to the customer.
        </p>
        <div className="mt-4">
          <QuotationPriceForm enquiryId={enquiry.id} items={enquiry.items} allPriced={allPriced} />
        </div>
      </section>
    </div>
  );
}
