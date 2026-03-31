const PALO_ALTO_ZIPS = new Set(["94301", "94303", "94304", "94306"]);

export function normalizeZip(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 5);
}

export function isPaloAltoZip(zip: string): boolean {
  return PALO_ALTO_ZIPS.has(normalizeZip(zip));
}
