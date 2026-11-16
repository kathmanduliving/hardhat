"use client";

import { useState } from "react";
import type { Helmet } from "@/lib/types.ts";
import { useCart } from "./CartProvider.tsx";

export function AddToCart({ helmet }: { helmet: Helmet }) {
  const { add } = useCart();
  const [size, setSize] = useState(helmet.sizes[0]);
  const [color, setColor] = useState(helmet.colors[0]);
  const soldOut = helmet.stock === 0;

  return (
    <div className="mt-8 space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-wider text-muted">Size</p>
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
        <p className="text-[11px] uppercase tracking-wider text-muted">
          Colour — <span className="text-foreground">{color.name}</span>
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          {helmet.colors.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => setColor(c)}
              aria-label={c.name}
              aria-pressed={color.name === c.name}
              style={{ backgroundColor: c.hex }}
              className={`size-9 rounded-full border-2 transition-transform ${
                color.name === c.name
                  ? "scale-110 border-accent"
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
            image: helmet.images[0] ?? "",
            colorHex: color.hex,
            price_npr: helmet.price_npr,
            size,
            color: color.name,
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
