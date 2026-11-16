const grouping = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** The only place a price becomes a string. */
export function npr(amount: number): string {
  return `NPR ${grouping.format(amount)}`;
}
