import type { Metadata } from "next";
import Image from "next/image";
import { existsSync } from "fs";
import path from "path";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "About Us" };

const OWNER_PHOTO = "/images/owner.jpg";
const OWNER_NAME = "Jigar Prajapati";

export default async function AboutPage() {
  const s = await getSettings();
  const ownerPhotoExists = existsSync(path.join(process.cwd(), "public", OWNER_PHOTO));

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-700 to-brand-900">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:py-20">
          <p className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-100">
            About Us
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            About Momai Traders
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-brand-100">
            From Paper to Polish — your one stop solution for cleaning material, stationery and office supplies.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="max-w-3xl">
          <SectionLabel>Our Story</SectionLabel>
          <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">A trusted name in wholesale supply</h2>
          <p className="mt-5 text-lg leading-relaxed text-gray-600">
            At Momai Traders, our goal is to help you create spaces that inspire productivity and comfort. We provide
            essential solutions that transform both your workspace and home environment into organized, pristine havens.
          </p>
          <p className="mt-3 leading-relaxed text-gray-600">
            We are a leading wholesale supplier of cleaning materials and stationery, offering a comprehensive range of
            products including office supplies, housekeeping materials, washroom solutions, and printing services. Our
            commitment to quality and customer satisfaction has made us a trusted name in the industry.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="border-y border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <SectionLabel>Mission & Vision</SectionLabel>
          <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">What drives us forward</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-8 text-white">
              <h3 className="flex items-center gap-2 text-lg font-bold">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
                  />
                </svg>
                Our Mission
              </h3>
              <p className="mt-3 text-brand-100">
                To be the most trusted wholesale partner for cleaning, stationery and packaging needs across Gujarat —
                delivering quality, value and reliability on every order.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
              <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
                Our Vision
              </h3>
              <p className="mt-3 leading-relaxed text-gray-600">
                To become the region&apos;s most preferred wholesale supplier by consistently expanding our range,
                strengthening our service and building lasting relationships with every customer we serve.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Strengths */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div>
            <SectionLabel>Our Strengths</SectionLabel>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">Why businesses choose us</h2>
            <ul className="mt-6 space-y-3 text-gray-700">
              {[
                "Satisfied customers across industries",
                "Quality assurance on every product",
                "Years of industry experience",
                "Prompt service and delivery",
                "Competitive wholesale pricing",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckDot />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StatCard value="Years" label="of industry experience" gradient="from-brand-600 to-brand-800 text-white" />
            <StatCard value="1000+" label="happy customers served" gradient="from-emerald-500 to-teal-600 text-white" />
            <StatCard value="Wholesale" label="pricing for every order" gradient="from-orange-500 to-amber-600 text-white" />
            <StatCard value="On-time" label="service & delivery" gradient="from-purple-500 to-violet-600 text-white" />
          </div>
        </div>
      </section>

      {/* Meet the Owner */}
      <section className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <SectionLabel>Meet the Owner</SectionLabel>
          <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">The person behind Momai Traders</h2>
          <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
            <div className="grid grid-cols-1 gap-8 p-6 sm:p-10 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
              <div className="flex justify-center md:block">
                <div className="flex size-40 items-center justify-center overflow-hidden rounded-full bg-brand-50 ring-4 ring-brand-100">
                  {ownerPhotoExists ? (
                    <Image
                      src={OWNER_PHOTO}
                      alt={OWNER_NAME}
                      width={160}
                      height={160}
                      className="size-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-brand-700">JP</span>
                  )}
                </div>
              </div>

              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold text-gray-900">{OWNER_NAME}</h3>
                <p className="mt-1 text-sm font-medium text-brand-600">Owner — Momai Traders</p>
                <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-gray-600 md:mx-0">
                  With a focus on dependable service and long-term relationships, Jigar leads Momai Traders with a simple
                  promise — quality products, honest wholesale pricing, and timely delivery on every single order.
                </p>

                <div className="mx-auto mt-6 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2 md:mx-0">
                  <Info label="Email" value={s.email} href={`mailto:${s.email}`} />
                  <Info label="Business Hours" value={s.businessHours} />
                </div>

                <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
                  <a
                    href="/quote"
                    className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700"
                  >
                    Request a Quote
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-700">
      {children}
    </p>
  );
}

function StatCard({ value, label, gradient }: { value: string; label: string; gradient: string }) {
  return (
    <div className={`flex flex-col justify-center rounded-2xl bg-gradient-to-br p-6 ${gradient}`}>
      <p className="text-2xl font-bold sm:text-3xl">{value}</p>
      <p className="mt-1 text-sm opacity-90">{label}</p>
    </div>
  );
}

function Info({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
      <p className="text-xs font-semibold text-gray-400 uppercase">{label}</p>
      {href ? (
        <a href={href} className="mt-0.5 block text-sm font-medium text-gray-800 hover:text-brand-700">
          {value}
        </a>
      ) : (
        <p className="mt-0.5 text-sm font-medium text-gray-800">{value}</p>
      )}
    </div>
  );
}

function CheckDot() {
  return (
    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
      <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
      </svg>
    </span>
  );
}
