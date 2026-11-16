"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";
import type { CartItem } from "@/lib/types.ts";
import { addItem, count, setQty as setQtyIn, subtotal } from "@/lib/cart.ts";
import {
  getServerSnapshot,
  getSnapshot,
  setItems,
  subscribe,
} from "@/lib/cart-store.ts";

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
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [open, setOpen] = useState(false);

  const add = useCallback((item: CartItem) => {
    setItems(addItem(getSnapshot(), item));
    setOpen(true);
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setItems(setQtyIn(getSnapshot(), key, qty));
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
