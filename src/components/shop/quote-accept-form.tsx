"use client";

import { useActionState, useState } from "react";
import { acceptQuotation, requestQuoteChanges } from "@/actions/quotation-actions";
import { Input, Field, Textarea } from "@/components/ui/input";
import { AddressFields } from "@/components/shop/address-fields";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui";
import { formatINR, cn } from "@/lib/utils";

type AcceptItem = {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number | null;
  gstRate: number;
  hsnCode: string | null;
};

type OrderAddress = {
  id: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

export function QuoteAcceptForm({
  token,
  items,
  buyerState,
  addresses,
  disabled,
  requesterName,
}: {
  token: string;
  items: AcceptItem[];
  buyerState: string;
  addresses: OrderAddress[];
  disabled: boolean;
  requesterName: string;
}) {
  const [acceptState, acceptAction, accepting] = useActionState(acceptQuotation, undefined);
  const [changeState, changeAction, sendingChanges] = useActionState(requestQuoteChanges, undefined);
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(items.map((it) => [it.id, it.quantity]))
  );
  const [createNew, setCreateNew] = useState(addresses.length === 0);
  const [sameAsBilling, setSameAsBilling] = useState(true);

  const totals = calcTotals(
    items.map((it) => ({ ...it, quantity: Math.max(1, quantities[it.id] ?? it.quantity) })),
    buyerState
  );

  return (
    <div className="space-y-6">
      {acceptState?.error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{acceptState.error}</div>
      )}
      {acceptState?.fieldErrors &&
        Object.entries(acceptState.fieldErrors).map(([key, msgs]) => (
          <div key={key} className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {key}: {msgs.join(", ")}
          </div>
        ))}
      {changeState?.success && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Thanks! Your change request has been sent to our team.
        </div>
      )}
      {changeState?.error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{changeState.error}</div>
      )}

      <form action={acceptAction} className="space-y-5">
        <input type="hidden" name="token" value={token} />

        <div className="overflow-hidden rounded-xl border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-3 py-2.5 font-semibold">Item</th>
                  <th className="px-3 py-2.5 font-semibold">HSN</th>
                  <th className="px-3 py-2.5 font-semibold">GST %</th>
                  <th className="px-3 py-2.5 font-semibold">Unit price</th>
                  <th className="px-3 py-2.5 font-semibold">Quantity</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => {
                  const qty = Math.max(1, quantities[it.id] ?? it.quantity);
                  return (
                    <tr key={it.id} className="border-b border-gray-50 last:border-b-0">
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-gray-900">{it.name}</p>
                        <p className="text-xs text-gray-400">{it.unit}</p>
                      </td>
                      <td className="px-3 py-2.5 text-gray-500">{it.hsnCode ?? "-"}</td>
                      <td className="px-3 py-2.5 text-gray-600">{it.gstRate}%</td>
                      <td className="px-3 py-2.5 text-gray-900">{formatINR(it.unitPrice)}</td>
                      <td className="px-3 py-2.5">
                        <Input
                          type="number"
                          min={1}
                          value={qty}
                          onChange={(e) =>
                            setQuantities((prev) => ({ ...prev, [it.id]: Number(e.target.value) || 1 }))
                          }
                          className="w-24"
                        />
                        <input type="hidden" name={`qty_${it.id}`} value={qty} />
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium text-gray-900">
                        {formatINR((it.unitPrice ?? 0) * qty)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <dl className="ml-auto max-w-xs space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <dt>Subtotal</dt>
            <dd className="font-medium text-gray-900">{formatINR(totals.subtotal)}</dd>
          </div>
          {totals.cgst > 0 && (
            <div className="flex justify-between text-gray-600">
              <dt>CGST</dt>
              <dd className="font-medium text-gray-900">{formatINR(totals.cgst)}</dd>
            </div>
          )}
          {totals.sgst > 0 && (
            <div className="flex justify-between text-gray-600">
              <dt>SGST</dt>
              <dd className="font-medium text-gray-900">{formatINR(totals.sgst)}</dd>
            </div>
          )}
          {totals.igst > 0 && (
            <div className="flex justify-between text-gray-600">
              <dt>IGST</dt>
              <dd className="font-medium text-gray-900">{formatINR(totals.igst)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-bold text-gray-900">
            <dt>Total</dt>
            <dd>{formatINR(totals.grandTotal)}</dd>
          </div>
        </dl>

        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-sm font-bold text-gray-900">Billing address</h3>
            <p className="mt-0.5 text-xs text-gray-500">Used on your GST invoice.</p>
            <div className="mt-3">
              {addresses.length > 0 && (
                <div className="space-y-2">
                  {addresses.map((a) => (
                    <label
                      key={a.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                        !createNew ? "border-brand-500 bg-brand-50/50" : "border-gray-200 hover:border-brand-300"
                      )}
                    >
                      <input
                        type="radio"
                        name="addressId"
                        value={a.id}
                        checked={!createNew}
                        onChange={() => setCreateNew(false)}
                        className="mt-1 accent-brand-600"
                      />
                      <span className="text-sm text-gray-800">
                        <strong>{a.line1}</strong>
                        {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} — {a.pincode}
                        {a.isDefault ? <span className="ml-2 rounded bg-brand-100 px-1.5 py-0.5 text-xs font-medium text-brand-700">Default</span> : null}
                      </span>
                    </label>
                  ))}
                  <div className="mb-1 flex gap-3">
                    <input
                      type="radio"
                      name="addressId"
                      value=""
                      checked={createNew}
                      onChange={() => setCreateNew(true)}
                      className="mt-1 accent-brand-600"
                    />
                    <span className="text-sm text-gray-600">Enter a new address</span>
                  </div>
                </div>
              )}
              {(createNew || addresses.length === 0) && (
                <div>
                  <input type="hidden" name="createNew" value={createNew ? "1" : "0"} />
                  <AddressFields requireContact />
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-sm font-bold text-gray-900">Shipping address</h3>
            <p className="mt-0.5 text-xs text-gray-500">Where we deliver your order.</p>
            <label className="mt-3 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                name="sameAsBilling"
                value="1"
                checked={sameAsBilling}
                onChange={(e) => setSameAsBilling(e.target.checked)}
                className="mt-1 accent-brand-600"
              />
              <span className="text-sm text-gray-700">Shipping address same as billing address</span>
            </label>
            {!sameAsBilling && (
              <div className="mt-3">
                <AddressFields prefix="shipping_" requireContact />
              </div>
            )}
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={disabled || accepting} size="lg">
          {accepting && <Spinner />} Accept Quotation & Confirm Order
        </Button>
        {disabled && (
          <p className="text-center text-xs text-gray-400">
            {requesterName
              ? "Please log in with the email used for this quote to accept it."
              : "Log in to accept this quotation."}
          </p>
        )}
      </form>

      <div className="border-t border-gray-100 pt-4">
        <h3 className="text-sm font-semibold text-gray-900">Need to change something?</h3>
        <form action={changeAction} className="mt-2 space-y-3">
          <input type="hidden" name="token" value={token} />
          <Field label="Tell us what to change">
            <Textarea
              name="message"
              rows={2}
              placeholder="e.g. Please reduce the quantity of the first item, or add more of item 3."
              required
            />
          </Field>
          <Button type="submit" variant="outline" disabled={sendingChanges}>
            {sendingChanges && <Spinner />} Request Changes
          </Button>
        </form>
      </div>
    </div>
  );
}

function calcTotals(
  items: Array<{ unitPrice: number | null; quantity: number; gstRate: number }>,
  buyerState: string
) {
  const SELLER_STATE = "24";
  const intraState = buyerState.trim().toUpperCase() === SELLER_STATE;
  let subtotal = 0;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  for (const it of items) {
    const taxable = round2((it.unitPrice ?? 0) * it.quantity);
    const tax = round2((taxable * it.gstRate) / 100);
    subtotal += taxable;
    if (intraState) {
      cgst += round2(tax / 2);
      sgst += round2(tax / 2);
    } else {
      igst += tax;
    }
  }
  return {
    subtotal: round2(subtotal),
    cgst: round2(cgst),
    sgst: round2(sgst),
    igst: round2(igst),
    grandTotal: round2(subtotal + cgst + sgst + igst),
  };
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
