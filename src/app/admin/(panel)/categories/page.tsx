import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { CategoriesManager } from "@/components/admin/categories-manager";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <p className="mt-1 text-sm text-gray-500">Organise your product catalogue.</p>
      </div>

      <CategoriesManager
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          image: c.image,
          gstRate: c.gstRate,
          isActive: c.isActive,
          productCount: c._count.products,
        }))}
      />
    </div>
  );
}
