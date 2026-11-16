import Link from "next/link";
import { CATEGORIES } from "@/lib/categories.ts";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em]">
            Hard<span className="text-accent">Hat</span>
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Helmets that are certified, fitted in person and delivered across
            Nepal.
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
        © Hard Hat Trading. Demo store — dummy data.
      </div>
    </footer>
  );
}
