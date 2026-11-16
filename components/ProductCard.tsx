import Link from "next/link";
import { categoryName } from "@/lib/categories.ts";
import { npr } from "@/lib/format.ts";
import type { Helmet } from "@/lib/types.ts";
import { ProductImage } from "./ProductImage.tsx";
import { QuickAdd } from "./cart/QuickAdd.tsx";

export function ProductCard({ helmet }: { helmet: Helmet }) {
  const onSale =
    helmet.compare_at_npr !== null && helmet.compare_at_npr > helmet.price_npr;

  return (
    <article className="group flex flex-col rounded-2xl border border-line bg-surface p-3 transition-colors hover:border-accent/60">
      <Link
        href={`/product/${helmet.slug}`}
        className="relative block aspect-square overflow-hidden rounded-xl bg-background"
      >
        <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
          <ProductImage
            src={helmet.images[0]}
            alt={helmet.name}
            seed={`card-${helmet.id}`}
            hex={helmet.colors[0].hex}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          />
        </div>
        {helmet.featured && (
          <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-ink">
            Best seller
          </span>
        )}
        {onSale && (
          <span className="absolute right-3 top-3 rounded-full bg-foreground px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-background">
            Sale
          </span>
        )}
        {helmet.stock === 0 && (
          <span className="absolute inset-x-0 bottom-0 bg-background/85 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-muted">
            Sold out
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col px-1 pb-1 pt-4">
        <p className="text-[11px] uppercase tracking-wider text-muted">
          {helmet.brand} · {categoryName(helmet.category)}
        </p>
        <Link
          href={`/product/${helmet.slug}`}
          className="mt-1.5 text-sm font-medium leading-snug transition-colors hover:text-accent"
        >
          {helmet.name}
        </Link>
        <div className="mt-auto flex items-baseline gap-2 pt-3">
          <span className="font-semibold">{npr(helmet.price_npr)}</span>
          {onSale && helmet.compare_at_npr !== null && (
            <span className="text-xs text-muted line-through">
              {npr(helmet.compare_at_npr)}
            </span>
          )}
        </div>
        <QuickAdd helmet={helmet} />
      </div>
    </article>
  );
}
