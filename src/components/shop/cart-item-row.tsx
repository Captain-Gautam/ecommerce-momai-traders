"use client";

import { useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { removeCartItem, updateCartItem } from "@/actions/cart-actions";
import { formatINR } from "@/lib/utils";

export function CartItemRow({
  id,
  slug,
  name,
  image,
  unit,
  quantity,
  unitPrice,
  minOrderQty,
}: {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  unit: string;
  quantity: number;
  unitPrice: number | null;
  minOrderQty: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const setQty = (qty: number) => {
    const next = Math.max(minOrderQty, qty);
    if (next === quantity) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", id);
      fd.set("quantity", String(next));
      await updateCartItem(fd);
      router.refresh();
    });
  };

  const remove = () => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", id);
      await removeCartItem(fd);
      router.refresh();
    });
  };

  return (
    <li className="flex flex-col gap-4 border-b border-gray-100 py-4 last:border-b-0 sm:flex-row sm:items-center">
      <Link
        href={`/products/${slug}`}
        className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white"
      >
        {image ? (
          <Image src={image} alt={name} width={80} height={80} className="h-full w-full object-contain" />
        ) : (
          <span className="text-2xl font-bold text-brand-200">{name.charAt(0)}</span>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <Link href={`/products/${slug}`} className="line-clamp-2 font-semibold text-gray-900 hover:text-brand-600">
          {name}
        </Link>
        <p className="mt-0.5 text-xs text-gray-400">
          Per {unit} · Min. {minOrderQty} {unit}
        </p>
        {unitPrice != null ? (
          <p className="mt-1 font-semibold text-gray-900">{formatINR(unitPrice * quantity)}</p>
        ) : (
          <p className="mt-1 inline-block rounded bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700">
            Price confirmed after order
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <div className="flex h-9 items-center rounded-lg border border-gray-300">
          <button
            type="button"
            onClick={() => setQty(quantity - 1)}
            disabled={pending || quantity <= minOrderQty}
            className="flex h-full w-8 items-center justify-center text-gray-500 hover:text-gray-900 disabled:opacity-30"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-9 text-center text-sm font-semibold tabular-nums">{quantity}</span>
          <button
            type="button"
            onClick={() => setQty(quantity + 1)}
            disabled={pending}
            className="flex h-full w-8 items-center justify-center text-gray-500 hover:text-gray-900 disabled:opacity-30"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="text-sm font-medium text-red-500 hover:text-red-700 disabled:opacity-40"
        >
          Remove
        </button>
      </div>
    </li>
  );
}
