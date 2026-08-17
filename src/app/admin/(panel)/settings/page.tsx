import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const [settings, gstinRaw] = await Promise.all([getSettings(), prisma.setting.findUnique({ where: { key: "gstin" } })]);
  const gstin = gstinRaw?.value ?? "";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Store details used across the site and on GST invoices.
        </p>
        {!gstin && (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            GSTIN is not set yet — add it here so invoices show your GST number.
          </p>
        )}
      </div>
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <SettingsForm settings={{ ...settings, gstin }} />
      </section>
    </div>
  );
}
