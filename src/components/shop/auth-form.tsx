"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, registerAction } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Spinner } from "@/components/ui";

export function AuthForm({
  mode,
  next,
}: {
  mode: "login" | "register";
  next?: string;
}) {
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {mode === "login"
            ? "Sign in to view orders, track deliveries and shop faster."
            : "Create an account to place orders and track them like a pro."}
        </p>

        {state?.error && (
          <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </div>
        )}

        <form action={formAction} className="mt-6 space-y-4">
          {next ? <input type="hidden" name="next" value={next} /> : null}

          {mode === "register" && (
            <>
              <Field label="Full name" hint="Your name as it should appear on the invoice.">
                <Input name="name" placeholder="e.g. Rahul Shah" autoComplete="name" required />
                <FieldError msg={state?.fieldErrors?.name?.[0]} />
              </Field>
              <Field label="Business / Company (optional)">
                <Input name="businessName" placeholder="e.g. Shah Enterprises" />
              </Field>
              <Field label="Phone">
                <Input name="phone" placeholder="+91 98XXXXXX00" autoComplete="tel" required />
                <FieldError msg={state?.fieldErrors?.phone?.[0]} />
              </Field>
            </>
          )}

          <Field label="Email address">
            <Input name="email" type="email" placeholder="you@example.com" autoComplete="email" required />
            <FieldError msg={state?.fieldErrors?.email?.[0]} />
          </Field>

          <Field label="Password">
            <Input
              name="password"
              type="password"
              placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
            />
            <FieldError msg={state?.fieldErrors?.password?.[0]} />
          </Field>

          {mode === "login" && (
            <div className="flex justify-end -mt-2">
              <Link
                href={`/forgot-password${next ? `?next=${encodeURIComponent(next)}` : ""}`}
                className="text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                Forgot password?
              </Link>
            </div>
          )}

          {mode === "register" && (
            <Field label="Confirm password">
              <Input
                name="confirmPassword"
                type="password"
                placeholder="Re-enter password"
                autoComplete="new-password"
                required
              />
              <FieldError msg={state?.fieldErrors?.confirmPassword?.[0]} />
            </Field>
          )}

          <Button type="submit" className="w-full" disabled={pending} size="lg">
            {pending && <Spinner />}
            {mode === "login" ? "Sign In" : "Create Account"}
          </Button>
        </form>
      </div>

      <p className="mt-4 text-center text-sm text-gray-500">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-medium text-brand-600 hover:text-brand-700">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-medium text-brand-600 hover:text-brand-700">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs font-medium text-red-600">{msg}</p> : null;
}
