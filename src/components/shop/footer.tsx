import Link from "next/link";
import Image from "next/image";
import { getSettings } from "@/lib/settings";

export async function Footer() {
  const s = await getSettings();
  return (
    <footer className="mt-auto bg-gray-900 text-gray-300">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-8 px-4 py-8 lg:grid-cols-3">
        <div className="col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center overflow-hidden rounded-lg bg-white">
              <Image
                src="/logo.png"
                alt={s.storeName}
                width={40}
                height={40}
                className="size-9 object-contain"
              />
            </span>
            <span className="text-lg font-bold text-white">{s.storeName}</span>
          </div>
          <p className="mt-3 text-sm text-gray-400">
            {s.tagline} — From Paper to Polish, your one stop solution.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Quick Links</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {[
              { href: "/", label: "Home" },
              { href: "/products", label: "Products" },
              { href: "/quote", label: "Get Quote" },
              { href: "/about", label: "About Us" },
              { href: "/clients", label: "Our Clients" },
              { href: "/contact", label: "Contact" },
            ].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-gray-400 hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Visit Us</h3>
          <p className="mt-3 text-sm text-gray-400">{s.address}</p>
          {s.gstin ? (
            <p className="mt-2 text-sm text-gray-400">GSTIN: {s.gstin}</p>
          ) : null}
        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-gray-500 sm:flex-row">
          <p>© {new Date().getFullYear()} {s.storeName}. All rights reserved.</p>
          <p>Made with ♥ for better business connections</p>
        </div>
      </div>
    </footer>
  );
}
