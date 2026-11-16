"use client";

import type { Helmet } from "@/lib/types.ts";
import { useCart } from "./CartProvider.tsx";

/** Adds the first size and colour straight from a grid card. */
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
          image: helmet.images[0] ?? "",
          colorHex: helmet.colors[0].hex,
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
