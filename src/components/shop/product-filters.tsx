"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/utils";

export function ProductFilters({
  categories,
}: {
  categories: { slug: string; name: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") ?? "";
  const activeSort = searchParams.get("sort") ?? "featured";

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`/products?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => update("category", "")}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
            !activeCategory
              ? "bg-brand-600 text-white"
              : "border border-gray-300 bg-white text-gray-600 hover:border-brand-400"
          )}
        >
          All Products
        </button>
        {categories.map((c) => (
          <button
            key={c.slug}
            onClick={() => update("category", c.slug)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              activeCategory === c.slug
                ? "bg-brand-600 text-white"
                : "border border-gray-300 bg-white text-gray-600 hover:border-brand-400"
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          {activeCategory
            ? categories.find((c) => c.slug === activeCategory)?.name
            : "Showing all products"}
        </p>
        <select
          value={activeSort}
          onChange={(e) => update("sort", e.target.value)}
          className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm text-gray-700 focus:border-brand-600 focus:outline-none"
        >
          <option value="featured">Sort: Featured</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="newest">Newest First</option>
          <option value="name">Name A–Z</option>
        </select>
      </div>
    </div>
  );
}
