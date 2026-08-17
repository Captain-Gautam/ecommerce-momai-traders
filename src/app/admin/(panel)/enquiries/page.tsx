import type { Metadata } from "next";
import { EnquiryList } from "@/components/admin/enquiry-list";

export const metadata: Metadata = { title: "Enquiries" };

export default async function AdminEnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  return (
    <EnquiryList
      type="ENQUIRY"
      title="Enquiries"
      description="Enquiries submitted from the storefront contact form."
      basePath="/admin/enquiries"
      status={status}
      emptyLabel="No enquiries found."
    />
  );
}
