"use client";

import Link from "next/link";
import { CATEGORIES } from "@/lib/categories.ts";
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
