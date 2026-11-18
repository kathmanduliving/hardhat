# Helmet Store v1 — Design

Date: 2026-11-16
Status: approved

## Goal

E-commerce front end for selling motorcycle helmets. Homepage leads with an
interactive 3D helmet. Product browsing modelled on motoworldnepal.com.
Dummy data now, Supabase later — the swap must not touch any component.

## Scope

In: home, shop grid with filters, product detail, client-side cart.
Out (v1): auth, checkout, payments, search, reviews, admin, i18n, orders.

Market: Nepal. Currency NPR, formatted `NPR 6,399` (`en-IN` grouping, no decimals).

## Stack

Existing: Next 16 (App Router, `cacheComponents`), React 19, TypeScript,
Tailwind 4 (`@tailwindcss/turbopack`).

Added: `three`, `@react-three/fiber`, `@react-three/drei`. Nothing else.

## Architecture

```
app/
  layout.tsx          root shell: header, cart provider, footer
  page.tsx            home
  shop/page.tsx       filtered grid (searchParams)
  product/[slug]/page.tsx
components/
  hero/Hero3D.tsx     client, dynamic import, ssr:false
  hero/HelmetModel.tsx
  ProductCard.tsx
  HelmetArt.tsx       vector helmet, tinted per product colour
  ProductImage.tsx    photo when one exists, vector art when not
  shop/Filters.tsx
  cart/CartProvider.tsx, CartDrawer.tsx, AddToCart.tsx, QuickAdd.tsx
  nav/Header.tsx, Footer.tsx
lib/
  types.ts            Helmet, CartItem
  db.ts               async data access — the ONLY Supabase swap point
  data/helmets.ts     dummy rows
  cart.ts             pure total/merge math
  format.ts           NPR formatter
public/models/        helmet .glb
```

Each unit has one job. Components import `lib/db` only through server
components; the cart is the only client-side state.

## Data layer

`lib/types.ts` mirrors the future Postgres table one-to-one:

```ts
type Helmet = {
  id: string
  slug: string
  name: string
  brand: string           // LS2 | AGV | HJC | Axor | Shark
  category: string        // full-face | modular | half-face | off-road
  price_npr: number
  compare_at_npr: number | null   // non-null => sale badge
  images: string[]
  sizes: string[]
  colors: { name: string; hex: string }[]
  stock: number
  description: string
  specs: Record<string, string>
  featured: boolean
}
```

`lib/db.ts` exports async functions only:

- `listHelmets(opts?: { category?; brand?; sort?; limit? }): Promise<Helmet[]>`
- `getHelmet(slug: string): Promise<Helmet | null>`
- `listBrands(): Promise<{ name: string; count: number }[]>`
- `listCategories(): Promise<{ slug: string; name: string; count: number }[]>`

Sort values: `featured` (default), `price-asc`, `price-desc`, `newest`.
Bodies filter the in-memory array today. Supabase migration replaces the
bodies with `supabase.from('helmets')` queries; signatures and all call
sites stay identical.

Catalog: 16 helmets, 5 brands, 4 categories.

Product photography does not exist yet, and the freely licensed stock that
does exist is crash-test and rider photography, not product shots — a grid of
it looks broken rather than sparse. So `images` ships empty on every row and
`components/HelmetArt.tsx` draws a vector helmet tinted with the product's
colour. `components/ProductImage.tsx` holds the single branch: a photo when
`images[0]` exists, vector art when it does not. Real photography arrives by
filling `images`; no component changes, and remote hosts are added to
`next.config.ts` `images.remotePatterns` at that point.

## Homepage

1. **3D hero** — full-viewport canvas. GLB helmet, slow auto-rotate,
   drag to orbit (no zoom, no pan), studio HDR environment, contact
   shadow. Headline + two CTAs overlaid. Scroll pulls the camera back
   and fades the overlay.
   - Client component, `dynamic(..., { ssr: false })`. The fallback is
     `HelmetArt` at hero size, filling the same box, so there is no CLS
     when the canvas takes over.
   - `prefers-reduced-motion: reduce`, or no WebGL2 context: render the
     vector fallback and never mount the canvas. No WebGL cost on weak
     phones.
   - Asset: Khronos `DamagedHelmet` GLB (~3.7 MB), CC BY-NC 4.0, attributed in
     `NOTICE.md`. Non-commercial licence, so it is a development
     placeholder only — a licensed motorcycle-helmet GLB dropped
     at the same path replaces it with no code change.
2. Shop-by-brand tiles (5).
3. Hot Items — `featured` helmets, same `ProductCard` as the shop grid.
4. Shop-by-category tiles (4).
5. Trust strip + footer.

## Shop

Grid: 2 cols mobile, 3 tablet, 4 desktop. Filters (category, brand, sort)
live in the URL `searchParams` so the page stays a server component and
links are shareable. Empty state when filters match nothing.

`ProductCard`: image, category + brand tags, name, NPR price,
struck-through compare price when on sale, `Best Seller` overlay for
featured, add-to-cart button.

## Product detail

Image gallery (thumbs + main), brand/category breadcrumb, price, size
select, colour swatches, stock line, add-to-cart, spec table,
description. Out of stock disables the button. `generateStaticParams`
over all slugs; 404 via `notFound()` for unknown slugs.

## Cart

`CartProvider` (client context) holds `CartItem[]`
(`helmetId, slug, name, image, colorHex, price_npr, size, color, qty` —
`colorHex` tints the vector fallback in the drawer). Same
helmet with the same size and colour merges and increments qty; a
different size or colour is a separate line.

The items live in `lib/cart-store.ts`, a browser-only module read through
`useSyncExternalStore`; `localStorage` under `hht.cart.v1` only persists
them. That keeps the first client render consistent with the server's empty
cart without setting state from an effect, and syncs open tabs through the
`storage` event. Every storage call is wrapped in try/catch, so blocked or
private-mode storage degrades to a session-only cart.
Drawer: line items, qty steppers, remove, subtotal, disabled
"Checkout — coming soon".

## Error handling

- Unknown slug: `notFound()`.
- GLB fails to load or WebGL is unavailable: an error boundary renders the
  vector fallback. The page never breaks on a 3D failure. The scene's
  environment map is built from drei `Lightformer`s rather than a CDN HDRI,
  so the hero needs no network beyond the GLB itself.
- Bad `searchParams` values: ignored, fall back to defaults.
- `localStorage` throws or holds malformed JSON: start with an empty
  cart, never crash.

## Testing

One `node --test` file, `lib/lib.test.ts`, covering the logic that can
silently break: `listHelmets` filtering and each sort order,
`getHelmet` hit and miss, cart merge-vs-new-line and subtotal maths.
No test framework, no fixtures. Presentational components are not
tested.

## Supabase migration (future, not v1)

`helmets` table matching `Helmet`. Rewrite the four function bodies in
`lib/db.ts`. Cart moves server-side with auth. Nothing else changes.
