import Link from "next/link";
import { Suspense } from "react";
import { ProductCard } from "@/components/ProductCard.tsx";
import { Filters } from "@/components/shop/Filters.tsx";
import { listBrands, listCategories, listHelmets } from "@/lib/db.ts";

type SearchParams = Record<string, string | string[] | undefined>;

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function Results({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const active = {
    category: one(params.category),
    brand: one(params.brand),
    sort: one(params.sort),
  };

  const [helmets, categories, brands] = await Promise.all([
    listHelmets(active),
    listCategories(),
    listBrands(),
  ]);

  return (
    <>
      <p className="mt-2 text-sm text-muted">
        {helmets.length} {helmets.length === 1 ? "helmet" : "helmets"}
      </p>

      <div className="mt-8">
        <Filters categories={categories} brands={brands} active={active} />
      </div>

      {helmets.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-muted">No helmets match those filters.</p>
          <Link
            href="/shop"
            className="mt-4 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink"
          >
            Clear filters
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {helmets.map((helmet) => (
            <ProductCard key={helmet.id} helmet={helmet} />
          ))}
        </div>
      )}
    </>
  );
}

function Skeleton() {
  return (
    <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }, (_, i) => (
        <div
          key={i}
          className="aspect-[3/4] animate-pulse rounded-2xl border border-line bg-surface"
        />
      ))}
    </div>
  );
}

export default function ShopPage({ searchParams }: PageProps<"/shop">) {
  return (
    <div className="mx-auto max-w-7xl px-5 py-12">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Helmets
      </h1>
      <Suspense fallback={<Skeleton />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
