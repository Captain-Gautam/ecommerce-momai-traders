"use client";

import { useState } from "react";
import { useActionState } from "react";
import { createProduct, updateProduct } from "@/actions/admin-actions";
import { Input, Textarea, Field, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui";

const UNITS = ["pcs", "roll", "kg", "box", "set", "litre", "pack", "bundle", "sqft", "ream"];

type ProductFormValues = {
  id?: string;
  name?: string;
  categoryId?: string;
  description?: string;
  specifications?: string;
  unit?: string;
  price?: string;
  gstRate?: string;
  hsnCode?: string;
  minOrderQty?: string;
  stock?: string;
  image?: string;
  isActive?: boolean;
  isFeatured?: boolean;
};

export function ProductForm({
  categories,
  defaultValues,
}: {
  categories: { id: string; name: string; gstRate: number }[];
  defaultValues?: ProductFormValues;
}) {
  const [state, formAction, pending] = useActionState(
    defaultValues?.id ? updateProduct : createProduct,
    undefined
  );

  const defaultCategory = categories.find((c) => c.id === defaultValues?.categoryId);
  const [gstRate, setGstRate] = useState(
    defaultValues?.gstRate ?? String(defaultCategory?.gstRate ?? 18)
  );

  return (
    <form action={formAction} className="space-y-5">
      {defaultValues?.id ? (
        <input type="hidden" name="id" value={defaultValues.id} />
      ) : null}

      {state?.success && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Saved.</div>
      )}
      {state?.error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
      )}
      {state?.fieldErrors && (
        <ul className="space-y-0.5 text-xs text-red-600">
          {Object.entries(state.fieldErrors).map(([k, v]) => (
            <li key={k}>{k}: {v.join(", ")}</li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Product name *">
          <Input name="name" defaultValue={defaultValues?.name} required />
        </Field>
        <Field label="Category *">
          <Select
            name="categoryId"
            defaultValue={defaultValues?.categoryId}
            required
            onChange={(e) => {
              const c = categories.find((x) => x.id === e.target.value);
              if (c) setGstRate(String(c.gstRate));
            }}
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Description">
        <Textarea name="description" rows={3} defaultValue={defaultValues?.description} placeholder="Short description shown on the product page" />
      </Field>

      <Field label="Specifications (one per line, format: Key: Value)">
        <Textarea
          name="specifications"
          rows={4}
          defaultValue={defaultValues?.specifications}
          placeholder={"Size: 45 micron\nColour: Blue\nThickness: 500 gauge"}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Field label="Unit *">
          <Select name="unit" defaultValue={defaultValues?.unit ?? "pcs"}>
            {UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </Select>
        </Field>
        <Field label="Price (₹) — leave blank for enquiry">
          <Input name="price" type="number" step="0.01" min="0" defaultValue={defaultValues?.price} placeholder="e.g. 350" />
        </Field>
        <Field label="GST % *">
          <Input
            name="gstRate"
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={gstRate}
            onChange={(e) => setGstRate(e.target.value)}
            required
          />
          <p className="text-xs text-gray-400">Defaults to the category GST.</p>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Field label="HSN code">
          <Input name="hsnCode" defaultValue={defaultValues?.hsnCode} placeholder="e.g. 3921" />
        </Field>
        <Field label="Min. order qty *">
          <Input name="minOrderQty" type="number" min="1" defaultValue={defaultValues?.minOrderQty ?? "1"} required />
        </Field>
        <Field label="Stock (optional)">
          <Input name="stock" type="number" min="0" defaultValue={defaultValues?.stock} placeholder="Leave blank if not tracked" />
        </Field>
      </div>

      <Field label="Image URL">
        <Input name="image" defaultValue={defaultValues?.image} placeholder="https://… or /images/…" />
      </Field>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" name="isActive" defaultChecked={defaultValues?.isActive ?? true} className="accent-brand-600" />
          Active (visible on store)
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" name="isFeatured" defaultChecked={defaultValues?.isFeatured} className="accent-brand-600" />
          Featured on homepage
        </label>
      </div>

      <Button type="submit" disabled={pending}>
        {pending && <Spinner />} {defaultValues?.id ? "Update product" : "Create product"}
      </Button>
    </form>
  );
}
