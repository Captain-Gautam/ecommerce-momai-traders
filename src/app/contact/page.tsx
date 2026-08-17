import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { EnquiryForm } from "@/components/shop/enquiry-form";

export const metadata: Metadata = { title: "Contact Us" };

export default async function ContactPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900">Contact Us</h1>
        <p className="mt-3 text-gray-600">
          Have a question or need a custom solution? Reach out to us — we usually respond within business hours.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <a
              href={`tel:${settings.phone1.replace(/\s/g, "")}`}
              className="rounded-2xl border border-gray-200 bg-gradient-to-br from-green-50 to-emerald-50 p-5 hover:shadow-md"
            >
              <p className="text-xs font-semibold text-gray-400 uppercase">Phone</p>
              <p className="mt-1 font-semibold text-gray-900">{settings.phone1}</p>
            </a>
            <a
              href={`mailto:${settings.email}`}
              className="rounded-2xl border border-gray-200 bg-gradient-to-br from-purple-50 to-pink-50 p-5 hover:shadow-md"
            >
              <p className="text-xs font-semibold text-gray-400 uppercase">Email</p>
              <p className="mt-1 truncate font-semibold text-gray-900">{settings.email}</p>
              <p className="text-sm text-gray-500">We reply within a day</p>
            </a>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-orange-50 to-yellow-50 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase">Visit Us</p>
            <p className="mt-1 font-semibold text-gray-900">{settings.address}</p>
            <p className="mt-2 text-sm text-gray-500">{settings.businessHours}</p>
          </div>

          {settings.mapEmbed && (
            <div className="overflow-hidden rounded-2xl border border-gray-200">
              <iframe
                src={settings.mapEmbed}
                title="Momai Traders location"
                className="h-64 w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-bold text-gray-900">Send us an enquiry</h2>
          <div className="mt-5">
            <EnquiryForm variant="contact" />
          </div>
        </div>
      </div>
    </div>
  );
}
