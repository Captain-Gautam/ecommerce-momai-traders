import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatINR } from "@/lib/utils";
import { ProductActions } from "@/components/shop/product-actions";
import { ProductCard } from "@/components/shop/product-card";
import { Badge } from "@/components/ui";

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });
  return {
    title: product?.name ?? "Product",
    description: product?.description?.slice(0, 160) ?? undefined,
  };
}

export default async function ProductDetailPage({
  params,
}: PageProps<"/products/[slug]">) {
  const { slug } = await params;

  const [product, settings] = await Promise.all([
    prisma.product.findUnique({
      where: { slug },
      include: { category: { select: { name: true, slug: true } } },
    }),
    getSettings(),
  ]);

  if (!product || !product.isActive) notFound();

  const hasPrice = product.price != null;
  const specs = parseSpecs(product.specifications);
  const whatsappMsg = `Hi Momai Traders, I'm interested in "${product.name}" (${product.unit}). Please share wholesale pricing and availability.`;

  const related = await prisma.product.findMany({
    where: { categoryId: product.categoryId, id: { not: product.id }, isActive: true },
    take: 4,
    include: { category: { select: { name: true, slug: true } } },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-gray-500">
        <Link href="/" className="hover:text-brand-600">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-brand-600">Products</Link>
        <span>/</span>
        <Link href={`/products?category=${product.category.slug}`} className="hover:text-brand-600">
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="truncate text-gray-700">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Images */}
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-gray-200 bg-white">
            {product.images[0] ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain p-4"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-300">No image</div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {product.images.map((img, i) => (
                <div key={i} className="relative size-20 shrink-0 overflow-hidden rounded-lg border border-gray-200">
                  <Image src={img} alt={`${product.name} ${i + 1}`} fill className="object-cover" sizes="80px" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <Link
            href={`/products?category=${product.category.slug}`}
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            {product.category.name}
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">{product.name}</h1>

          <div className="mt-3 flex items-center gap-2">
            {hasPrice ? (
              <>
                <span className="text-3xl font-bold text-gray-900">{formatINR(product.price)}</span>
                <span className="text-sm text-gray-500">/ {product.unit}</span>
                <span className="text-xs font-medium text-emerald-600">incl. GST</span>
              </>
            ) : (
              <Badge color="amber" className="text-sm">
                Price on Enquiry — request a quote
              </Badge>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <Badge color="blue">Min. order: {product.minOrderQty} {product.unit}</Badge>
            {product.hsnCode ? <Badge>HSN: {product.hsnCode}</Badge> : null}
            <Badge>GST: {product.gstRate}%</Badge>
            {product.stock != null && (
              <Badge color={product.stock > 0 ? "green" : "red"}>
                {product.stock > 0 ? `In stock: ${product.stock}` : "Out of stock"}
              </Badge>
            )}
          </div>

          {product.description ? (
            <p className="mt-5 text-gray-600">{product.description}</p>
          ) : null}

          {specs.length > 0 && (
            <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-1.5 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-2">
              {specs.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 text-sm">
                  <dt className="font-medium text-gray-500">{k}</dt>
                  <dd className="text-right font-medium text-gray-900">{v}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="mt-6 max-w-sm">
            <ProductActions
              productId={product.id}
              slug={product.slug}
              hasPrice={hasPrice}
              minOrderQty={product.minOrderQty}
              next={`/products/${product.slug}`}
            />
          </div>

          <div className="mt-4 flex max-w-sm flex-col gap-2 sm:flex-row">
            <a
              href={`mailto:${settings.email}?subject=${encodeURIComponent(`Product Enquiry - ${product.name}`)}&body=${encodeURIComponent(whatsappMsg)}`}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-brand-600 text-sm font-medium text-white hover:bg-brand-700"
            >
              Email Enquiry
            </a>
          </div>

          <div className="mt-6 rounded-xl bg-gray-100 p-4 text-sm text-gray-600">
            <p className="font-semibold text-gray-800">Bulk & wholesale orders welcome</p>
            <p className="mt-1">
              Get the best rates for bulk quantities. Add to cart to place an order, or send an enquiry for a custom
              quote. {settings.businessHours}
            </p>
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-bold text-gray-900">Related Products</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function parseSpecs(specs?: string | null): [string, string][] {
  if (!specs) return [];
  return specs
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(":");
      if (idx === -1) return [line, ""];
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
    });
}
