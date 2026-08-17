"use client";

import Image from "next/image";
import { useState } from "react";
import { deleteCategory } from "@/actions/admin-actions";
import { CategoryForm } from "@/components/admin/category-form";
import { Button } from "@/components/ui/button";
import { ConfirmForm } from "@/components/ui/confirm-form";
import { Input } from "@/components/ui/input";

type CategoryRow = {
  id: string;
  name: string;
  image: string | null;
  gstRate: number;
  isActive: boolean;
  productCount: number;
};

export function CategoriesManager({ categories }: { categories: CategoryRow[] }) {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingCategory = categories.find((c) => c.id === editingId) ?? null;

  const query = search.trim().toLowerCase();
  const filtered = categories.filter((c) => c.name.toLowerCase().includes(query));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {editingCategory ? "Edit category" : "Add category"}
          </h2>
          {editingCategory && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditingId(null)}>
              Cancel
            </Button>
          )}
        </div>
        <div className="mt-4">
          <CategoryForm
            key={editingCategory?.id ?? "new"}
            defaultValues={
              editingCategory
                ? {
                    id: editingCategory.id,
                    name: editingCategory.name,
                    image: editingCategory.image ?? undefined,
                    gstRate: editingCategory.gstRate,
                    isActive: editingCategory.isActive,
                  }
                : undefined
            }
          />
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-bold text-gray-900">Existing categories</h2>
        <div className="relative mt-4">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" />
            </svg>
          </span>
          <Input
            type="search"
            placeholder="Search categories…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <ul className="mt-3 space-y-3">
          {filtered.map((c) => (
            <li key={c.id} className="rounded-xl border border-gray-100 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-white">
                  {c.image ? (
                    <Image src={c.image} alt={c.name} width={40} height={40} className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-sm font-bold text-brand-200">{c.name.charAt(0)}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-400">
                    {c.productCount} products · GST {c.gstRate}% · {c.isActive ? "Active" : "Hidden"}
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingId(c.id)}>
                  Edit
                </Button>
                <ConfirmForm message={`Delete "${c.name}"?`} action={deleteCategory}>
                  <input type="hidden" name="id" value={c.id} />
                  <Button type="submit" variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50">
                    Delete
                  </Button>
                </ConfirmForm>
              </div>
            </li>
          ))}
          {filtered.length === 0 && (
            <p className="py-6 text-center text-sm text-gray-400">
              {categories.length === 0 ? "No categories yet." : "No categories match your search."}
            </p>
          )}
        </ul>
      </section>
    </div>
  );
}
