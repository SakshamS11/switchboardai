export function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function percent(used: number, total: number) {
  return total ? Math.round((used / total) * 100) : 0;
}

export function aed(value: number) {
  return `AED ${new Intl.NumberFormat("en-US").format(value)}`;
}
