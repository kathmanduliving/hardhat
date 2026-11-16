export type HelmetColor = { name: string; hex: string };

/** Mirrors the future Supabase `helmets` table one-to-one. */
export type Helmet = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  /** full-face | modular | half-face | off-road */
  category: string;
  price_npr: number;
  /** Original price when discounted, else null. */
  compare_at_npr: number | null;
  /** Product photography. Empty today: components fall back to vector art. */
  images: string[];
  sizes: string[];
  colors: HelmetColor[];
  stock: number;
  description: string;
  specs: Record<string, string>;
  featured: boolean;
  created_at: string;
};

export type CartItem = {
  helmetId: string;
  slug: string;
  name: string;
  /** Photo URL, or "" when the product falls back to vector art. */
  image: string;
  /** Tint for the vector fallback. */
  colorHex: string;
  price_npr: number;
  size: string;
  color: string;
  qty: number;
};
