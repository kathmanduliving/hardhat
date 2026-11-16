import type { CartItem } from "./types.ts";

export const CART_STORAGE_KEY = "hht.cart.v1";

export function itemKey(
  i: Pick<CartItem, "helmetId" | "size" | "color">,
): string {
  return `${i.helmetId}|${i.size}|${i.color}`;
}

export function addItem(items: CartItem[], item: CartItem): CartItem[] {
  const key = itemKey(item);
  if (!items.some((i) => itemKey(i) === key)) return [...items, item];
  return items.map((i) =>
    itemKey(i) === key ? { ...i, qty: i.qty + item.qty } : i,
  );
}

export function setQty(items: CartItem[], key: string, qty: number): CartItem[] {
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
    typeof i.colorHex === "string" &&
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
