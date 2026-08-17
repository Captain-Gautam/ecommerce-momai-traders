import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/utils";
import { deleteProduct } from "@/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { ConfirmForm } from "@/components/ui/confirm-form";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = { title: "Products" };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;

  const [categories, products] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.product.findMany({
      where: {
        ...(category && category !== "all" ? { categoryId: category } : {}),
        ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
      },
      include: { category: true },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-500">{products.length} products</p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">+ New Product</Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form action="/admin/products" method="get" className="relative min-w-0 flex-1 sm:max-w-sm">
          {category && category !== "all" ? <input type="hidden" name="category" value={category} /> : null}
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" />
            </svg>
          </span>
          <Input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search products…"
            className="pl-9"
          />
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/admin/products${q ? `?q=${encodeURIComponent(q)}` : ""}`}
          className={`rounded-full px-3 py-1.5 text-sm font-medium ${!category || category === "all" ? "bg-brand-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}
        >
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/admin/products?category=${c.id}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${category === c.id ? "bg-brand-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">GST</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-white">
                        {p.images[0] ? (
                          <Image src={p.images[0]} alt={p.name} width={40} height={40} className="h-full w-full object-contain" />
                        ) : (
                          <span className="text-sm font-bold text-brand-200">{p.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.category.name}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {p.price != null ? formatINR(p.price) : (
                      <span className="rounded bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700">Enquiry</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.gstRate}%</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`size-2 rounded-full ${p.isActive ? "bg-emerald-500" : "bg-red-400"}`} />
                      <span className="text-xs text-gray-500">{p.isActive ? "Active" : "Hidden"}</span>
                      {p.isFeatured && <span className="rounded bg-purple-50 px-1.5 py-0.5 text-xs font-medium text-purple-600">Featured</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/products/${p.slug}`} className="text-xs font-medium text-gray-500 hover:text-brand-600">View</Link>
                      <Link href={`/admin/products/${p.id}/edit`} className="text-xs font-medium text-brand-600 hover:underline">Edit</Link>
                      <ConfirmForm message={`Delete "${p.name}"?`} action={deleteProduct}>
                        <input type="hidden" name="id" value={p.id} />
                        <button type="submit" className="text-xs font-medium text-red-500 hover:underline">Delete</button>
                      </ConfirmForm>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">No products found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
