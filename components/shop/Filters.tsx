import Link from "next/link";
import type { ReactNode } from "react";

type Active = { category?: string; brand?: string; sort?: string };

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "newest", label: "Newest" },
];

function href(active: Active, patch: Active): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...active, ...patch })) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `/shop?${query}` : "/shop";
}

function Pill({
  href: to,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={to}
      className={`rounded-full border px-4 py-1.5 text-xs transition-colors ${
        active
          ? "border-accent bg-accent font-semibold text-accent-ink"
          : "border-line text-muted hover:border-foreground hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 w-12 text-[11px] uppercase tracking-wider text-muted">
        {label}
      </span>
      {children}
    </div>
  );
}

export function Filters({
  categories,
  brands,
  active,
}: {
  categories: { slug: string; name: string; count: number }[];
  brands: { name: string; count: number }[];
  active: Active;
}) {
  return (
    <div className="space-y-4 border-b border-line pb-6">
      <Row label="Type">
        <Pill
          href={href(active, { category: undefined })}
          active={!active.category}
        >
          All
        </Pill>
        {categories.map((c) => (
          <Pill
            key={c.slug}
            href={href(active, { category: c.slug })}
            active={active.category === c.slug}
          >
            {c.name} ({c.count})
          </Pill>
        ))}
      </Row>

      <Row label="Brand">
        <Pill href={href(active, { brand: undefined })} active={!active.brand}>
          All
        </Pill>
        {brands.map((b) => (
          <Pill
            key={b.name}
            href={href(active, { brand: b.name })}
            active={active.brand?.toLowerCase() === b.name.toLowerCase()}
          >
            {b.name} ({b.count})
          </Pill>
        ))}
      </Row>

      <Row label="Sort">
        {SORTS.map((s) => (
          <Pill
            key={s.value}
            href={href(active, { sort: s.value })}
            active={(active.sort ?? "featured") === s.value}
          >
            {s.label}
          </Pill>
        ))}
      </Row>
    </div>
  );
}
