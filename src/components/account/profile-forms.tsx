"use client";

import { useActionState } from "react";
import { updateProfile, changePassword } from "@/actions/account-actions";
import { Input, Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui";

export function ProfileForm({
  name,
  phone,
  businessName,
}: {
  name: string;
  phone: string | null;
  businessName: string | null;
}) {
  const [state, formAction, pending] = useActionState(updateProfile, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {state?.success && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Profile updated.</div>
      )}
      {state?.error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>}
      <Field label="Full name *">
        <Input name="name" defaultValue={name} required />
      </Field>
      {state?.fieldErrors?.name && (
        <p className="text-xs text-red-600">{state.fieldErrors.name.join(", ")}</p>
      )}
      <Field label="Phone *">
        <Input name="phone" defaultValue={phone ?? ""} placeholder="+91 98XXXXXX00" required />
        {state?.fieldErrors?.phone && (
          <p className="text-xs text-red-600">{state.fieldErrors.phone.join(", ")}</p>
        )}
      </Field>
      <Field label="Business / shop name (optional)">
        <Input name="businessName" defaultValue={businessName ?? ""} placeholder="For invoice billing" />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending && <Spinner />} Save changes
      </Button>
    </form>
  );
}

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {state?.success && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Password changed.</div>
      )}
      {state?.error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>}
      <Field label="Current password">
        <Input name="currentPassword" type="password" required />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="New password">
          <Input name="newPassword" type="password" minLength={8} required />
        </Field>
        <Field label="Confirm new password">
          <Input name="confirmPassword" type="password" minLength={8} required />
        </Field>
      </div>
      <Button type="submit" disabled={pending}>
        {pending && <Spinner />} Change password
      </Button>
    </form>
  );
}
