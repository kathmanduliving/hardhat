# Helmet Store v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a helmet e-commerce front end — a 3D-helmet homepage, a filterable shop grid, product detail pages and a local cart — backed by dummy data behind an async data layer that Supabase can replace without touching a component.

**Architecture:** Next 16 App Router. Server components read `lib/db.ts`, the single data-access module; every signature is async and Supabase-shaped. The cart is the only client state (React context + `localStorage`). The 3D hero is an isolated client component, dynamically imported with `ssr: false`, with a static poster fallback whenever WebGL is unwanted or unavailable.

**Tech Stack:** Next 16.4.6, React 19.3, TypeScript 5, Tailwind 4 (`@tailwindcss/turbopack`), `three` + `@react-three/fiber` + `@react-three/drei`. Tests: `node --test` (Node 24 native TypeScript stripping). No other dependencies.

## As built — deviations from this plan

Two things changed during execution. The spec
(`docs/superpowers/specs/2026-11-16-helmet-store-design.md`) is up to date;
this plan is kept as written for the record.

1. **No product photography and no hero poster image.** The Khronos poster is
   a 130 px thumbnail, and freely licensed helmet stock is crash-damage and
   rider photography, not product shots. Instead `components/HelmetArt.tsx`
   draws a vector helmet tinted with the product's colour, and
   `components/ProductImage.tsx` picks a photo when `images[0]` exists and the
   vector art when it does not. So every catalogue row ships `images: []`,
   `next.config.ts` needs no `images.remotePatterns` yet, and the hero's
   fallback is `HelmetArt`, not a `<Image>`. Task 1 step 4, task 1 step 5's
   poster download, task 2 step 3's Unsplash URLs and task 7's `Poster()` are
   superseded.
2. **`CartItem` gained `colorHex`**, so the drawer can tint the vector art for
   the colour that was actually chosen.
3. The hero's environment map is built from drei `Lightformer`s instead of
   `<Environment preset="city" />`, which would fetch an HDRI from a CDN at
   runtime.
4. `npm test` runs `node --test lib/lib.test.ts`; passing the directory makes
   Node resolve `lib` as a module and fail.

## Global Constraints

- Node is v24.12.0. `node --test` strips TypeScript natively: use **erasable syntax only** in `lib/` — no `enum`, no `namespace`, no constructor parameter properties. Types are imported with `import type`.
- Every intra-project import carries an explicit `.ts`/`.tsx` extension (`./data/helmets.ts`, `@/lib/db.ts`). Node's ESM resolver requires it; Turbopack accepts it. `allowImportingTsExtensions: true` is added to `tsconfig.json` in Task 1.
- Currency is NPR, formatted by `lib/format.ts` only: `NPR 6,399` — `en-IN` grouping (Nepali/Indian convention), zero decimals. Never hand-format a price.
- No new dependencies beyond `three`, `@react-three/fiber`, `@react-three/drei`.
- Out of scope for v1: auth, checkout, payments, search, reviews, admin, i18n, orders. Do not build them.
- `lib/db.ts` is the only file that may read `lib/data/helmets.ts`. Components never import the dummy array.
- Commit after every task.

---

## File Structure

| File | Responsibility |
|---|---|
| `lib/types.ts` | `Helmet`, `HelmetColor`, `CartItem` — shaped to the future Postgres table |
| `lib/data/helmets.ts` | 16 dummy helmet rows. Replaced by Supabase, read only by `lib/db.ts` |
| `lib/db.ts` | Async data access: `listHelmets`, `getHelmet`, `listBrands`, `listCategories`. The one Supabase swap point |
| `lib/cart.ts` | Pure cart maths: key, add, set qty, subtotal, count, safe parse |
| `lib/format.ts` | `npr(amount)` |
| `lib/lib.test.ts` | `node --test` coverage of db filter/sort and cart maths |
| `components/nav/Header.tsx` | Sticky header, nav links, cart button |
| `components/nav/Footer.tsx` | Footer |
| `components/cart/CartProvider.tsx` | Client context + `localStorage` persistence + drawer open state |
| `components/cart/CartDrawer.tsx` | Slide-over cart UI |
| `components/cart/AddToCart.tsx` | Size/colour pickers + add button (product detail) |
| `components/cart/QuickAdd.tsx` | One-click add from a card (first size/colour) |
| `components/ProductCard.tsx` | Grid card: image, tags, name, price, sale/best-seller badges |
| `components/shop/Filters.tsx` | Category/brand/sort links driven by `searchParams` |
| `components/hero/Hero3D.tsx` | Canvas wrapper, poster fallback, capability check, error boundary |
| `components/hero/HelmetModel.tsx` | GLB load, auto-rotate, lighting |
| `app/page.tsx` | Home: hero, brands, hot items, categories, trust strip |
| `app/shop/page.tsx` | Filtered grid |
| `app/product/[slug]/page.tsx` | Product detail |
| `app/layout.tsx` | Shell: fonts, header, `CartProvider`, drawer, footer |
| `app/globals.css` | Tailwind 4 `@theme` tokens, dark base |
| `public/models/helmet.glb` | Hero model |
| `public/models/helmet-poster.jpg` | Hero fallback image |
| `NOTICE.md` | Third-party asset attribution |

---

### Task 1: Foundation — deps, config, theme, hero asset

**Files:**
- Modify: `package.json` (deps + `test` script)
- Modify: `tsconfig.json` (`allowImportingTsExtensions`)
- Modify: `next.config.ts` (`images.remotePatterns`)
- Modify: `app/globals.css` (design tokens)
- Modify: `app/layout.tsx` (metadata)
- Create: `public/models/helmet.glb`, `public/models/helmet-poster.jpg`, `NOTICE.md`

**Interfaces:**
- Consumes: nothing.
- Produces: Tailwind colour utilities `bg-surface`, `border-line`, `text-muted`, `bg-accent`, `text-accent`, `text-accent-ink`; public paths `/models/helmet.glb` and `/models/helmet-poster.jpg`.

- [ ] **Step 1: Install the 3D dependencies**

```bash
npm install three @react-three/fiber @react-three/drei
npm install -D @types/three
```

- [ ] **Step 2: Add the test script**

```bash
npm pkg set scripts.test="node --test lib/"
```

- [ ] **Step 3: Allow `.ts` import extensions**

In `tsconfig.json`, inside `compilerOptions`, add after `"resolveJsonModule": true,`:

```json
    "allowImportingTsExtensions": true,
```

- [ ] **Step 4: Allow remote product images**

In `next.config.ts`, add this key to the `nextConfig` object, keeping every existing key:

```ts
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
```

- [ ] **Step 5: Download the hero model and poster**

```bash
mkdir -p public/models
curl -sL -o public/models/helmet.glb https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/DamagedHelmet/glTF-Binary/DamagedHelmet.glb
curl -sL -o public/models/helmet-poster.jpg https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/DamagedHelmet/screenshot/screenshot.jpg
ls -l public/models
```

Expected: `helmet.glb` roughly 3.7 MB, `helmet-poster.jpg` non-empty. A few hundred bytes means the download failed — stop and re-run.

- [ ] **Step 6: Write the attribution file**

Create `NOTICE.md`:

```markdown
# Third-party assets

## public/models/helmet.glb, public/models/helmet-poster.jpg

"Battle Damaged Sci-fi Helmet - PBR" by theblueturtle_, distributed in the
Khronos glTF-Sample-Assets repository as `DamagedHelmet`.
Licence: Creative Commons Attribution-NonCommercial 4.0 International
(CC BY-NC 4.0) — https://creativecommons.org/licenses/by-nc/4.0/

**Development placeholder only.** The licence forbids commercial use, so this
model must be replaced with a licensed motorcycle-helmet GLB before the store
goes live. Drop the replacement at `public/models/helmet.glb` and overwrite
`helmet-poster.jpg` with a render of it; no code changes are needed.

## Product photography

Product images are remote Unsplash URLs used as dummy data, placeholders for
real product photography. They are replaced together with the dummy catalogue
when Supabase lands.
```

- [ ] **Step 7: Write the design tokens**

Replace the whole of `app/globals.css`:

```css
@import "tailwindcss";

:root {
  --background: #09090b;
  --foreground: #fafafa;
  --surface: #121214;
  --line: #27272a;
  --muted: #a1a1aa;
  --accent: #ff5a1f;
  --accent-ink: #0a0a0a;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-surface: var(--surface);
  --color-line: var(--line);
  --color-muted: var(--muted);
  --color-accent: var(--accent);
  --color-accent-ink: var(--accent-ink);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

html {
  scroll-behavior: smooth;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-geist-sans), system-ui, sans-serif;
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 8: Update the document metadata**

In `app/layout.tsx`, replace the `metadata` export:

```tsx
export const metadata: Metadata = {
  title: "Hard Hat Trading — Motorcycle Helmets in Nepal",
  description:
    "Full face, modular, half face and off-road helmets from LS2, AGV, HJC, Axor and Shark. Delivered across Nepal.",
};
```

- [ ] **Step 9: Verify the app still builds**

Run: `npm run build`
Expected: build succeeds. The default template page still renders; Task 7 replaces it.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "chore: add 3D deps, theme tokens, hero asset"
```

---

### Task 2: Data layer — types, dummy catalogue, `lib/db.ts`

**Files:**
- Create: `lib/types.ts`, `lib/format.ts`, `lib/data/helmets.ts`, `lib/db.ts`
- Create: `lib/lib.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `type Helmet` with fields `id, slug, name, brand, category, price_npr, compare_at_npr, images, sizes, colors, stock, description, specs, featured, created_at`
  - `type HelmetColor = { name: string; hex: string }`
  - `npr(amount: number): string`
  - `listHelmets(opts?: ListOptions): Promise<Helmet[]>` where `ListOptions = { category?: string; brand?: string; sort?: string; limit?: number }`
  - `getHelmet(slug: string): Promise<Helmet | null>`
  - `listBrands(): Promise<{ name: string; count: number }[]>`
  - `listCategories(): Promise<{ slug: string; name: string; count: number }[]>`

- [ ] **Step 1: Write the types**

Create `lib/types.ts`:

```ts
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
  image: string;
  price_npr: number;
  size: string;
  color: string;
  qty: number;
};
```

- [ ] **Step 2: Write the price formatter**

Create `lib/format.ts`:

```ts
const grouping = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

/** The only place a price becomes a string. */
export function npr(amount: number): string {
  return `NPR ${grouping.format(amount)}`;
}
```

- [ ] **Step 3: Write the dummy catalogue**

Create `lib/data/helmets.ts` with 16 rows. Use this exact shape; the first row is the template, and the full list follows. Categories are `full-face`, `modular`, `half-face`, `off-road`. Brands are `LS2`, `AGV`, `HJC`, `Axor`, `Shark`. Use Unsplash photo URLs of the form `https://images.unsplash.com/photo-<id>?auto=format&fit=crop&w=900&q=80`, two per helmet. Mark four rows `featured: true`. Give four rows a non-null `compare_at_npr` above `price_npr`. Give one row `stock: 0`.

```ts
import type { Helmet } from "../types.ts";

export const helmets: Helmet[] = [
  {
    id: "hlm-001",
    slug: "ls2-rookie-gloss-white",
    name: "LS2 Rookie Gloss White Full Face Helmet",
    brand: "LS2",
    category: "full-face",
    price_npr: 6399,
    compare_at_npr: 7499,
    images: [
      "https://images.unsplash.com/photo-1591370874773-6702e8f12fd8?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1558980664-10e7170b5df9?auto=format&fit=crop&w=900&q=80",
    ],
    sizes: ["M", "L", "XL"],
    colors: [
      { name: "Gloss White", hex: "#f4f4f5" },
      { name: "Matte Black", hex: "#1c1c1e" },
    ],
    stock: 12,
    description:
      "The Rookie is LS2's everyday full face: a light polycarbonate shell, a scratch-resistant visor and enough vents to survive a Kathmandu afternoon.",
    specs: {
      Shell: "HPTT polycarbonate",
      Certification: "DOT / ECE 22.06",
      Weight: "1,450 g",
      Visor: "Clear, anti-scratch",
      Liner: "Removable, washable",
    },
    featured: true,
    created_at: "2026-02-11",
  },
  // ...15 more rows following the same shape
];
```

The remaining 15 rows, written out in full, are in the implementation. Keep names realistic (e.g. `AGV K1 S Grey Full Face Helmet`, `HJC i71 Modular Helmet`, `Axor Retro Jet Sportz Half Face Helmet`, `Shark Varial Off Road Helmet`), prices between `NPR 4,500` and `NPR 54,000`, and `created_at` dates spread across 2025–2026 so the `newest` sort is meaningful.

- [ ] **Step 4: Write the failing tests**

Create `lib/lib.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { listHelmets, getHelmet, listBrands, listCategories } from "./db.ts";
import { npr } from "./format.ts";

test("listHelmets returns the whole catalogue by default", async () => {
  const all = await listHelmets();
  assert.ok(all.length >= 16);
});

test("listHelmets filters by category", async () => {
  const rows = await listHelmets({ category: "modular" });
  assert.ok(rows.length > 0);
  assert.ok(rows.every((h) => h.category === "modular"));
});

test("listHelmets filters by brand case-insensitively", async () => {
  const rows = await listHelmets({ brand: "ls2" });
  assert.ok(rows.length > 0);
  assert.ok(rows.every((h) => h.brand === "LS2"));
});

test("listHelmets sorts by price ascending and descending", async () => {
  const asc = await listHelmets({ sort: "price-asc" });
  const desc = await listHelmets({ sort: "price-desc" });
  assert.deepEqual(
    asc.map((h) => h.price_npr),
    [...asc.map((h) => h.price_npr)].sort((a, b) => a - b),
  );
  assert.equal(desc[0].price_npr, asc[asc.length - 1].price_npr);
});

test("listHelmets puts featured first by default", async () => {
  const rows = await listHelmets();
  assert.equal(rows[0].featured, true);
});

test("listHelmets ignores an unknown sort instead of throwing", async () => {
  const rows = await listHelmets({ sort: "nonsense" });
  assert.equal(rows[0].featured, true);
});

test("listHelmets honours limit", async () => {
  const rows = await listHelmets({ limit: 4 });
  assert.equal(rows.length, 4);
});

test("listHelmets does not mutate the backing array", async () => {
  const first = (await listHelmets({ sort: "price-asc" }))[0].id;
  await listHelmets({ sort: "price-desc" });
  const again = (await listHelmets({ sort: "price-asc" }))[0].id;
  assert.equal(first, again);
});

test("getHelmet finds a slug and returns null for an unknown one", async () => {
  const all = await listHelmets();
  const hit = await getHelmet(all[0].slug);
  assert.equal(hit?.slug, all[0].slug);
  assert.equal(await getHelmet("no-such-helmet"), null);
});

test("listBrands and listCategories count their rows", async () => {
  const brands = await listBrands();
  const cats = await listCategories();
  const all = await listHelmets();
  assert.equal(
    brands.reduce((n, b) => n + b.count, 0),
    all.length,
  );
  assert.equal(
    cats.reduce((n, c) => n + c.count, 0),
    all.length,
  );
  assert.ok(cats.every((c) => c.name && c.slug));
});

test("npr formats with thousands separators and no decimals", () => {
  assert.equal(npr(6399), "NPR 6,399");
  assert.equal(npr(0), "NPR 0");
});
```

- [ ] **Step 5: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module` for `./db.ts`.

- [ ] **Step 6: Write the data layer**

Create `lib/db.ts`:

```ts
import type { Helmet } from "./types.ts";
import { helmets } from "./data/helmets.ts";

export type ListOptions = {
  category?: string;
  brand?: string;
  sort?: string;
  limit?: number;
};

export const CATEGORIES = [
  { slug: "full-face", name: "Full Face" },
  { slug: "modular", name: "Modular" },
  { slug: "half-face", name: "Half Face" },
  { slug: "off-road", name: "Off Road" },
] as const;

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
 * `supabase.from("helmets").select()...`. The signature stays.
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
```

Note: `.filter()` already returns a fresh array, so the `.sort()` cannot mutate `helmets` — the non-mutation test covers this.

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS, 11 tests.

- [ ] **Step 8: Commit**

```bash
git add lib package.json
git commit -m "feat: supabase-shaped data layer with dummy helmet catalogue"
```

---

### Task 3: Cart logic and provider

**Files:**
- Create: `lib/cart.ts`, `components/cart/CartProvider.tsx`, `components/cart/CartDrawer.tsx`
- Modify: `lib/lib.test.ts` (append cart tests)

**Interfaces:**
- Consumes: `CartItem` from `lib/types.ts`; `npr` from `lib/format.ts`.
- Produces:
  - `itemKey(i: Pick<CartItem, "helmetId" | "size" | "color">): string`
  - `addItem(items: CartItem[], item: CartItem): CartItem[]`
  - `setQty(items: CartItem[], key: string, qty: number): CartItem[]`
  - `subtotal(items: CartItem[]): number`
  - `count(items: CartItem[]): number`
  - `parseCart(raw: string | null): CartItem[]`
  - `useCart()` returning `{ items, add, setQty, clear, subtotal, count, open, setOpen }`

- [ ] **Step 1: Append the failing cart tests to `lib/lib.test.ts`**

```ts
import {
  addItem,
  count,
  itemKey,
  parseCart,
  setQty,
  subtotal,
} from "./cart.ts";
import type { CartItem } from "./types.ts";

const line = (over: Partial<CartItem> = {}): CartItem => ({
  helmetId: "hlm-001",
  slug: "ls2-rookie-gloss-white",
  name: "LS2 Rookie",
  image: "https://example.test/a.jpg",
  price_npr: 6399,
  size: "L",
  color: "Gloss White",
  qty: 1,
  ...over,
});

test("addItem merges the same helmet, size and colour", () => {
  const items = addItem(addItem([], line()), line());
  assert.equal(items.length, 1);
  assert.equal(items[0].qty, 2);
});

test("addItem keeps a different size or colour as its own line", () => {
  let items = addItem([], line());
  items = addItem(items, line({ size: "XL" }));
  items = addItem(items, line({ color: "Matte Black" }));
  assert.equal(items.length, 3);
});

test("setQty updates a line and removes it at zero or below", () => {
  const items = addItem([], line());
  const key = itemKey(items[0]);
  assert.equal(setQty(items, key, 3)[0].qty, 3);
  assert.equal(setQty(items, key, 0).length, 0);
  assert.equal(setQty(items, key, -2).length, 0);
});

test("subtotal and count sum across lines", () => {
  let items = addItem([], line({ qty: 2 }));
  items = addItem(items, line({ size: "XL", price_npr: 1000, qty: 3 }));
  assert.equal(subtotal(items), 6399 * 2 + 3000);
  assert.equal(count(items), 5);
});

test("parseCart survives null, junk and wrong shapes", () => {
  assert.deepEqual(parseCart(null), []);
  assert.deepEqual(parseCart("not json"), []);
  assert.deepEqual(parseCart('{"a":1}'), []);
  assert.deepEqual(parseCart('[{"helmetId":"x"}]'), []);
  assert.equal(parseCart(JSON.stringify([line()])).length, 1);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module` for `./cart.ts`.

- [ ] **Step 3: Write the cart maths**

Create `lib/cart.ts`:

```ts
import type { CartItem } from "./types.ts";

export const CART_STORAGE_KEY = "hht.cart.v1";

export function itemKey(
  i: Pick<CartItem, "helmetId" | "size" | "color">,
): string {
  return `${i.helmetId}|${i.size}|${i.color}`;
}

export function addItem(items: CartItem[], item: CartItem): CartItem[] {
  const key = itemKey(item);
  const existing = items.find((i) => itemKey(i) === key);
  if (!existing) return [...items, item];
  return items.map((i) =>
    itemKey(i) === key ? { ...i, qty: i.qty + item.qty } : i,
  );
}

export function setQty(
  items: CartItem[],
  key: string,
  qty: number,
): CartItem[] {
  if (qty <= 0) return items.filter((i) => itemKey(i) !== key);
  return items.map((i) => (itemKey(i) === key ? { ...i, qty } : i));
}

export function subtotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.price_npr * i.qty, 0);
}

export function count(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.qty, 0);
}

function isCartItem(value: unknown): value is CartItem {
  const i = value as Partial<CartItem> | null;
  return (
    !!i &&
    typeof i.helmetId === "string" &&
    typeof i.slug === "string" &&
    typeof i.name === "string" &&
    typeof i.image === "string" &&
    typeof i.price_npr === "number" &&
    typeof i.size === "string" &&
    typeof i.color === "string" &&
    typeof i.qty === "number" &&
    i.qty > 0
  );
}

/** Never throws: bad storage means an empty cart, not a crash. */
export function parseCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCartItem);
  } catch {
    return [];
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS, 16 tests.

- [ ] **Step 5: Write the provider**

Create `components/cart/CartProvider.tsx`:

```tsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { CartItem } from "@/lib/types.ts";
import {
  CART_STORAGE_KEY,
  addItem,
  count,
  parseCart,
  setQty as setQtyIn,
  subtotal,
} from "@/lib/cart.ts";

type CartValue = {
  items: CartItem[];
  add: (item: CartItem) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
  subtotal: number;
  count: number;
  open: boolean;
  setOpen: (open: boolean) => void;
};

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Read after mount so server and first client render match.
  useEffect(() => {
    try {
      setItems(parseCart(window.localStorage.getItem(CART_STORAGE_KEY)));
    } catch {
      // Private mode or blocked storage: start empty.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage full or blocked: the cart still works for this session.
    }
  }, [items, hydrated]);

  const add = useCallback((item: CartItem) => {
    setItems((current) => addItem(current, item));
    setOpen(true);
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setItems((current) => setQtyIn(current, key, qty));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      add,
      setQty,
      clear,
      subtotal: subtotal(items),
      count: count(items),
      open,
      setOpen,
    }),
    [items, add, setQty, clear, open],
  );

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart(): CartValue {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside <CartProvider>");
  return value;
}
```

- [ ] **Step 6: Write the drawer**

Create `components/cart/CartDrawer.tsx`:

```tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { itemKey } from "@/lib/cart.ts";
import { npr } from "@/lib/format.ts";
import { useCart } from "./CartProvider.tsx";

export function CartDrawer() {
  const { items, setQty, subtotal, open, setOpen } = useCart();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  return (
    <div
      className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close cart"
        onClick={() => setOpen(false)}
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        tabIndex={open ? 0 : -1}
      />
      <aside
        role="dialog"
        aria-label="Shopping cart"
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-line bg-surface transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="text-lg font-semibold tracking-tight">Your cart</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-muted transition-colors hover:text-foreground"
            tabIndex={open ? 0 : -1}
          >
            Close
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-muted">Nothing in here yet.</p>
            <Link
              href="/shop"
              onClick={() => setOpen(false)}
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink"
              tabIndex={open ? 0 : -1}
            >
              Browse helmets
            </Link>
          </div>
        ) : (
          <ul className="flex-1 divide-y divide-line overflow-y-auto">
            {items.map((item) => {
              const key = itemKey(item);
              return (
                <li key={key} className="flex gap-4 p-6">
                  <Image
                    src={item.image}
                    alt=""
                    width={80}
                    height={80}
                    className="h-20 w-20 flex-none rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <Link
                      href={`/product/${item.slug}`}
                      onClick={() => setOpen(false)}
                      className="text-sm font-medium leading-snug hover:text-accent"
                      tabIndex={open ? 0 : -1}
                    >
                      {item.name}
                    </Link>
                    <p className="mt-1 text-xs text-muted">
                      {item.size} · {item.color}
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex items-center rounded-full border border-line">
                        <button
                          type="button"
                          aria-label={`Decrease quantity of ${item.name}`}
                          onClick={() => setQty(key, item.qty - 1)}
                          className="px-3 py-1 text-muted hover:text-foreground"
                          tabIndex={open ? 0 : -1}
                        >
                          −
                        </button>
                        <span className="min-w-6 text-center text-sm">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase quantity of ${item.name}`}
                          onClick={() => setQty(key, item.qty + 1)}
                          className="px-3 py-1 text-muted hover:text-foreground"
                          tabIndex={open ? 0 : -1}
                        >
                          +
                        </button>
                      </div>
                      <span className="ml-auto text-sm font-semibold">
                        {npr(item.price_npr * item.qty)}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <footer className="border-t border-line p-6">
          <div className="flex items-baseline justify-between">
            <span className="text-muted">Subtotal</span>
            <span className="text-xl font-semibold">{npr(subtotal)}</span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Shipping calculated at checkout.
          </p>
          <button
            type="button"
            disabled
            className="mt-5 w-full rounded-full bg-line px-6 py-3 text-sm font-semibold text-muted"
          >
            Checkout — coming soon
          </button>
        </footer>
      </aside>
    </div>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add lib components
git commit -m "feat: cart maths, provider and drawer"
```

---

### Task 4: App shell — header, footer, layout

**Files:**
- Create: `components/nav/Header.tsx`, `components/nav/Footer.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: `useCart` from `components/cart/CartProvider.tsx`; `CATEGORIES` from `lib/db.ts`.
- Produces: `<Header />`, `<Footer />`; the layout wraps all pages in `CartProvider` and renders `CartDrawer`.

- [ ] **Step 1: Write the header**

Create `components/nav/Header.tsx`:

```tsx
"use client";

import Link from "next/link";
import { CATEGORIES } from "@/lib/db.ts";
import { useCart } from "@/components/cart/CartProvider.tsx";

export function Header() {
  const { count, setOpen } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-5">
        <Link href="/" className="text-sm font-bold uppercase tracking-[0.2em]">
          Hard<span className="text-accent">Hat</span>
        </Link>

        <nav className="hidden flex-1 items-center gap-6 text-sm text-muted md:flex">
          <Link href="/shop" className="transition-colors hover:text-foreground">
            All helmets
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/shop?category=${c.slug}`}
              className="transition-colors hover:text-foreground"
            >
              {c.name}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="ml-auto flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm transition-colors hover:border-accent hover:text-accent"
        >
          Cart
          <span className="inline-flex min-w-5 justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-accent-ink">
            {count}
          </span>
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Write the footer**

Create `components/nav/Footer.tsx`:

```tsx
import Link from "next/link";
import { CATEGORIES } from "@/lib/db.ts";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em]">
            Hard<span className="text-accent">Hat</span>
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Helmets that are certified, fitted and delivered across Nepal.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold">Shop</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/shop?category=${c.slug}`}
                  className="transition-colors hover:text-foreground"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Help</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>Sizing guide</li>
            <li>Shipping in Nepal</li>
            <li>Returns</li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Visit</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Lazimpat, Kathmandu
            <br />
            Sun–Fri, 10:00–19:00
          </p>
        </div>
      </div>
      <div className="border-t border-line px-5 py-6 text-center text-xs text-muted">
        © {new Date().getFullYear()} Hard Hat Trading. Demo store — dummy data.
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Wire the layout**

Replace the `RootLayout` body in `app/layout.tsx`:

```tsx
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <CartProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
```

Add the imports at the top:

```tsx
import { CartProvider } from "@/components/cart/CartProvider.tsx";
import { CartDrawer } from "@/components/cart/CartDrawer.tsx";
import { Header } from "@/components/nav/Header.tsx";
import { Footer } from "@/components/nav/Footer.tsx";
```

- [ ] **Step 4: Verify the build**

Run: `npm run build`
Expected: success, no type errors.

- [ ] **Step 5: Commit**

```bash
git add app components
git commit -m "feat: app shell with header, footer and cart drawer"
```

---

### Task 5: Product card and shop grid

**Files:**
- Create: `components/ProductCard.tsx`, `components/cart/QuickAdd.tsx`, `components/shop/Filters.tsx`, `app/shop/page.tsx`

**Interfaces:**
- Consumes: `listHelmets`, `listBrands`, `listCategories`, `CATEGORIES` from `lib/db.ts`; `npr`; `useCart`.
- Produces: `<ProductCard helmet={helmet} />`, `<QuickAdd helmet={helmet} />`, `<Filters brands={…} categories={…} active={…} />`.

- [ ] **Step 1: Write the quick-add button**

Create `components/cart/QuickAdd.tsx`:

```tsx
"use client";

import type { Helmet } from "@/lib/types.ts";
import { useCart } from "./CartProvider.tsx";

export function QuickAdd({ helmet }: { helmet: Helmet }) {
  const { add } = useCart();
  const soldOut = helmet.stock === 0;

  return (
    <button
      type="button"
      disabled={soldOut}
      onClick={() =>
        add({
          helmetId: helmet.id,
          slug: helmet.slug,
          name: helmet.name,
          image: helmet.images[0],
          price_npr: helmet.price_npr,
          size: helmet.sizes[0],
          color: helmet.colors[0].name,
          qty: 1,
        })
      }
      className="mt-3 w-full rounded-full border border-line py-2 text-xs font-semibold uppercase tracking-wider text-muted transition-colors hover:border-accent hover:bg-accent hover:text-accent-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:bg-transparent disabled:hover:text-muted"
    >
      {soldOut ? "Sold out" : "Add to cart"}
    </button>
  );
}
```

- [ ] **Step 2: Write the product card**

Create `components/ProductCard.tsx`:

```tsx
import Image from "next/image";
import Link from "next/link";
import { CATEGORIES } from "@/lib/db.ts";
import { npr } from "@/lib/format.ts";
import type { Helmet } from "@/lib/types.ts";
import { QuickAdd } from "./cart/QuickAdd.tsx";

function categoryName(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
}

export function ProductCard({ helmet }: { helmet: Helmet }) {
  const onSale =
    helmet.compare_at_npr !== null && helmet.compare_at_npr > helmet.price_npr;

  return (
    <article className="group flex flex-col rounded-2xl border border-line bg-surface p-3 transition-colors hover:border-accent/60">
      <Link
        href={`/product/${helmet.slug}`}
        className="relative block aspect-square overflow-hidden rounded-xl bg-background"
      >
        <Image
          src={helmet.images[0]}
          alt={helmet.name}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
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
```

- [ ] **Step 3: Write the filters**

Create `components/shop/Filters.tsx`:

```tsx
import Link from "next/link";

type Active = { category?: string; brand?: string; sort?: string };

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "newest", label: "Newest" },
];

function href(active: Active, patch: Active): string {
  const next = { ...active, ...patch };
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(next)) {
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
  children: React.ReactNode;
}) {
  return (
    <Link
      href={to}
      className={`rounded-full border px-4 py-1.5 text-xs transition-colors ${
        active
          ? "border-accent bg-accent text-accent-ink font-semibold"
          : "border-line text-muted hover:border-foreground hover:text-foreground"
      }`}
    >
      {children}
    </Link>
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
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs uppercase tracking-wider text-muted">
          Type
        </span>
        <Pill href={href(active, { category: undefined })} active={!active.category}>
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
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs uppercase tracking-wider text-muted">
          Brand
        </span>
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
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs uppercase tracking-wider text-muted">
          Sort
        </span>
        {SORTS.map((s) => (
          <Pill
            key={s.value}
            href={href(active, { sort: s.value })}
            active={(active.sort ?? "featured") === s.value}
          >
            {s.label}
          </Pill>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Write the shop page**

Create `app/shop/page.tsx`:

```tsx
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard.tsx";
import { Filters } from "@/components/shop/Filters.tsx";
import { listBrands, listCategories, listHelmets } from "@/lib/db.ts";

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
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
    <div className="mx-auto max-w-7xl px-5 py-12">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Helmets
      </h1>
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
    </div>
  );
}
```

Note: Next 16 types `searchParams` as a promise. `PageProps<"/shop">` is generated by Next; if the type is not yet available, run `npm run dev` once to regenerate `.next/types`.

- [ ] **Step 5: Verify**

Run: `npm run build`
Expected: success. Then `npm run dev` and open `/shop`, `/shop?category=modular`, `/shop?brand=LS2&sort=price-asc`, and a nonsense value such as `/shop?category=zzz` — the last shows the empty state, not an error.

- [ ] **Step 6: Commit**

```bash
git add app components
git commit -m "feat: shop grid with url-driven filters"
```

---

### Task 6: Product detail page

**Files:**
- Create: `app/product/[slug]/page.tsx`, `components/cart/AddToCart.tsx`

**Interfaces:**
- Consumes: `getHelmet`, `listHelmets`, `CATEGORIES`, `npr`, `useCart`.
- Produces: `<AddToCart helmet={helmet} />`.

- [ ] **Step 1: Write the add-to-cart block**

Create `components/cart/AddToCart.tsx`:

```tsx
"use client";

import { useState } from "react";
import type { Helmet } from "@/lib/types.ts";
import { useCart } from "./CartProvider.tsx";

export function AddToCart({ helmet }: { helmet: Helmet }) {
  const { add } = useCart();
  const [size, setSize] = useState(helmet.sizes[0]);
  const [color, setColor] = useState(helmet.colors[0].name);
  const soldOut = helmet.stock === 0;

  return (
    <div className="mt-8 space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted">Size</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {helmet.sizes.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSize(s)}
              aria-pressed={size === s}
              className={`min-w-12 rounded-lg border px-3 py-2 text-sm transition-colors ${
                size === s
                  ? "border-accent bg-accent font-semibold text-accent-ink"
                  : "border-line text-muted hover:border-foreground hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wider text-muted">
          Colour — <span className="text-foreground">{color}</span>
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          {helmet.colors.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => setColor(c.name)}
              aria-label={c.name}
              aria-pressed={color === c.name}
              style={{ backgroundColor: c.hex }}
              className={`size-9 rounded-full border-2 transition-transform ${
                color === c.name
                  ? "border-accent scale-110"
                  : "border-line hover:scale-105"
              }`}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        disabled={soldOut}
        onClick={() =>
          add({
            helmetId: helmet.id,
            slug: helmet.slug,
            name: helmet.name,
            image: helmet.images[0],
            price_npr: helmet.price_npr,
            size,
            color,
            qty: 1,
          })
        }
        className="w-full rounded-full bg-accent px-6 py-4 text-sm font-semibold uppercase tracking-wider text-accent-ink transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
      >
        {soldOut ? "Sold out" : "Add to cart"}
      </button>

      <p className="text-xs text-muted">
        {soldOut
          ? "Out of stock — ask us about the next shipment."
          : `${helmet.stock} in stock · free delivery inside the valley`}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Write the detail page**

Create `app/product/[slug]/page.tsx`:

```tsx
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/cart/AddToCart.tsx";
import { ProductCard } from "@/components/ProductCard.tsx";
import { CATEGORIES, getHelmet, listHelmets } from "@/lib/db.ts";
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
        <Link href="/shop" className="hover:text-foreground">
          Helmets
        </Link>
        {category && (
          <>
            {" / "}
            <Link
              href={`/shop?category=${category.slug}`}
              className="hover:text-foreground"
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
            <Image
              src={helmet.images[0]}
              alt={helmet.name}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          {helmet.images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {helmet.images.slice(1).map((src) => (
                <div
                  key={src}
                  className="relative aspect-square overflow-hidden rounded-xl border border-line bg-surface"
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="25vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-accent">
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
          <p className="mt-5 leading-relaxed text-muted">
            {helmet.description}
          </p>

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
```

- [ ] **Step 3: Verify**

Run: `npm run build`
Expected: success, and the build log lists the product routes as prerendered.

Then `npm run dev`: open a product page, pick a size and a colour, add to cart; the drawer opens with the right line. Add the same helmet in a different size — two lines. Reload the page — the cart survives. Open `/product/does-not-exist` — the 404 page, not a crash.

- [ ] **Step 4: Commit**

```bash
git add app components
git commit -m "feat: product detail page with size and colour selection"
```

---

### Task 7: 3D hero and homepage

**Files:**
- Create: `components/hero/HelmetModel.tsx`, `components/hero/Hero3D.tsx`
- Modify: `app/page.tsx` (full replacement)

**Interfaces:**
- Consumes: `/models/helmet.glb`, `/models/helmet-poster.jpg` from Task 1; `listHelmets`, `listBrands`, `listCategories`; `ProductCard`.
- Produces: `<Hero3D />`.

- [ ] **Step 1: Write the model component**

Create `components/hero/HelmetModel.tsx`:

```tsx
"use client";

import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useRef } from "react";
import type { Group } from "three";

useGLTF.preload("/models/helmet.glb");

export function HelmetModel() {
  const group = useRef<Group>(null);
  const { scene } = useGLTF("/models/helmet.glb");

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.25;
  });

  return (
    <group ref={group} scale={2.1} position={[0, -0.15, 0]}>
      <primitive object={scene} />
    </group>
  );
}
```

- [ ] **Step 2: Write the canvas wrapper**

Create `components/hero/Hero3D.tsx`. It renders the poster until it has confirmed, on the client, that 3D is wanted and supported, and falls back to the poster on any load error.

```tsx
"use client";

import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import Image from "next/image";
import { Component, Suspense, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { HelmetModel } from "./HelmetModel.tsx";

function Poster() {
  return (
    <Image
      src="/models/helmet-poster.jpg"
      alt="Motorcycle helmet"
      fill
      priority
      sizes="100vw"
      className="object-contain"
    />
  );
}

class CanvasBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <Poster /> : this.props.children;
  }
}

/** True only when the browser can and should run WebGL here. */
function use3DEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try {
      const gl = document.createElement("canvas").getContext("webgl2");
      setEnabled(!!gl);
    } catch {
      setEnabled(false);
    }
  }, []);

  return enabled;
}

export function Hero3D() {
  const enabled = use3DEnabled();

  if (!enabled) return <Poster />;

  return (
    <CanvasBoundary>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 38 }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.35} />
          <spotLight
            position={[5, 6, 5]}
            angle={0.35}
            penumbra={1}
            intensity={120}
          />
          <pointLight position={[-5, -2, -4]} intensity={30} color="#ff5a1f" />
          <HelmetModel />
          <ContactShadows
            position={[0, -1.6, 0]}
            opacity={0.5}
            scale={10}
            blur={2.5}
            far={3}
          />
          <Environment preset="city" />
        </Suspense>
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.8}
        />
      </Canvas>
    </CanvasBoundary>
  );
}
```

- [ ] **Step 3: Write the homepage**

Replace the whole of `app/page.tsx`:

```tsx
import dynamic from "next/dynamic";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard.tsx";
import { listBrands, listCategories, listHelmets } from "@/lib/db.ts";

const Hero3D = dynamic(
  () => import("@/components/hero/Hero3D.tsx").then((m) => m.Hero3D),
  { ssr: false },
);

const PROMISES = [
  { title: "Certified only", body: "DOT or ECE 22.06 on every shelf." },
  { title: "Fitted in store", body: "Head measured, shell matched, no guessing." },
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
      <section className="relative isolate h-[88vh] min-h-[560px] overflow-hidden border-b border-line">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,theme(colors.accent)/18%,transparent_65%)]" />
        <div className="absolute inset-0">
          <Hero3D />
        </div>
        <div className="pointer-events-none relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-5 pb-16">
          <p className="text-xs uppercase tracking-[0.35em] text-accent">
            Kathmandu · since 2019
          </p>
          <h1 className="mt-4 max-w-2xl text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
            Your head is not
            <br />
            a spare part.
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
          <Link href="/shop" className="text-sm text-muted hover:text-accent">
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
              className="group relative overflow-hidden rounded-2xl border border-line bg-surface p-8 transition-colors hover:border-accent"
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
```

- [ ] **Step 4: Verify**

Run: `npm run build`
Expected: success.

Then `npm run dev` and open `/`:
- the helmet renders, rotates slowly, and drags to orbit;
- the poster shows first and there is no layout jump when the canvas takes over;
- with "reduce motion" switched on in the OS, the canvas never mounts and the poster stays;
- the page scrolls past the hero into brands, hot items, categories and the trust strip.

- [ ] **Step 5: Run the whole check**

```bash
npm test && npm run build
```

Expected: 16 tests pass, build succeeds.

- [ ] **Step 6: Commit**

```bash
git add app components
git commit -m "feat: 3D helmet hero and homepage"
```

---

## Supabase migration note (not part of v1)

When Supabase lands: create a `helmets` table whose columns match `Helmet`
exactly, rewrite the four function bodies in `lib/db.ts` to query it, and
delete `lib/data/helmets.ts`. `lib/lib.test.ts` keeps passing against the live
data for everything except the fixed row counts. No component changes.
