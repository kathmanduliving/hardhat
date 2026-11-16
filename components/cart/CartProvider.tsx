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

  // Read after mount so the server render and the first client render match.
  useEffect(() => {
    try {
      setItems(parseCart(window.localStorage.getItem(CART_STORAGE_KEY)));
    } catch {
      // Blocked or private-mode storage: start empty.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Full or blocked storage: the cart still works for this session.
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
