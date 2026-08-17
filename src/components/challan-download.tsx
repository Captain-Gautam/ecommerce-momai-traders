"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function ChallanDownload({
  href,
  label = "Download PDF",
}: {
  href: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <Button variant="outline" className="h-8 px-3 text-xs" onClick={() => setOpen((o) => !o)}>
        {label}
      </Button>
      {open ? (
        <div className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          <a
            href={`${href}?tax=gst`}
            target="_blank"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            With GST &amp; HSN
          </a>
          <a
            href={href}
            target="_blank"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
          >
            Without GST &amp; HSN
          </a>
        </div>
      ) : null}
    </div>
  );
}
