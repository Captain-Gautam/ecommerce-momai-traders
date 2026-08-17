import type { Metadata } from "next";
import Link from "next/link";
import { ClientLogo } from "@/components/shop/client-logo";

export const metadata: Metadata = { title: "Our Clients" };

const CLIENTS = [
  { name: "DHL Express", category: "Logistics", image: "/images/clients/dhl-express.png" },
  { name: "Arvind Fashioning Possibilities", category: "Textile", image: "/images/clients/arvind-fashioning-possibilities.png" },
  { name: "Narayani Heights", category: "Hotel & Resort", image: "/images/clients/narayani-heights.png" },
  { name: "Kaka Ni Bhajipav", category: "Restaurant", image: "/images/clients/kaka-ni-bhajipav.png" },
  { name: "Merengo CIMS Hospital", category: "Healthcare", image: "/images/clients/merengo-cims-hospital.png" },
  { name: "Empire Hospital", category: "Healthcare", image: "/images/clients/empire-hospital.png" },
  { name: "Apaxon", category: "Technology", image: "/images/clients/apaxon.png" },
  { name: "Alpha Superspeciality Hospital", category: "Healthcare", image: "/images/clients/alpha-superspeciality-hospital.png" },
  { name: "The Gharana", category: "Restaurant", image: "/images/clients/the-gharana.png" },
  { name: "Parth Hospital", category: "Healthcare", image: "/images/clients/parth-hospital.png" },
  { name: "City Center II Building", category: "Commercial", image: "/images/clients/city-center-2-building.png" },
];

export default function ClientsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900">Join Our Growing Family of Satisfied Clients</h1>
        <p className="mt-3 text-gray-600">
          We are proud to serve some of the most respected organisations across Gujarat. Our commitment to quality and
          reliability has earned us the trust of leading companies in various industries.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {CLIENTS.map((c) => (
          <ClientLogo key={c.name} src={c.image} name={c.name} category={c.category} />
        ))}
      </div>

      <div className="mt-10 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-8 text-center text-white">
        <h2 className="text-xl font-bold sm:text-2xl">Ready to experience the same quality service?</h2>
        <p className="mt-2 text-sm text-brand-100">
          Contact us today to discuss your requirements and get the best wholesale pricing.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link
            href="/contact"
            className="inline-flex h-10 items-center rounded-lg bg-white px-5 text-sm font-semibold text-brand-700 hover:bg-brand-50"
          >
            Contact Us
          </Link>
          <Link
            href="/products"
            className="inline-flex h-10 items-center rounded-lg border border-white/30 px-5 text-sm font-semibold text-white hover:bg-white/10"
          >
            Browse Products
          </Link>
        </div>
      </div>
    </div>
  );
}
