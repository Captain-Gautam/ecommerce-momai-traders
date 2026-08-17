"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/about", label: "About" },
  { href: "/clients", label: "Clients" },
  { href: "/contact", label: "Contact" },
];

export function Header({
  user,
  cartCount,
  settings,
}: {
  user: { name: string; email: string; role: string } | null;
  cartCount: number;
  settings: { storeName: string };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [query, setQuery] = useState("");

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      {/* Main bar */}
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2" onClick={() => setMobileOpen(false)}>
          <span className="flex size-10 items-center justify-center overflow-hidden rounded-lg bg-white">
            <Image
              src="/logo.png"
              alt={settings.storeName}
              width={40}
              height={40}
              className="size-9 object-contain"
            />
          </span>
          <span className="hidden text-lg font-bold text-brand-700 md:block">
            {settings.storeName}
          </span>
        </Link>

        {/* Search */}
        <form
          className="mx-auto hidden max-w-xl flex-1 md:block"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(query.trim() ? `/products?q=${encodeURIComponent(query.trim())}` : "/products");
          }}
        >
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products…"
              className="h-10 w-full rounded-full border border-gray-300 bg-gray-50 pl-4 pr-12 text-sm focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-brand-600/20 focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Search"
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-full bg-brand-600 text-white hover:bg-brand-700"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" />
              </svg>
            </button>
          </div>
        </form>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Link
            href="/cart"
            className="relative flex size-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
            aria-label="Cart"
          >
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-red-600 text-[11px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setAccountOpen((o) => !o)}
                className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100"
                aria-label="Account"
              >
                <span className="text-sm font-bold">{user.name.slice(0, 1).toUpperCase()}</span>
              </button>
              {accountOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setAccountOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                    <div className="border-b border-gray-100 px-4 py-3">
                      <p className="truncate text-sm font-semibold text-gray-900">{user.name}</p>
                      <p className="truncate text-xs text-gray-500">{user.email}</p>
                    </div>
                    <div className="p-1.5">
                      <MenuLink href="/account" onClick={() => setAccountOpen(false)}>My Account</MenuLink>
                      <MenuLink href="/account/orders" onClick={() => setAccountOpen(false)}>My Orders</MenuLink>
                      <MenuLink href="/account/addresses" onClick={() => setAccountOpen(false)}>Addresses</MenuLink>
                      {user.role === "ADMIN" && (
                        <MenuLink href="/admin" onClick={() => setAccountOpen(false)}>Admin Panel</MenuLink>
                      )}
                      <MenuLink href="/logout" onClick={() => setAccountOpen(false)} danger>
                        Sign Out
                      </MenuLink>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden h-10 items-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700 sm:inline-flex"
            >
              Sign In
            </Link>
          )}

          {/* Mobile menu button */}
          <button
            className="flex size-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Menu"
          >
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="hidden border-t border-gray-100 md:block">
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-4">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex h-10 items-center px-3 text-sm font-medium text-gray-600 transition-colors hover:text-brand-700",
                pathname === item.href && "text-brand-700"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white md:hidden">
          <div className="space-y-1 px-4 py-3">
            {!user && (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex h-10 items-center rounded-lg bg-brand-600 px-3 text-sm font-medium text-white"
              >
                Sign In / Create Account
              </Link>
            )}
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex h-11 items-center rounded-lg px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/quote"
              onClick={() => setMobileOpen(false)}
              className="flex h-11 items-center rounded-lg px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Get Quote
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

function MenuLink({
  href,
  children,
  onClick,
  danger,
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex h-10 items-center rounded-lg px-3 text-sm font-medium hover:bg-gray-50",
        danger ? "text-red-600" : "text-gray-700"
      )}
    >
      {children}
    </Link>
  );
}
