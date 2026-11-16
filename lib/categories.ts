/**
 * Kept apart from `lib/db.ts` so client components can name a category
 * without pulling the catalogue into the browser bundle.
 */
export const CATEGORIES = [
  { slug: "full-face", name: "Full Face" },
  { slug: "modular", name: "Modular" },
  { slug: "half-face", name: "Half Face" },
  { slug: "off-road", name: "Off Road" },
] as const;

export function categoryName(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
}
