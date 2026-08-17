"use client";

import { useActionState } from "react";
import { addAddress } from "@/actions/account-actions";
import { AddressFields } from "@/components/shop/address-fields";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui";

export function AddAddressForm() {
  const [state, formAction, pending] = useActionState(addAddress, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {state?.success && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Address added.</div>
      )}
      {state?.error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>}
      {state?.fieldErrors && (
        <ul className="space-y-0.5 text-xs text-red-600">
          {Object.entries(state.fieldErrors).map(([k, v]) => (
            <li key={k}>{k}: {v.join(", ")}</li>
          ))}
        </ul>
      )}
      <AddressFields />
      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input type="checkbox" name="isDefault" className="accent-brand-600" />
        Set as default address
      </label>
      <Button type="submit" disabled={pending}>
        {pending && <Spinner />} Save address
      </Button>
    </form>
  );
}
