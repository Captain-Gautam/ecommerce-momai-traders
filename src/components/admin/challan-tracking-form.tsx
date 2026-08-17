"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { updateChallanTracking } from "@/actions/dispatch-actions";
import { Input, Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { buildTrackingUrl } from "@/lib/tracking";

type ChallanTracking = {
  id: string;
  courierName: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
};

export function ChallanTrackingForm({ challan }: { challan: ChallanTracking }) {
  const [open, setOpen] = useState(false);

  const hasTracking = Boolean(challan.courierName || challan.trackingNumber);
  const trackingUrl = buildTrackingUrl(challan.courierName, challan.trackingNumber, challan.trackingUrl);

  return (
    <div className="flex items-center gap-2">
      {trackingUrl ? (
        <a href={trackingUrl} target="_blank" rel="noreferrer">
          <Button variant="outline" className="h-8 px-3 text-xs">Track</Button>
        </a>
      ) : null}
      {open ? (
        <form action={updateChallanTracking} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <input type="hidden" name="id" value={challan.id} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Courier">
              <Input name="courierName" defaultValue={challan.courierName ?? ""} placeholder="e.g. Delhivery" />
            </Field>
            <Field label="Tracking / AWB no.">
              <Input name="trackingNumber" defaultValue={challan.trackingNumber ?? ""} placeholder="e.g. 2837788500730" />
            </Field>
            <Field label="Tracking URL (optional)">
              <Input name="trackingUrl" defaultValue={challan.trackingUrl ?? ""} placeholder="https://… overrides courier link" />
            </Field>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <SaveButton />
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" className="h-8 px-3 text-xs" onClick={() => setOpen(true)}>
          {hasTracking ? "Edit tracking" : "Add tracking"}
        </Button>
      )}
    </div>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Saving…" : "Save"}
    </Button>
  );
}
