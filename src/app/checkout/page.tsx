import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { CheckoutForm } from "@/components/shop/checkout-form";
import { EmptyState } from "@/components/ui";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const session = await getSession();
  if (!session) return null;

  const [items, addresses] = await Promise.all([
    prisma.cartItem.findMany({
      where: { userId: session.id },
      include: { product: { select: { name: true, unit: true, price: true, minOrderQty: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.address.findMany({ where: { userId: session.id }, orderBy: { isDefault: "desc" } }),
  ]);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          title="Your cart is empty"
          description="Add some products before you can check out."
        >
          <Button asChild size="lg">
            <Link href="/products">Browse Products</Link>
          </Button>
        </EmptyState>
      </div>
    );
  }

  const estimatedTotal = items.reduce((s, it) => s + (it.product.price ?? 0) * it.quantity, 0);
  const hasUnpriced = items.some((it) => it.product.price == null);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
      <p className="mt-1 text-sm text-gray-500">
        Place your order — our team confirms the final quoted price on WhatsApp / phone.
      </p>
      <div className="mt-8">
        <CheckoutForm
          addresses={addresses}
          items={items.map((it) => ({
            name: it.product.name,
            quantity: it.quantity,
            unit: it.product.unit,
            unitPrice: it.product.price,
          }))}
          estimatedTotal={estimatedTotal}
          hasUnpriced={hasUnpriced}
        />
      </div>
    </div>
  );
}
