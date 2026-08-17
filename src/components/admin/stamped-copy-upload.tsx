"use client";

import { useEffect, useRef } from "react";
import { useActionState } from "react";
import { uploadStampedCopyAction } from "@/actions/document-archive";
import { Button } from "@/components/ui/button";

export function StampedCopyUpload({
  orderId,
  docType,
  challanId,
  label = "Upload stamped copy",
}: {
  orderId: string;
  docType: "INVOICE" | "CHALLAN";
  challanId?: string;
  label?: string;
}) {
  const [state, formAction, pending] = useActionState(uploadStampedCopyAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state?.success && fileRef.current) fileRef.current.value = "";
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="docType" value={docType} />
      {challanId ? <input type="hidden" name="challanId" value={challanId} /> : null}
      <input
        ref={fileRef}
        type="file"
        name="file"
        accept="image/png,image/jpeg,application/pdf"
        required
        className="sr-only"
        onChange={() => formRef.current?.requestSubmit()}
      />
      <Button
        type="button"
        variant="outline"
        size="xs"
        disabled={pending}
        onClick={() => fileRef.current?.click()}
        className={challanId ? "h-8 border-brand-200 text-xs text-brand-700 hover:bg-brand-50" : undefined}
      >
        {pending ? "Uploading…" : label}
      </Button>
      {state?.error ? <span className="text-xs text-red-600">{state.error}</span> : null}
      {state?.success ? <span className="text-xs text-emerald-600">Saved to Drive.</span> : null}
    </form>
  );
}
