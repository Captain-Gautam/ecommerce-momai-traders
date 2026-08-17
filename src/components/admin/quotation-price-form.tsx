"use client";

import { useActionState, useState } from "react";
import { submitQuotationPricing } from "@/actions/quotation-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui";

type QuotationItem = {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number | null;
  gstRate: number;
  hsnCode: string | null;
};

export function QuotationPriceForm({
  enquiryId,
  items,
  allPriced,
}: {
  enquiryId: string;
  items: QuotationItem[];
  allPriced: boolean;
}) {
  const [state, formAction, pending] = useActionState(submitQuotationPricing, undefined);
  const [copied, setCopied] = useState(false);

  return (
    <div className="space-y-4">
      {state?.success && !state.acceptanceLink && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Prices saved.</div>
      )}
      {state?.error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
      )}
      {state?.acceptanceLink && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm">
          <p className="font-semibold text-emerald-800">Quote sent to the customer.</p>
          <p className="mt-1 text-emerald-700">
            Acceptance link (share on WhatsApp if the customer has no email):
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg bg-white px-2 py-1.5 text-xs text-gray-600">
              {state.acceptanceLink}
            </code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(state.acceptanceLink ?? "");
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="id" value={enquiryId} />
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-3 py-2.5 font-semibold">Item</th>
                  <th className="px-3 py-2.5 font-semibold">Qty</th>
                  <th className="px-3 py-2.5 font-semibold">HSN</th>
                  <th className="px-3 py-2.5 font-semibold">GST %</th>
                  <th className="px-3 py-2.5 font-semibold">Unit price (₹)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-b border-gray-50 last:border-b-0">
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-gray-900">{it.name}</p>
                      <p className="text-xs text-gray-400">{it.unit}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <Input
                        name={`qty_${it.id}`}
                        type="number"
                        step="1"
                        min="1"
                        defaultValue={String(it.quantity)}
                        className="w-20"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <Input
                        name={`hsn_${it.id}`}
                        defaultValue={it.hsnCode ?? ""}
                        placeholder="-"
                        className="w-24"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <Input
                        name={`gst_${it.id}`}
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        defaultValue={String(it.gstRate)}
                        className="w-20"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <Input
                        name={`price_${it.id}`}
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={it.unitPrice != null ? String(it.unitPrice) : ""}
                        placeholder="Required"
                        required
                        className="w-28"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" name="intent" value="save" disabled={pending} variant="outline">
            {pending && <Spinner />} Save Prices
          </Button>
          <Button type="submit" name="intent" value="respond" disabled={pending}>
            {pending && <Spinner />} Save & Respond to Customer
          </Button>
        </div>
        {allPriced && (
          <p className="text-xs text-gray-400">All items are priced — ready to send.</p>
        )}
      </form>
    </div>
  );
}
