"use client";

import { useActionState } from "react";
import { createCategory, updateCategory } from "@/actions/admin-actions";
import { Input, Textarea, Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui";

export function CategoryForm({
  defaultValues,
}: {
  defaultValues?: {
    id: string;
    name: string;
    description?: string;
    image?: string;
    gstRate?: number;
    sortOrder?: number;
    isActive?: boolean;
  };
}) {
  const [state, formAction, pending] = useActionState(
    defaultValues?.id ? updateCategory : createCategory,
    undefined
  );

  return (
    <form action={formAction} className="space-y-4">
      {defaultValues?.id ? <input type="hidden" name="id" value={defaultValues.id} /> : null}
      {state?.success && <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Saved.</div>}
      {state?.error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>}
      {state?.fieldErrors && (
        <ul className="space-y-0.5 text-xs text-red-600">
          {Object.entries(state.fieldErrors).map(([k, v]) => (
            <li key={k}>{k}: {v.join(", ")}</li>
          ))}
        </ul>
      )}
      <Field label="Category name *">
        <Input name="name" defaultValue={defaultValues?.name} required />
      </Field>
      <Field label="Description">
        <Textarea name="description" rows={2} defaultValue={defaultValues?.description} />
      </Field>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Image URL">
          <Input name="image" defaultValue={defaultValues?.image} />
        </Field>
        <Field label="GST %">
          <Input name="gstRate" type="number" step="0.1" min="0" max="100" defaultValue={String(defaultValues?.gstRate ?? 18)} required />
        </Field>
        <Field label="Sort order">
          <Input name="sortOrder" type="number" defaultValue={defaultValues?.sortOrder ?? 0} />
        </Field>
      </div>
      {defaultValues?.id && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Changing the GST % also updates every product in this category.
        </p>
      )}
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" name="isActive" defaultChecked={defaultValues?.isActive ?? true} className="accent-brand-600" />
        Active
      </label>
      <Button type="submit" disabled={pending}>
        {pending && <Spinner />} {defaultValues?.id ? "Update" : "Add category"}
      </Button>
    </form>
  );
}
