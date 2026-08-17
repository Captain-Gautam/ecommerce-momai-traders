import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { QuoteForm } from "@/components/shop/quote-form";

export const metadata: Metadata = { title: "Request a Quote" };

export default async function QuotePage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const { product: productSlug } = await searchParams;

  const [products, settings] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, unit: true, slug: true },
    }),
    getSettings(),
  ]);

  const initialProductId = productSlug
    ? products.find((p) => p.slug === productSlug)?.id
    : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900">Request a Quote</h1>
        <p className="mt-3 text-gray-600">
          Add the products you need — as many as you want — and our team will email you back with the best wholesale
          pricing and availability.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
          <QuoteForm products={products} initialProductId={initialProductId} />
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="text-base font-bold text-gray-900">How it works</h2>
            <ol className="mt-3 space-y-3 text-sm text-gray-600">
              {[
                ["Pick products", "Choose from the catalogue and set quantities."],
                ["Add your details", "Tell us your name and how to reach you."],
                ["Get a quote", "We email you wholesale pricing within a few hours."],
              ].map(([title, desc], i) => (
                <li key={title} className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span>
                    <span className="font-semibold text-gray-900">{title}</span> — {desc}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="text-base font-bold text-gray-900">Prefer to talk?</h2>
            <p className="mt-2 text-sm text-gray-600">
              Call us during business hours and we&apos;ll help you build your order on the phone.
            </p>
            <p className="mt-3 text-sm">
              <a href={`tel:${settings.phone1.replace(/\s/g, "")}`} className="font-semibold text-brand-600 hover:underline">
                {settings.phone1}
              </a>
              <span className="block text-xs text-gray-400">{settings.businessHours}</span>
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
