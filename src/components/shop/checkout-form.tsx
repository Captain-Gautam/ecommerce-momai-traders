"use client";

import { useActionState, useState } from "react";
import { placeOrder } from "@/actions/order-actions";
import { AddressFields } from "@/components/shop/address-fields";
import { Button } from "@/components/ui/button";
import { Textarea, Field } from "@/components/ui/input";
import { Spinner } from "@/components/ui";
import { cn } from "@/lib/utils";

type OrderAddress = {
  id: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

const PAYMENT_METHODS = [
  { value: "COD", label: "Cash on Delivery", hint: "Pay when your order arrives" },
  { value: "BANK_TRANSFER", label: "Bank Transfer (NEFT/UPI)", hint: "We'll share bank details to confirm" },
  { value: "WHATSAPP", label: "Pay via WhatsApp", hint: "Confirm payment over WhatsApp" },
];

export function CheckoutForm({
  addresses,
  items,
  estimatedTotal,
  hasUnpriced,
}: {
  addresses: OrderAddress[];
  items: { name: string; quantity: number; unit: string; unitPrice: number | null }[];
  estimatedTotal: number;
  hasUnpriced: boolean;
}) {
  const [state, formAction, pending] = useActionState(placeOrder, undefined);
  const [createNew, setCreateNew] = useState(addresses.length === 0);
  const [sameAsBilling, setSameAsBilling] = useState(true);

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-bold text-gray-900">1 · Billing address</h2>
        {addresses.length > 0 && (
          <div className="mt-4 space-y-2">
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
            <button
              type="button"
              onClick={() => setCreateNew(true)}
              className="mt-2 text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              + Add a new address
            </button>
          </div>
        )}
        {(createNew || addresses.length === 0) && (
          <div className="mt-4">
            {addresses.length > 0 && (
              <div className="mb-3 flex gap-3">
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
            )}
            <input type="hidden" name="createNew" value={createNew ? "1" : "0"} />
            <AddressFields requireContact />
          </div>
        )}
        {state?.fieldErrors && (
          <ul className="mt-2 space-y-0.5 text-xs text-red-600">
            {Object.entries(state.fieldErrors).map(([k, v]) => (
              <li key={k}>{k}: {v.join(", ")}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-bold text-gray-900">2 · Shipping address</h2>
        <label className="mt-4 flex cursor-pointer items-start gap-3">
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
          <div className="mt-4">
            <AddressFields prefix="shipping_" requireContact />
          </div>
        )}
        {state?.fieldErrors && (
          <ul className="mt-2 space-y-0.5 text-xs text-red-600">
            {Object.entries(state.fieldErrors).map(([k, v]) => (
              <li key={k}>{k}: {v.join(", ")}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-bold text-gray-900">3 · Payment method</h2>
        <div className="mt-4 space-y-2">
          {PAYMENT_METHODS.map((m) => (
            <label
              key={m.value}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-3 transition-colors hover:border-brand-300"
            >
              <input type="radio" name="paymentMethod" value={m.value} defaultChecked={m.value === "COD"} className="mt-1 accent-brand-600" />
              <span className="text-sm">
                <strong className="text-gray-900">{m.label}</strong>
                <p className="text-xs text-gray-500">{m.hint}</p>
              </span>
            </label>
          ))}
        </div>
        <div className="mt-4">
          <Field label="Order note (optional)">
            <Textarea name="customerNote" rows={2} placeholder="Delivery instructions, specs, colour preference…" />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-bold text-gray-900">4 · Review items</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {items.map((it, i) => (
            <li key={i} className="flex justify-between gap-4">
              <span className="text-gray-800">
                {it.name}
                <span className="text-gray-400"> × {it.quantity} {it.unit}</span>
              </span>
              <span className="font-medium text-gray-900">
                {it.unitPrice != null ? `₹${(it.unitPrice * it.quantity).toLocaleString("en-IN")}` : "To be quoted"}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t border-gray-100 pt-3">
          <div className="flex justify-between text-sm font-semibold text-gray-900">
            <span>Estimated total (excl. GST)</span>
            <span>{hasUnpriced ? "To be quoted" : `₹${estimatedTotal.toLocaleString("en-IN")}`}</span>
          </div>
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Final price incl. GST is confirmed by our team after you place the order. No payment is collected at this
            step.
          </p>
        </div>
      </section>

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending && <Spinner />} Place Order — No payment now
      </Button>
      <p className="text-center text-xs text-gray-400">
        By placing this order you agree to receive a confirmation call/WhatsApp with the final quote.
      </p>
    </form>
  );
}
