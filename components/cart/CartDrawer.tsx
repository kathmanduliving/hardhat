"use client";

import Link from "next/link";
import { useEffect } from "react";
import { itemKey } from "@/lib/cart.ts";
import { npr } from "@/lib/format.ts";
import { ProductImage } from "@/components/ProductImage.tsx";
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

  const tab = open ? 0 : -1;

  return (
    <div
      className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close cart"
        tabIndex={tab}
        onClick={() => setOpen(false)}
        className={`absolute inset-0 bg-black/70 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
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
            tabIndex={tab}
            onClick={() => setOpen(false)}
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            Close
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-muted">Nothing in here yet.</p>
            <Link
              href="/shop"
              tabIndex={tab}
              onClick={() => setOpen(false)}
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink"
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
                  <div className="relative size-20 flex-none overflow-hidden rounded-lg border border-line bg-background">
                    <ProductImage
                      src={item.image || undefined}
                      alt=""
                      seed={`cart-${key}`}
                      hex={item.colorHex}
                      sizes="80px"
                      artClassName="p-1.5"
                    />
                  </div>
                  <div className="flex-1">
                    <Link
                      href={`/product/${item.slug}`}
                      tabIndex={tab}
                      onClick={() => setOpen(false)}
                      className="text-sm font-medium leading-snug hover:text-accent"
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
                          tabIndex={tab}
                          aria-label={`Decrease quantity of ${item.name}`}
                          onClick={() => setQty(key, item.qty - 1)}
                          className="px-3 py-1 text-muted transition-colors hover:text-foreground"
                        >
                          −
                        </button>
                        <span className="min-w-6 text-center text-sm">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          tabIndex={tab}
                          aria-label={`Increase quantity of ${item.name}`}
                          onClick={() => setQty(key, item.qty + 1)}
                          className="px-3 py-1 text-muted transition-colors hover:text-foreground"
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
