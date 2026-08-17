"use client";

import { useActionState } from "react";
import { submitEnquiry } from "@/actions/enquiry-actions";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field, Select } from "@/components/ui/input";
import { Spinner } from "@/components/ui";

export function EnquiryForm({
  variant = "product",
  productId,
  productName,
  unit,
}: {
  variant?: "contact" | "product";
  productId?: string;
  productName?: string;
  unit?: string;
}) {
  const [state, formAction, pending] = useActionState(submitEnquiry, undefined);

  if (state?.success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-900">Enquiry received!</h3>
        <p className="mt-1 text-sm text-gray-600">
          Thank you. Our team will get back to you with the details — usually within a few hours on email or phone.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {productId ? <input type="hidden" name="productId" value={productId} /> : null}

      {renderErrors(state)}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Your name">
          <Input name="name" placeholder="Full name" required />
        </Field>
        <Field label="Company Name">
          <Input name="company" placeholder="Company / business name" required />
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Phone Number">
          <Input name="phone" placeholder="+91 98XXXXXX00" required />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" placeholder="you@example.com" />
        </Field>
      </div>

      {variant === "contact" ? (
        <>
          <Field label="Subject">
            <Input name="subject" placeholder="What is this about?" />
          </Field>
          <Field label="Message">
            <Textarea name="message" rows={4} placeholder="Write your message here..." required />
          </Field>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Quantity">
              <Input name="quantity" type="number" min={1} placeholder="e.g. 10" />
            </Field>
            <Field label="Unit">
              <Select name="unit" defaultValue={unit ?? "pcs"}>
                {["pcs", "roll", "kg", "box", "set", "litre", "pack", "bundle", "sqft", "ream"].map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Specifications / size (optional)">
            <Input name="specs" placeholder={'e.g. 45 micron, 20" x 30", blue colour'} />
          </Field>
          <Field label="Your requirement">
            <Textarea
              name="message"
              rows={4}
              defaultValue={productName ? `I&apos;m interested in ${productName}. Please share wholesale pricing and availability.` : ""}
              required
            />
          </Field>
        </>
      )}

      <Button type="submit" className="w-full" disabled={pending} size="lg">
        {pending && <Spinner />} Submit Enquiry
      </Button>
      <p className="text-center text-xs text-gray-400">
        We respond on Email / phone usually within business hours.
      </p>
    </form>
  );
}

function renderErrors(state?: { error?: string; fieldErrors?: Record<string, string[]> }) {
  const fieldErrors = state?.fieldErrors ? Object.entries(state.fieldErrors) : [];
  if (!state?.error && fieldErrors.length === 0) return null;
  return (
    <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
      {state?.error ? <p>{state.error}</p> : null}
      {fieldErrors.map(([field, messages]) => (
        <p key={field}>
          {field}: {messages.join(", ")}
        </p>
      ))}
    </div>
  );
}
