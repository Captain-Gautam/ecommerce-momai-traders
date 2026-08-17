import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "Edit Product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin/products" className="text-sm font-medium text-brand-600 hover:underline">← Back to products</Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Edit Product</h1>
      </div>
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <ProductForm
          categories={categories}
          defaultValues={{
            id: product.id,
            name: product.name,
            categoryId: product.categoryId,
            description: product.description ?? "",
            specifications: product.specifications ?? "",
            unit: product.unit,
            price: product.price != null ? String(product.price) : "",
            gstRate: String(product.gstRate),
            hsnCode: product.hsnCode ?? "",
            minOrderQty: String(product.minOrderQty),
            stock: product.stock != null ? String(product.stock) : "",
            image: product.images[0] ?? "",
            isActive: product.isActive,
            isFeatured: product.isFeatured,
          }}
        />
      </section>
    </div>
  );
}
