import type { Metadata } from "next";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/shop/product-card";
import { ProductFilters } from "@/components/shop/product-filters";
import { EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  const { q, category, sort } = await searchParams;

  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { slug: true, name: true },
    }),
    prisma.product.findMany({
      where: {
        isActive: true,
        ...(category ? { category: { slug: String(category) } } : {}),
        ...(q ? { name: { contains: String(q), mode: "insensitive" } } : {}),
      },
      include: { category: { select: { name: true, slug: true } } },
      orderBy: getOrderBy(sort),
    }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {q ? `Results for “${q}”` : "Our Products"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Wholesale pricing on bulk orders. Create an account to place orders and track delivery.
        </p>
      </div>

      <Suspense fallback={null}>
        <ProductFilters categories={categories} />
      </Suspense>

      {products.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No products found"
            description="Try a different search term or category."
          />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} showCategory />
          ))}
        </div>
      )}
    </div>
  );
}

function getOrderBy(sort: string | string[] | undefined) {
  switch (sort) {
    case "price_asc":
      return [{ price: "asc" as const }, { name: "asc" as const }];
    case "price_desc":
      return [{ price: "desc" as const }, { name: "asc" as const }];
    case "newest":
      return [{ createdAt: "desc" as const }];
    case "name":
      return [{ name: "asc" as const }];
    default:
      return [
        { isFeatured: "desc" as const },
        { createdAt: "desc" as const },
      ];
  }
}
