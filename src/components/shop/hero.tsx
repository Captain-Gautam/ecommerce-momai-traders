"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type HeroCategory = { id: string; name: string; _count: { products: number } };

export function Hero({
  banners,
  categories,
}: {
  banners: { id: string; title: string; subtitle: string | null; image: string; link: string | null }[];
  categories: HeroCategory[];
}) {
  const [active, setActive] = useState(0);
  const count = banners.length;

  useEffect(() => {
    if (count <= 1) return;
    const t = setInterval(() => setActive((a) => (a + 1) % count), 6000);
    return () => clearInterval(t);
  }, [count]);

  const chips = categories.slice(0, 6);

  return (
    <section className="relative overflow-hidden bg-brand-950 text-white">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-32 size-[28rem] rounded-full bg-brand-600/40 blur-3xl" />
        <div className="absolute top-1/3 -right-32 size-[24rem] rounded-full bg-amber-400/20 blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 size-[22rem] rounded-full bg-pink-500/20 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "26px 26px",
          }}
        />
      </div>

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-10 lg:grid-cols-2 lg:py-16">
        {/* Copy */}
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-medium tracking-wide text-brand-100 backdrop-blur">
            <span className="flex size-4 items-center justify-center rounded-full bg-amber-400 text-brand-950">
              <SparkleIcon className="size-2.5" />
            </span>
            Wholesale Supplier · Ahmedabad, Gujarat
          </p>

          <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
            {banners[active]?.title ?? "Wholesale Supplier Of Cleaning Material & Stationery"}
          </h1>
          <div className="mt-3 flex items-center gap-2">
            <span className="h-1.5 w-16 rounded-full bg-gradient-to-r from-amber-400 to-pink-400" />
            <span className="h-1.5 w-4 rounded-full bg-white/40" />
          </div>

          <p className="mt-4 max-w-xl text-sm text-brand-100 sm:text-base">
            {banners[active]?.subtitle ??
              "From Paper to Polish — cleaning material, stationery, packaging and washroom solutions for offices, hotels, hospitals and homes across Gujarat."}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={banners[active]?.link ?? "/products"}
              className="group inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 text-sm font-bold text-brand-950 shadow-lg shadow-orange-500/25 transition hover:from-amber-300 hover:to-orange-400"
            >
              Shop Now
              <svg className="size-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              href="/quote"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              <QuoteIcon className="size-4" />
              Request a Quote
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-brand-100">
            {[
              "Custom multi-product quotes",
              "Best wholesale pricing",
              "On-time delivery in Gujarat",
            ].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <CheckIcon className="size-3.5 text-emerald-300" />
                {t}
              </span>
            ))}
          </div>

          {count > 1 && (
            <div className="mt-6 flex gap-1.5">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === active ? "w-8 bg-amber-400" : "w-3 bg-white/30 hover:bg-white/60"
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Creative quote-card composition */}
        <div className="relative hidden lg:block">
          <div className="absolute -inset-8 rounded-full border border-dashed border-white/20" />
          <div className="absolute right-0 -top-10 size-40 rounded-full bg-amber-400/25 blur-2xl" />
          <div className="absolute -bottom-10 -left-6 size-44 rounded-full bg-brand-500/30 blur-2xl" />

          <div className="relative mx-auto w-80 rotate-2">
            <div className="relative rounded-3xl bg-white p-6 text-gray-900 shadow-2xl">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-brand-600 text-white">
                  <QuoteIcon className="size-5" />
                </span>
                <div>
                  <p className="text-base font-bold">Request a Quote</p>
                  <p className="text-xs text-gray-500">Pick products · We reply fast</p>
                </div>
              </div>

              <div className="mt-5 space-y-2.5">
                {chips.map((c, i) => (
                  <div
                    key={c.id}
                    className={cn(
                      "flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5",
                      i === 0 && "border-brand-200 bg-brand-50"
                    )}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <CategoryIcon name={c.name} className="size-4 text-brand-600" />
                      <span className="truncate">{c.name}</span>
                    </span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                      {c._count.products} items
                    </span>
                  </div>
                ))}
                {chips.length === 0 && (
                  <div className="rounded-xl bg-gray-50 px-3 py-6 text-center text-sm text-gray-400">
                    Build your product list below
                  </div>
                )}
              </div>
            </div>

            {/* Floating accent cards */}
            <div className="absolute -top-6 -right-8 flex -rotate-6 items-center gap-2 rounded-2xl bg-amber-400 px-3 py-2 text-xs font-bold text-brand-950 shadow-xl animate-float">
              <TagIcon className="size-4" />
              Best Rates
            </div>
            <div
              className="absolute -bottom-6 -left-10 flex rotate-3 items-center gap-2 rounded-2xl bg-white/95 px-3 py-2 text-xs font-bold text-brand-800 shadow-xl animate-float-slow"
              style={{ animationDelay: "1s" }}
            >
              <TruckIcon className="size-4 text-brand-600" />
              Fast Delivery
            </div>
            <div
              className="absolute top-1/2 -right-12 flex -translate-y-1/2 rotate-2 items-center gap-2 rounded-2xl bg-white/95 px-3 py-2 text-xs font-bold text-brand-800 shadow-xl animate-float-fast"
              style={{ animationDelay: "0.5s" }}
            >
              <ShieldIcon className="size-4 text-emerald-600" />
              Trusted Wholesaler
            </div>
          </div>
        </div>
      </div>

      <div className="relative h-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400" />
    </section>
  );
}

function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const key = name.toLowerCase();
  if (key.includes("station") || key.includes("paper") || key.includes("office")) return <PenIcon className={className} />;
  if (key.includes("housekeep") || key.includes("clean")) return <BrushIcon className={className} />;
  if (key.includes("washroom") || key.includes("toilet")) return <DropletIcon className={className} />;
  if (key.includes("print")) return <PrinterIcon className={className} />;
  if (key.includes("packaging") || key.includes("industrial")) return <BoxIcon className={className} />;
  if (key.includes("dustbin") || key.includes("bin")) return <TrashIcon className={className} />;
  if (key.includes("disposable") || key.includes("food")) return <CupIcon className={className} />;
  if (key.includes("computer") || key.includes("consumable")) return <ChipIcon className={className} />;
  return <TagIcon className={className} />;
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.8 5.4a2 2 0 0 0 1.2 1.2l5.4 1.8-5.4 1.8a2 2 0 0 0-1.2 1.2L12 18.8l-1.8-5.4a2 2 0 0 0-1.2-1.2l-5.4-1.8 5.4-1.8a2 2 0 0 0 1.2-1.2L12 2Z" />
    </svg>
  );
}

function QuoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3.75H12m-4.5 3.75h5.25M6.75 5.25h10.5a1.5 1.5 0 0 1 1.5 1.5v10.5a1.5 1.5 0 0 1-1.5 1.5H6.75a1.5 1.5 0 0 1-1.5-1.5V6.75a1.5 1.5 0 0 1 1.5-1.5Z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function TagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
    </svg>
  );
}

function TruckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}

function PenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
  );
}

function BrushIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
    </svg>
  );
}

function DropletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
    </svg>
  );
}

function PrinterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Z" />
    </svg>
  );
}

function BoxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m6 4.125 2.25 2.25m0 0 2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
    </svg>
  );
}

function CupIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25h15m-13.5 0v6.75a4.5 4.5 0 0 0 4.5 4.5h3a4.5 4.5 0 0 0 4.5-4.5V8.25m-12 0H3.75a.75.75 0 0 1-.75-.75V6.75a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75H17.25" />
    </svg>
  );
}

function ChipIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Zm.75-12h9v9h-9v-9Z" />
    </svg>
  );
}
