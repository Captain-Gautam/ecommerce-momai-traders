"use client";

import { useActionState } from "react";
import { updateSettings } from "@/actions/admin-actions";
import { Input, Textarea, Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui";

export function SettingsForm({ settings }: { settings: Record<string, string> }) {
  const [state, formAction, pending] = useActionState(updateSettings, undefined);

  return (
    <form action={formAction} className="space-y-6">
      {state?.success && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Settings saved.</div>
      )}
      {state?.error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>}

      <fieldset className="space-y-4">
        <legend className="text-sm font-bold text-gray-900">Store information</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Store name">
            <Input name="storeName" defaultValue={settings.storeName} />
          </Field>
          <Field label="Tagline">
            <Input name="tagline" defaultValue={settings.tagline} />
          </Field>
          <Field label="Phone 1">
            <Input name="phone1" defaultValue={settings.phone1} />
          </Field>
          <Field label="Phone 2">
            <Input name="phone2" defaultValue={settings.phone2} />
          </Field>
          <Field label="Email">
            <Input name="email" defaultValue={settings.email} />
          </Field>
          <Field label="WhatsApp number (with country code)">
            <Input name="whatsapp" defaultValue={settings.whatsapp} placeholder="919974902733" />
          </Field>
        </div>
        <Field label="Business hours">
          <Input name="businessHours" defaultValue={settings.businessHours} />
        </Field>
        <Field label="Address">
          <Textarea name="address" rows={2} defaultValue={settings.address} />
        </Field>
        <Field label="Google Maps embed URL">
          <Input name="mapEmbed" defaultValue={settings.mapEmbed} placeholder="https://www.google.com/maps/embed?pb=…" />
        </Field>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-bold text-gray-900">GST / Invoice</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="GSTIN">
            <Input name="gstin" defaultValue={settings.gstin} placeholder="24XXXXXXXXX1Z5" />
          </Field>
          <Field label="State code (GST)">
            <Input name="stateCode" defaultValue={settings.stateCode} placeholder="24" />
          </Field>
          <Field label="Legal name (for invoice)">
            <Input name="legalName" defaultValue={settings.legalName} />
          </Field>
          <Field label="Invoice prefix">
            <Input name="invoicePrefix" defaultValue={settings.invoicePrefix} />
          </Field>
          <Field label="Delivery challan prefix">
            <Input name="challanPrefix" defaultValue={settings.challanPrefix} />
          </Field>
        </div>
        <Field label="Invoice footer note">
          <Textarea name="invoiceFooterNote" rows={2} defaultValue={settings.invoiceFooterNote} />
        </Field>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-bold text-gray-900">Bank / UPI (shown on invoice)</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Bank name">
            <Input name="bankName" defaultValue={settings.bankName} placeholder="HDFC Bank" />
          </Field>
          <Field label="Branch">
            <Input name="bankBranch" defaultValue={settings.bankBranch} placeholder="Ghatlodiya, Ahmedabad" />
          </Field>
          <Field label="Account number">
            <Input name="bankAccount" defaultValue={settings.bankAccount} />
          </Field>
          <Field label="IFSC">
            <Input name="bankIfsc" defaultValue={settings.bankIfsc} placeholder="HDFC0000123" />
          </Field>
          <Field label="UPI ID (for invoice QR)">
            <Input name="upiId" defaultValue={settings.upiId} placeholder="momaitraders@okhdfcbank" />
          </Field>
        </div>
      </fieldset>

      <Button type="submit" disabled={pending}>
        {pending && <Spinner />} Save settings
      </Button>
    </form>
  );
}
