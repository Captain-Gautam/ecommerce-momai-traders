"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { sendResetOtpAction, resetPasswordAction, type AuthState } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Spinner } from "@/components/ui";

export function ForgotPasswordForm({ next }: { next?: string }) {
  const [step, setStep] = useState<"email" | "otp" | "done">("email");
  const [email, setEmail] = useState("");
  const [sendState, setSendState] = useState<AuthState | undefined>();
  const [resetState, setResetState] = useState<AuthState | undefined>();
  const [sendPending, setSendPending] = useState(false);
  const [resetPending, setResetPending] = useState(false);

  const loginHref = `/login${next ? `?next=${encodeURIComponent(next)}` : ""}`;

  async function handleSend(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setSendPending(true);
    try {
      const res = await sendResetOtpAction(undefined, data);
      setSendState(res);
      if (res?.success === true) {
        setEmail(String(data.get("email") ?? ""));
        setStep("otp");
      }
    } finally {
      setSendPending(false);
    }
  }

  async function handleReset(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setResetPending(true);
    try {
      const res = await resetPasswordAction(undefined, data);
      setResetState(res);
      if (res?.success === true) setStep("done");
    } finally {
      setResetPending(false);
    }
  }

  if (step === "done") {
    return (
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col items-center text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </span>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">Password updated</h1>
            <p className="mt-1 text-sm text-gray-500">
              Your password has been reset. Sign in with your new password.
            </p>
            <Button asChild className="mt-6 w-full" size="lg">
              <Link href={loginHref}>Back to sign in</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900">Forgot password?</h1>
        <p className="mt-1 text-sm text-gray-500">
          {step === "email"
            ? "Enter the email on your account and we'll send you a one-time code."
            : `Enter the 6-digit code sent to ${email} and choose a new password.`}
        </p>

        {step === "email" ? (
          <>
            {(sendState?.error || sendState?.fieldErrors?.email?.[0]) && (
              <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {sendState?.error ?? sendState?.fieldErrors?.email?.[0]}
              </div>
            )}
            <form onSubmit={handleSend} className="mt-6 space-y-4">
              <Field label="Email address">
                <Input
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  defaultValue={email}
                />
              </Field>
              <Button type="submit" className="w-full" size="lg" disabled={sendPending}>
                {sendPending && <Spinner />} Send code
              </Button>
            </form>
          </>
        ) : (
          <>
            {(resetState?.error ||
              resetState?.fieldErrors?.otp?.[0] ||
              resetState?.fieldErrors?.password?.[0] ||
              resetState?.fieldErrors?.confirmPassword?.[0]) && (
              <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {resetState?.error ??
                  resetState?.fieldErrors?.otp?.[0] ??
                  resetState?.fieldErrors?.password?.[0] ??
                  resetState?.fieldErrors?.confirmPassword?.[0]}
              </div>
            )}
            <form onSubmit={handleReset} className="mt-6 space-y-4">
              <input type="hidden" name="email" value={email} />
              <Field label="One-time code">
                <Input
                  name="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
                <FieldError msg={resetState?.fieldErrors?.otp?.[0]} />
              </Field>
              <Field label="New password">
                <Input
                  name="password"
                  type="password"
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  required
                />
                <FieldError msg={resetState?.fieldErrors?.password?.[0]} />
              </Field>
              <Field label="Confirm new password">
                <Input
                  name="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  required
                />
                <FieldError msg={resetState?.fieldErrors?.confirmPassword?.[0]} />
              </Field>
              <Button type="submit" className="w-full" size="lg" disabled={resetPending}>
                {resetPending && <Spinner />} Reset password
              </Button>
            </form>
            <button
              type="button"
              onClick={() => setStep("email")}
              className="mt-4 w-full text-center text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Request a new code
            </button>
          </>
        )}
      </div>

      <p className="mt-4 text-center text-sm text-gray-500">
        Remembered it?{" "}
        <Link href={loginHref} className="font-medium text-brand-600 hover:text-brand-700">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs font-medium text-red-600">{msg}</p> : null;
}
