"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "My Orders" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/profile", label: "Profile & Password" },
];

export function AccountNav() {
  const pathname = usePathname();
  const active = (href: string) =>
    href === "/account" ? pathname === "/account" : pathname.startsWith(href);

  return (
    <nav className="mt-4 flex flex-row gap-1 overflow-x-auto rounded-2xl border border-gray-200 bg-white p-2 lg:flex-col lg:overflow-visible">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-brand-50 hover:text-brand-700",
            active(item.href) && "bg-brand-600 text-white hover:bg-brand-600 hover:text-white"
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
