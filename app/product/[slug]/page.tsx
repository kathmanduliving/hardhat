import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/cart/AddToCart.tsx";
import { ProductCard } from "@/components/ProductCard.tsx";
import { ProductImage } from "@/components/ProductImage.tsx";
import { CATEGORIES } from "@/lib/categories.ts";
import { getHelmet, listHelmets } from "@/lib/db.ts";
import { npr } from "@/lib/format.ts";

export async function generateStaticParams() {
  const helmets = await listHelmets();
  return helmets.map((h) => ({ slug: h.slug }));
}

export default async function ProductPage({
  params,
}: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const helmet = await getHelmet(slug);
  if (!helmet) notFound();

  const category = CATEGORIES.find((c) => c.slug === helmet.category);
  const onSale =
    helmet.compare_at_npr !== null && helmet.compare_at_npr > helmet.price_npr;
  const related = (await listHelmets({ category: helmet.category, limit: 5 }))
    .filter((h) => h.id !== helmet.id)
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-5 py-10">
      <nav className="text-xs text-muted">
        <Link href="/shop" className="transition-colors hover:text-foreground">
          Helmets
        </Link>
        {category && (
          <>
            {" / "}
            <Link
              href={`/shop?category=${category.slug}`}
              className="transition-colors hover:text-foreground"
            >
              {category.name}
            </Link>
          </>
        )}
        {" / "}
        <span className="text-foreground">{helmet.brand}</span>
      </nav>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-surface">
            <ProductImage
              src={helmet.images[0]}
              alt={helmet.name}
              seed={`hero-${helmet.id}`}
              hex={helmet.colors[0].hex}
              sizes="(min-width: 1024px) 50vw, 100vw"
              priority
              artClassName="p-[14%]"
            />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {helmet.colors.map((c) => (
              <div
                key={c.name}
                title={c.name}
                className="relative aspect-square overflow-hidden rounded-xl border border-line bg-background"
              >
                <ProductImage
                  src={helmet.images[1]}
                  alt={`${helmet.name} in ${c.name}`}
                  seed={`thumb-${helmet.id}-${c.name}`}
                  hex={c.hex}
                  sizes="25vw"
                  artClassName="p-[10%]"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-accent">
            {helmet.brand}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            {helmet.name}
          </h1>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl font-semibold">
              {npr(helmet.price_npr)}
            </span>
            {onSale && helmet.compare_at_npr !== null && (
              <span className="text-muted line-through">
                {npr(helmet.compare_at_npr)}
              </span>
            )}
          </div>
          <p className="mt-5 leading-relaxed text-muted">{helmet.description}</p>

          <AddToCart helmet={helmet} />

          <dl className="mt-10 divide-y divide-line border-t border-line text-sm">
            {Object.entries(helmet.specs).map(([key, value]) => (
              <div key={key} className="flex justify-between gap-6 py-3">
                <dt className="text-muted">{key}</dt>
                <dd className="text-right">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="text-xl font-semibold tracking-tight">
            More {category?.name.toLowerCase() ?? "helmets"}
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((h) => (
              <ProductCard key={h.id} helmet={h} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
