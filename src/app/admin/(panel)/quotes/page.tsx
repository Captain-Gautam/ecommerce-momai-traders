import type { Metadata } from "next";
import { EnquiryList } from "@/components/admin/enquiry-list";

export const metadata: Metadata = { title: "Quotations" };

export default async function AdminQuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  return (
    <EnquiryList
      type="QUOTATION"
      title="Quotations"
      description="Quote requests submitted from the Request a Quote form."
      basePath="/admin/quotes"
      status={status}
      emptyLabel="No quotation requests found."
      actionLabel="Price & Send"
    />
  );
}
