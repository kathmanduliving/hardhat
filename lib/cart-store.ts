"use client";

import type { CartItem } from "./types.ts";
import { CART_STORAGE_KEY, parseCart } from "./cart.ts";

/**
 * Browser-only cart store. The module holds the items, `localStorage` only
 * persists them, and `useSyncExternalStore` reads it — which keeps the first
 * client render consistent with the server's empty cart and syncs tabs for
 * free, without setting state from an effect.
 */

const EMPTY: CartItem[] = [];
const listeners = new Set<() => void>();

let items: CartItem[] = EMPTY;
let loaded = false;

function emit(): void {
  for (const fn of listeners) fn();
}

function load(): void {
  try {
    items = parseCart(window.localStorage.getItem(CART_STORAGE_KEY));
  } catch {
    items = EMPTY; // Blocked or private-mode storage.
  }
  loaded = true;
}

function onStorage(e: StorageEvent): void {
  if (e.key !== null && e.key !== CART_STORAGE_KEY) return;
  load();
  emit();
}

export function subscribe(fn: () => void): () => void {
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

/** Stable identity between writes, as useSyncExternalStore requires. */
export function getSnapshot(): CartItem[] {
  if (!loaded) load();
  return items;
}

export function getServerSnapshot(): CartItem[] {
  return EMPTY;
}

export function setItems(next: CartItem[]): void {
  items = next;
  loaded = true;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Full or blocked storage: the cart still works for this session.
  }
  emit();
}
