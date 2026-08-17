import Link from "next/link";
import Image from "next/image";
import { ProductActions } from "@/components/shop/product-actions";
import { Badge } from "@/components/ui";
import { formatINR } from "@/lib/utils";

export function ProductCard({
  product,
  showCategory,
}: {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number | null;
    unit: string;
    minOrderQty: number;
    isFeatured?: boolean;
    images: string[];
    category?: { name: string; slug: string };
  };
  showCategory?: boolean;
}) {
  const image = product.images[0];
  const hasPrice = product.price != null;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-shadow hover:shadow-md">
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-gray-100"
      >
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-300">
            <svg className="size-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5M4.5 3h15A1.5 1.5 0 0 1 21 4.5v15a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 19.5v-15A1.5 1.5 0 0 1 4.5 3Z" />
            </svg>
          </div>
        )}
        {product.isFeatured && (
          <Badge color="blue" className="absolute top-2 left-2 shadow-sm">
            Featured
          </Badge>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3">
        {showCategory && product.category ? (
          <Link
            href={`/products?category=${product.category.slug}`}
            className="text-xs font-medium text-brand-600 hover:underline"
          >
            {product.category.name}
          </Link>
        ) : null}
        <Link
          href={`/products/${product.slug}`}
          className="mt-1 line-clamp-2 text-sm font-semibold text-gray-900 hover:text-brand-700"
        >
          {product.name}
        </Link>

        <div className="mt-1 flex items-baseline gap-2">
          {hasPrice ? (
            <>
              <span className="text-base font-bold text-gray-900">{formatINR(product.price)}</span>
              <span className="text-xs text-gray-400">/ {product.unit}</span>
            </>
          ) : (
            <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
              Price on Enquiry
            </span>
          )}
        </div>

        <div className="mt-auto">
          <ProductActions
            productId={product.id}
            slug={product.slug}
            hasPrice={hasPrice}
            minOrderQty={product.minOrderQty}
            next={`/products/${product.slug}`}
            compact
          />
        </div>
      </div>
    </div>
  );
}
