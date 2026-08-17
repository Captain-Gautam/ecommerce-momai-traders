"use client";

import { useEffect, useRef, useState } from "react";
import { Input, Field, Select } from "@/components/ui/input";

export const INDIA_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Puducherry",
  "Chandigarh",
  "Andaman and Nicobar Islands",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Lakshadweep",
];

type LookupStatus = "idle" | "looking" | "notfound";

export function AddressFields({
  prefix = "",
  defaultValues,
  requireContact = false,
}: {
  prefix?: string;
  defaultValues?: {
    name?: string;
    company?: string;
    email?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
  };
  requireContact?: boolean;
}) {
  const [city, setCity] = useState(defaultValues?.city ?? "");
  const [state, setState] = useState(defaultValues?.state ?? "Gujarat");
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  function handlePincodeChange(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();
    setLookupStatus("idle");

    if (!/^\d{6}$/.test(value)) return;

    setLookupStatus("looking");
    debounceRef.current = setTimeout(() => lookupPincode(value), 400);
  }

  async function lookupPincode(pin: string) {
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch(`/api/pincode?pin=${pin}`, { signal: controller.signal });
      const data = (await res.json()) as { city?: string; state?: string };
      if (res.ok) {
        if (data.city) setCity(data.city);
        if (typeof data.state === "string" && INDIA_STATES.includes(data.state)) setState(data.state);
        setLookupStatus("idle");
      } else {
        setLookupStatus("notfound");
      }
    } catch {
      if (!controller.signal.aborted) setLookupStatus("notfound");
    }
  }

  return (
    <div className="space-y-4">
      {requireContact && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Name *">
            <Input
              name={`${prefix}name`}
              defaultValue={defaultValues?.name}
              placeholder="Full name"
              autoComplete="name"
              required
            />
          </Field>
          <Field label="Company *">
            <Input
              name={`${prefix}company`}
              defaultValue={defaultValues?.company}
              placeholder="Company / firm"
              autoComplete="organization"
              required
            />
          </Field>
          <Field label="Email *">
            <Input
              name={`${prefix}email`}
              type="email"
              defaultValue={defaultValues?.email}
              placeholder="you@company.com"
              autoComplete="email"
              required
            />
          </Field>
        </div>
      )}
      <Field label="Address line 1 *">
        <Input
          name={`${prefix}line1`}
          defaultValue={defaultValues?.line1}
          placeholder="House / building / street"
          required
        />
      </Field>
      <Field label="Address line 2 (optional)">
        <Input
          name={`${prefix}line2`}
          defaultValue={defaultValues?.line2}
          placeholder="Landmark, area, etc."
        />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="City *">
          <Input
            name={`${prefix}city`}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ahmedabad"
            required
          />
        </Field>
        <Field label="State *">
          <Select name={`${prefix}state`} value={state} onChange={(e) => setState(e.target.value)}>
            {INDIA_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="PIN code *"
          hint={
            lookupStatus === "looking"
              ? "Looking up…"
              : lookupStatus === "notfound"
                ? "No details found — enter manually"
                : undefined
          }
        >
          <Input
            name={`${prefix}pincode`}
            defaultValue={defaultValues?.pincode}
            placeholder="380061"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            onChange={(e) => handlePincodeChange(e.target.value)}
          />
        </Field>
        <Field label="Delivery phone *">
          <Input
            name={`${prefix}phone`}
            defaultValue={defaultValues?.phone}
            placeholder="+91 98XXXXXX00"
            inputMode="tel"
            pattern="[0-9+\s-]{10,15}"
            required
          />
        </Field>
      </div>
    </div>
  );
}
