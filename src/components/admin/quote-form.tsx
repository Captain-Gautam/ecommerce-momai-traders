"use client";

import { useActionState } from "react";
import { quoteOrder } from "@/actions/admin-actions";
import { Input, Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui";

export function QuoteForm({
  orderId,
  items,
}: {
  orderId: string;
  items: {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    unitPrice: number | null;
    gstRate: number;
  }[];
}) {
  const [state, formAction, pending] = useActionState(quoteOrder, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={orderId} />
      {state?.success && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Quote saved and order marked as quoted. The customer can now see the final price and confirm on WhatsApp.
        </div>
      )}
      {state?.error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
      )}

      <div className="space-y-3">
        {items.map((it) => (
          <div key={it.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 p-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">{it.name}</p>
              <p className="text-xs text-gray-400">Qty {it.quantity} {it.unit}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-28">
                <Field label="Unit price (₹)">
                  <Input
                    name={`price_${it.id}`}
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={it.unitPrice != null ? String(it.unitPrice) : ""}
                    placeholder="Required"
                  />
                </Field>
              </div>
              <div className="w-20">
                <Field label="GST %">
                  <Input name={`gst_${it.id}`} type="number" step="0.1" min="0" max="100" defaultValue={String(it.gstRate)} />
                </Field>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button type="submit" disabled={pending} size="lg" className="w-full sm:w-auto">
        {pending && <Spinner />} Save Quote & Notify Customer
      </Button>
      <p className="text-xs text-gray-400">
        Saving the quote sets each line&apos;s price, computes the GST total and marks the order as &quot;Quoted&quot;.
      </p>
    </form>
  );
}
