"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateEnquiryStatus } from "@/actions/admin-actions";

export function EnquiryStatusSelect({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <select
      name="status"
      defaultValue={status}
      disabled={pending}
      className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm disabled:opacity-50"
      onChange={(ev) => {
        const fd = new FormData();
        fd.set("id", id);
        fd.set("status", ev.target.value);
        startTransition(async () => {
          await updateEnquiryStatus(fd);
          router.refresh();
        });
      }}
    >
      <option value="NEW">NEW</option>
      <option value="RESPONDED">RESPONDED</option>
      <option value="CLOSED">CLOSED</option>
    </select>
  );
}
