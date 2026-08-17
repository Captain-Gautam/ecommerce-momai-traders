import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { Hero } from "@/components/shop/hero";
import { SectionHeading } from "@/components/shop/section-heading";

export default async function HomePage() {
  const [categories, banners] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: { where: { isActive: true } } } } },
    }),
    prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <div>
      <Hero banners={banners} categories={categories} />

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <SectionHeading
          title="Shop by Category"
          subtitle="Everything you need for your office, home and business."
          action={{ href: "/products", label: "View all products" }}
        />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/products?category=${c.slug}`}
              className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                {c.image ? (
                  <Image
                    src={c.image}
                    alt={c.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-300">—</div>
                )}
              </div>
              <div className="p-3">
                <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-brand-700">
                  {c.name}
                </h3>
                <p className="mt-0.5 text-xs text-gray-400">{c._count.products} products</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
          <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-8 text-white sm:p-10">
            <h2 className="text-2xl font-bold sm:text-3xl">From Paper to Polish — Your One Stop Solution</h2>
            <p className="mt-4 text-brand-100">
              At Momai Traders, our goal is to help you create spaces that inspire productivity and comfort. We provide
              essential solutions that transform both your workspace and home into organized, pristine havens.
            </p>
            <p className="mt-3 text-brand-100">
              We are a leading wholesale supplier of cleaning materials and stationery, offering a comprehensive range
              including office supplies, housekeeping materials, washroom solutions and printing services.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/about"
                className="inline-flex h-10 items-center rounded-lg bg-white px-4 text-sm font-semibold text-brand-700 hover:bg-brand-50"
              >
                About Us
              </Link>
              <Link
                href="/quote"
                className="inline-flex h-10 items-center rounded-lg bg-amber-400 px-4 text-sm font-semibold text-brand-950 hover:bg-amber-300"
              >
                Request a Quote
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900">Why choose Momai Traders?</h3>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { title: "High-quality products", desc: "Trusted brands and consistent quality on every order." },
                { title: "Competitive wholesale pricing", desc: "Best rates for bulk and business orders." },
                { title: "Timely delivery", desc: "On-time dispatch across Ahmedabad and Gujarat." },
                { title: "Expert consultation", desc: "Custom solutions for offices, hotels, hospitals & more." },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  </div>
                  <h4 className="mt-2 text-sm font-semibold text-gray-900">{item.title}</h4>
                  <p className="mt-0.5 text-xs text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
