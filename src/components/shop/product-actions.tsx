"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addToCart } from "@/actions/cart-actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ProductActions({
  productId,
  slug,
  hasPrice,
  minOrderQty,
  next,
  compact,
}: {
  productId: string;
  slug: string;
  hasPrice: boolean;
  minOrderQty: number;
  next: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(minOrderQty);

  const handleAdd = (quantity: number) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("productId", productId);
      fd.set("quantity", String(quantity));
      fd.set("next", next);
      const res = await addToCart(fd);
      if (res?.added) {
        setAdded(true);
        router.refresh();
        setTimeout(() => setAdded(false), 1800);
      }
    });
  };

  if (!hasPrice) {
    return (
      <div className="mt-3">
        <Link href={`/quote?product=${slug}`} className="block">
          <Button variant="outline" className="w-full" size={compact ? "sm" : "md"}>
            Get Quote
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={cn("mt-3 space-y-2", compact && "mt-2 space-y-1.5")}>
      <div className="flex items-center gap-2">
        <div className="flex h-9 items-center rounded-lg border border-gray-300">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(minOrderQty, q - 1))}
            className="flex h-full w-8 items-center justify-center text-gray-500 hover:text-gray-900"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-8 text-center text-sm font-semibold tabular-nums">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            className="flex h-full w-8 items-center justify-center text-gray-500 hover:text-gray-900"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        {!compact && (
          <p className="text-xs text-gray-400">Min. order {minOrderQty}</p>
        )}
      </div>
      <Button
        onClick={() => handleAdd(qty)}
        disabled={pending}
        size={compact ? "sm" : "md"}
        className={cn("w-full", added && "bg-emerald-600 hover:bg-emerald-700")}
      >
        {added ? "Added ✓" : pending ? "Adding…" : "Add to Cart"}
      </Button>
    </div>
  );
}
