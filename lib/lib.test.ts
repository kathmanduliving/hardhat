import { test } from "node:test";
import assert from "node:assert/strict";
import { getHelmet, listBrands, listCategories, listHelmets } from "./db.ts";
import { npr } from "./format.ts";
import { addItem, count, itemKey, parseCart, setQty, subtotal } from "./cart.ts";
import type { CartItem } from "./types.ts";

test("listHelmets returns the whole catalogue by default", async () => {
  const all = await listHelmets();
  assert.ok(all.length >= 16);
});

test("listHelmets filters by category", async () => {
  const rows = await listHelmets({ category: "modular" });
  assert.ok(rows.length > 0);
  assert.ok(rows.every((h) => h.category === "modular"));
});

test("listHelmets filters by brand case-insensitively", async () => {
  const rows = await listHelmets({ brand: "ls2" });
  assert.ok(rows.length > 0);
  assert.ok(rows.every((h) => h.brand === "LS2"));
});

test("listHelmets returns nothing for an unknown filter", async () => {
  assert.deepEqual(await listHelmets({ category: "zzz" }), []);
});

test("listHelmets sorts by price ascending and descending", async () => {
  const asc = await listHelmets({ sort: "price-asc" });
  const desc = await listHelmets({ sort: "price-desc" });
  assert.deepEqual(
    asc.map((h) => h.price_npr),
    [...asc.map((h) => h.price_npr)].sort((a, b) => a - b),
  );
  assert.equal(desc[0].price_npr, asc[asc.length - 1].price_npr);
});

test("listHelmets puts featured first by default", async () => {
  const rows = await listHelmets();
  assert.equal(rows[0].featured, true);
});

test("listHelmets ignores an unknown sort instead of throwing", async () => {
  const rows = await listHelmets({ sort: "nonsense" });
  assert.equal(rows[0].featured, true);
});

test("listHelmets honours limit", async () => {
  assert.equal((await listHelmets({ limit: 4 })).length, 4);
});

test("listHelmets does not mutate the backing array", async () => {
  const first = (await listHelmets({ sort: "price-asc" }))[0].id;
  await listHelmets({ sort: "price-desc" });
  assert.equal((await listHelmets({ sort: "price-asc" }))[0].id, first);
});

test("getHelmet finds a slug and returns null for an unknown one", async () => {
  const all = await listHelmets();
  assert.equal((await getHelmet(all[0].slug))?.slug, all[0].slug);
  assert.equal(await getHelmet("no-such-helmet"), null);
});

test("listBrands and listCategories count their rows", async () => {
  const [brands, cats, all] = await Promise.all([
    listBrands(),
    listCategories(),
    listHelmets(),
  ]);
  assert.equal(
    brands.reduce((n, b) => n + b.count, 0),
    all.length,
  );
  assert.equal(
    cats.reduce((n, c) => n + c.count, 0),
    all.length,
  );
  assert.ok(cats.every((c) => c.name && c.slug));
});

test("every helmet row is coherent", async () => {
  const all = await listHelmets();
  const slugs = new Set(all.map((h) => h.slug));
  assert.equal(slugs.size, all.length);
  for (const h of all) {
    assert.ok(h.sizes.length > 0, `${h.slug} has no sizes`);
    assert.ok(h.colors.length > 0, `${h.slug} has no colors`);
    assert.ok(h.price_npr > 0, `${h.slug} has no price`);
    assert.ok(
      h.compare_at_npr === null || h.compare_at_npr > h.price_npr,
      `${h.slug} compare price is not above the price`,
    );
  }
});

test("npr formats with separators and no decimals", () => {
  assert.equal(npr(6399), "NPR 6,399");
  assert.equal(npr(0), "NPR 0");
});

const line = (over: Partial<CartItem> = {}): CartItem => ({
  helmetId: "hlm-001",
  slug: "ls2-rookie-gloss-white",
  name: "LS2 Rookie",
  image: "",
  colorHex: "#ececf0",
  price_npr: 6399,
  size: "L",
  color: "Gloss White",
  qty: 1,
  ...over,
});

test("addItem merges the same helmet, size and colour", () => {
  const items = addItem(addItem([], line()), line());
  assert.equal(items.length, 1);
  assert.equal(items[0].qty, 2);
});

test("addItem keeps a different size or colour as its own line", () => {
  let items = addItem([], line());
  items = addItem(items, line({ size: "XL" }));
  items = addItem(items, line({ color: "Matte Black" }));
  assert.equal(items.length, 3);
});

test("setQty updates a line and removes it at zero or below", () => {
  const items = addItem([], line());
  const key = itemKey(items[0]);
  assert.equal(setQty(items, key, 3)[0].qty, 3);
  assert.equal(setQty(items, key, 0).length, 0);
  assert.equal(setQty(items, key, -2).length, 0);
});

test("subtotal and count sum across lines", () => {
  let items = addItem([], line({ qty: 2 }));
  items = addItem(items, line({ size: "XL", price_npr: 1000, qty: 3 }));
  assert.equal(subtotal(items), 6399 * 2 + 3000);
  assert.equal(count(items), 5);
});

test("parseCart survives null, junk and wrong shapes", () => {
  assert.deepEqual(parseCart(null), []);
  assert.deepEqual(parseCart("not json"), []);
  assert.deepEqual(parseCart('{"a":1}'), []);
  assert.deepEqual(parseCart('[{"helmetId":"x"}]'), []);
  assert.equal(parseCart(JSON.stringify([line()])).length, 1);
});
