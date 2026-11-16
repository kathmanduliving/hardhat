import type { Helmet } from "./types.ts";
import { helmets } from "./data/helmets.ts";
import { CATEGORIES } from "./categories.ts";

export type ListOptions = {
  category?: string;
  brand?: string;
  sort?: string;
  limit?: number;
};

const byNewest = (a: Helmet, b: Helmet) =>
  b.created_at.localeCompare(a.created_at);

const SORTS: Record<string, (a: Helmet, b: Helmet) => number> = {
  featured: (a, b) => Number(b.featured) - Number(a.featured) || byNewest(a, b),
  "price-asc": (a, b) => a.price_npr - b.price_npr,
  "price-desc": (a, b) => b.price_npr - a.price_npr,
  newest: byNewest,
};

/**
 * Supabase swap point: replace this body with
 * `supabase.from("helmets").select()...`. The signature stays put.
 */
export async function listHelmets(opts: ListOptions = {}): Promise<Helmet[]> {
  const { category, brand, limit } = opts;
  const rows = helmets
    .filter((h) => !category || h.category === category)
    .filter((h) => !brand || h.brand.toLowerCase() === brand.toLowerCase())
    .sort(SORTS[opts.sort ?? ""] ?? SORTS.featured);
  return limit ? rows.slice(0, limit) : rows;
}

export async function getHelmet(slug: string): Promise<Helmet | null> {
  return helmets.find((h) => h.slug === slug) ?? null;
}

export async function listBrands(): Promise<{ name: string; count: number }[]> {
  const counts = new Map<string, number>();
  for (const h of helmets) counts.set(h.brand, (counts.get(h.brand) ?? 0) + 1);
  return [...counts]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function listCategories(): Promise<
  { slug: string; name: string; count: number }[]
> {
  return CATEGORIES.map((c) => ({
    slug: c.slug,
    name: c.name,
    count: helmets.filter((h) => h.category === c.slug).length,
  }));
}
