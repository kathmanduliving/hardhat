import Link from "next/link";
import { Hero3D } from "@/components/hero/Hero3D.tsx";
import { ProductCard } from "@/components/ProductCard.tsx";
import { listBrands, listCategories, listHelmets } from "@/lib/db.ts";

const PROMISES = [
  { title: "Certified only", body: "DOT or ECE 22.06 on every shelf." },
  {
    title: "Fitted in store",
    body: "Head measured, shell matched, no guessing by eye.",
  },
  { title: "Nepal-wide delivery", body: "Valley next day, districts in three." },
];

export default async function Home() {
  const [featured, categories, brands] = await Promise.all([
    listHelmets({ limit: 8 }),
    listCategories(),
    listBrands(),
  ]);

  return (
    <div>
      <section className="relative isolate flex h-[88vh] min-h-[560px] flex-col overflow-hidden border-b border-line">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_38%,rgba(255,90,31,0.22),transparent_62%)]" />
        <div className="absolute inset-0">
          <Hero3D />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background via-background/80 to-transparent" />

        <div className="pointer-events-none relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col justify-end px-5 pb-14">
          <p className="text-[11px] uppercase tracking-[0.35em] text-accent">
            Kathmandu · since 2019
          </p>
          <h1 className="mt-4 max-w-2xl text-5xl font-semibold leading-[1.03] tracking-tight sm:text-7xl">
            Your head is not
            <br />a spare part.
          </h1>
          <p className="mt-5 max-w-md text-muted">
            Certified full face, modular, half face and off-road helmets from
            LS2, AGV, HJC, Axor and Shark.
          </p>
          <div className="pointer-events-auto mt-8 flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="rounded-full bg-accent px-7 py-3.5 text-sm font-semibold uppercase tracking-wider text-accent-ink transition-opacity hover:opacity-90"
            >
              Shop helmets
            </Link>
            <Link
              href="/shop?sort=newest"
              className="rounded-full border border-line px-7 py-3.5 text-sm font-semibold uppercase tracking-wider transition-colors hover:border-foreground"
            >
              New arrivals
            </Link>
          </div>
          <p className="mt-6 text-[11px] uppercase tracking-wider text-muted">
            Drag the helmet to look around
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {brands.map((b) => (
            <Link
              key={b.name}
              href={`/shop?brand=${encodeURIComponent(b.name)}`}
              className="rounded-xl border border-line bg-surface px-4 py-6 text-center transition-colors hover:border-accent hover:text-accent"
            >
              <span className="text-sm font-semibold uppercase tracking-wider">
                {b.name}
              </span>
              <span className="mt-1 block text-[11px] text-muted">
                {b.count} helmets
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Hot items
          </h2>
          <Link
            href="/shop"
            className="text-sm text-muted transition-colors hover:text-accent"
          >
            View all →
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((helmet) => (
            <ProductCard key={helmet.id} helmet={helmet} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Shop by type
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/shop?category=${c.slug}`}
              className="group rounded-2xl border border-line bg-surface p-8 transition-colors hover:border-accent"
            >
              <span className="text-lg font-semibold">{c.name}</span>
              <span className="mt-1 block text-sm text-muted">
                {c.count} helmets
              </span>
              <span className="mt-6 block text-sm text-accent opacity-0 transition-opacity group-hover:opacity-100">
                Browse →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:grid-cols-3">
          {PROMISES.map((p) => (
            <div key={p.title}>
              <p className="font-semibold">{p.title}</p>
              <p className="mt-2 text-sm text-muted">{p.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
