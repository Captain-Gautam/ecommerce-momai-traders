"use client";

import { useActionState, useState } from "react";
import { submitQuoteRequest } from "@/actions/quote-actions";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field, Select } from "@/components/ui/input";
import { Spinner } from "@/components/ui";

type QuoteProduct = { id: string; name: string; unit: string };

type Row = {
  key: number;
  productId: string;
  unit: string;
  quantity: string;
};

const UNITS = ["pcs", "roll", "kg", "box", "set", "litre", "pack", "bundle", "sqft", "ream"];

let rowCounter = 1;

export function QuoteForm({
  products,
  initialProductId,
}: {
  products: QuoteProduct[];
  initialProductId?: string;
}) {
  const [state, formAction, pending] = useActionState(submitQuoteRequest, undefined);
  const [rows, setRows] = useState<Row[]>(() => {
    const initial = initialProductId ? products.find((p) => p.id === initialProductId) : undefined;
    return initial
      ? [{ key: 0, productId: initial.id, unit: initial.unit, quantity: "1" }]
      : [{ key: 0, productId: "", unit: "", quantity: "1" }];
  });

  const updateRow = (key: number, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const selectProduct = (key: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    updateRow(key, { productId, unit: product?.unit ?? "" });
  };

  const addRow = () => {
    setRows((prev) => [
      { key: rowCounter++, productId: "", unit: "", quantity: "1" },
      ...prev,
    ]);
  };

  const removeRow = (key: number) => {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((r) => r.key !== key)));
  };

  const serializedItems = rows
    .filter((r) => r.productId)
    .map((r) => ({
      productId: r.productId,
      unit: r.unit.trim() || products.find((p) => p.id === r.productId)?.unit || "pcs",
      quantity: Math.max(1, Number(r.quantity) || 1),
    }));

  if (state?.success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <svg className="size-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900">Quote request received!</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
          Thank you. Your product list has been emailed to our team and you&apos;ll hear back with wholesale pricing —
          usually within a few hours on email or phone.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="items" value={JSON.stringify(serializedItems)} />

      {state?.error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
      )}

      {/* Product list */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800">Your product list</p>
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100"
          >
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add product
          </button>
        </div>
        <div className="max-h-[28rem] space-y-3 overflow-y-auto rounded-xl border border-gray-200 p-3">
          {rows.map((row) => (
              <div key={row.key} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_6rem_5rem_auto]">
                  <Field label="Product">
                    <ProductSearch
                      products={products}
                      value={row.productId}
                      onChange={(productId) => selectProduct(row.key, productId)}
                    />
                  </Field>
                  <Field label="Unit">
                    <Select
                      value={row.unit}
                      onChange={(e) => updateRow(row.key, { unit: e.target.value })}
                    >
                      <option value="">Unit</option>
                      {UNITS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Quantity">
                    <Input
                      type="number"
                      min={1}
                      value={row.quantity}
                      onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
                      placeholder="Qty"
                      required
                    />
                  </Field>
                  {rows.length > 1 && (
                    <div className="flex items-end pb-1">
                      <button
                        type="button"
                        onClick={() => removeRow(row.key)}
                        aria-label="Remove product"
                        className="flex size-10 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
                      >
                        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
        {state?.fieldErrors?.items?.[0] && (
          <p className="mt-1 text-xs font-medium text-red-600">{state.fieldErrors.items[0]}</p>
        )}
      </div>

      {/* Contact details */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Your name">
          <Input name="name" placeholder="Full name" required />
        </Field>
        <Field label="Phone (recommended)">
          <Input name="phone" placeholder="+91 98XXXXXX00" />
        </Field>
      </div>
      <Field label="Email">
        <Input name="email" type="email" placeholder="you@example.com" />
      </Field>
      <Field label="Your requirement (optional)" hint="Share sizes, brands, delivery location or any other details.">
        <Textarea
          name="message"
          rows={4}
          placeholder="e.g. Need monthly supply, prefer 45 micron bags, deliver to Ahmedabad."
        />
      </Field>

      <Button type="submit" className="w-full" disabled={pending} size="lg">
        {pending && <Spinner />} Send Quote Request
      </Button>
      <p className="text-center text-xs text-gray-400">
        Sent straight to our team and reflected instantly in our dashboard.
      </p>
    </form>
  );
}

function ProductSearch({
  products,
  value,
  onChange,
}: {
  products: QuoteProduct[];
  value: string;
  onChange: (productId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = products.find((p) => p.id === value);
  const inputValue = selected ? selected.name : query;

  const filtered = query.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()))
    : products;

  return (
    <div className="relative">
      <Input
        value={inputValue}
        onChange={(e) => {
          setQuery(e.target.value);
          if (value) onChange("");
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search a product…"
        role="combobox"
        aria-expanded={open}
        autoComplete="off"
        required
      />
      {open && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg">
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-400">No products found.</p>
          ) : (
            filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(p.id);
                  setQuery("");
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-brand-50"
              >
                <span>{p.name}</span>
                <span className="shrink-0 text-xs text-gray-400">{p.unit}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
