import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { formatINR } from "@/lib/utils";
import { CartItemRow } from "@/components/shop/cart-item-row";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Shopping Cart" };

export default async function CartPage() {
  const session = await getSession();
  const items = session
    ? await prisma.cartItem.findMany({
        where: { userId: session.id },
        include: { product: { select: { slug: true, name: true, images: true, unit: true, price: true, minOrderQty: true } } },
        orderBy: { createdAt: "asc" },
      })
    : [];

  const pricedSubtotal = items.reduce(
    (sum, it) => sum + (it.product.price ?? 0) * it.quantity,
    0
  );
  const hasUnpriced = items.some((it) => it.product.price == null);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
      <p className="mt-1 text-sm text-gray-500">
        Items without a listed price are quoted by our team after you place the order.
      </p>

      {items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Your cart is empty"
            description="Browse our products and add items to start an order."
          >
            <Button asChild size="lg">
              <Link href="/products">Browse Products</Link>
            </Button>
          </EmptyState>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white px-5">
              {items.map((it) => (
                <CartItemRow
                  key={it.id}
                  id={it.id}
                  slug={it.product.slug}
                  name={it.product.name}
                  image={it.product.images[0] ?? null}
                  unit={it.product.unit}
                  quantity={it.quantity}
                  unitPrice={it.product.price}
                  minOrderQty={it.product.minOrderQty}
                />
              ))}
            </ul>
            <div className="mt-4">
              <Link href="/products" className="text-sm font-medium text-brand-600 hover:text-brand-700">
                ← Continue shopping
              </Link>
            </div>
          </div>

          <div className="h-fit space-y-4 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <dt>Items</dt>
                  <dd className="font-medium text-gray-900">{items.reduce((s, it) => s + it.quantity, 0)}</dd>
                </div>
                <div className="flex justify-between text-gray-600">
                  <dt>Listed subtotal</dt>
                  <dd className="font-medium text-gray-900">
                    {hasUnpriced ? "—" : formatINR(pricedSubtotal)}
                  </dd>
                </div>
                {hasUnpriced && (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    Some items need a quote. Your final bill (with GST) is confirmed by our team after you place the
                    order — no advance payment needed yet.
                  </p>
                )}
              </dl>
              <Button asChild className="mt-5 w-full" size="lg">
                <Link href="/checkout">Proceed to Checkout</Link>
              </Button>
              <p className="mt-3 text-center text-xs text-gray-400">
                COD · Bank Transfer · WhatsApp payment available
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
