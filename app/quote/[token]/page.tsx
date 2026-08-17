import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { verifyQuoteToken } from "@/lib/quote-token";
import { formatDateTime } from "@/lib/utils";
import { QuoteAcceptForm } from "@/components/shop/quote-accept-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Your Quotation" };

export default async function QuoteTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const enquiryId = await verifyQuoteToken(token);
  if (!enquiryId) notFound();

  const enquiry = await prisma.enquiry.findUnique({
    where: { id: enquiryId },
    include: { items: { orderBy: { id: "asc" } } },
  });
  if (!enquiry) notFound();

  if (enquiry.orderId) {
    const existing = await prisma.order.findUnique({ where: { id: enquiry.orderId } });
    if (existing) redirect(`/account/orders/${existing.orderNumber}`);
  }

  const [session, settings] = await Promise.all([getSession(), getSettings()]);

  const priced = enquiry.items.length > 0 && enquiry.items.every((it) => it.unitPrice != null);
  if (!priced) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8">
          <h1 className="text-xl font-bold text-gray-900">Quotation pending</h1>
          <p className="mt-2 text-sm text-gray-600">
            Our team is still pricing your request. You&apos;ll receive an email with the prices and a fresh link
            shortly.
          </p>
          <p className="mt-4 text-xs text-gray-400">Need help? Call {settings.phone1}</p>
        </div>
      </div>
    );
  }

  let defaultState = settings.stateCode;
  let addresses: Array<{
    id: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    pincode: string;
    isDefault: boolean;
  }> = [];
  if (session) {
    addresses = await prisma.address.findMany({
      where: { userId: session.id },
      orderBy: { isDefault: "desc" },
      select: { id: true, line1: true, line2: true, city: true, state: true, pincode: true, isDefault: true },
    });
    defaultState = addresses[0]?.state ?? settings.stateCode;
  }

  const emailMismatch =
    session && enquiry.email && session.email.toLowerCase() !== enquiry.email.toLowerCase()
      ? enquiry.email
      : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Your Quotation</h1>
        <p className="mt-2 text-sm text-gray-500">
          From <span className="font-semibold text-gray-700">{settings.storeName}</span> · Quoted{" "}
          {enquiry.quotedAt ? formatDateTime(enquiry.quotedAt) : ""}
        </p>
      </div>

      <div className="mt-8">
        {!session && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="text-base font-bold text-amber-800">Log in to accept this quote</h2>
            <p className="mt-1 text-sm text-amber-700">
              Your quotation will be converted into an order in your account, so you can track it and download the
              invoice later.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button asChild>
                <Link href={`/login?next=/quote/${encodeURIComponent(token)}`}>Log in to accept</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/register">Create an account</Link>
              </Button>
            </div>
          </div>
        )}

        {session && emailMismatch && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            You are logged in as <strong>{session.email}</strong>, but this quote was requested from{" "}
            <strong>{emailMismatch}</strong>. Please log in with that email to accept it.
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
          <QuoteAcceptForm
            token={token}
            items={enquiry.items}
            buyerState={defaultState}
            addresses={addresses}
            disabled={!session || Boolean(emailMismatch)}
            requesterName={enquiry.name}
          />
        </div>
      </div>
    </div>
  );
}
