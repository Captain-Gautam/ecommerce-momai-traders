import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "New Product" };

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin/products" className="text-sm font-medium text-brand-600 hover:underline">← Back to products</Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">New Product</h1>
      </div>
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <ProductForm categories={categories} />
      </section>
    </div>
  );
}
