"use client";

import Link from "next/link";
import { useActionState } from "react";
import { adminLogin } from "@/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Spinner } from "@/components/ui";

export function AdminLoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(adminLogin, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next ?? "/admin"} />
      {state?.error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
      )}
      <Field label="Email">
        <Input name="email" type="email" placeholder="admin@momaitraders.in" autoComplete="username" required />
      </Field>
      <Field label="Password">
        <Input name="password" type="password" placeholder="••••••••" autoComplete="current-password" required />
      </Field>
      <div className="flex justify-end -mt-2">
        <Link
          href={`/forgot-password${next ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          Forgot password?
        </Link>
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending && <Spinner />} Sign in to Admin
      </Button>
    </form>
  );
}
