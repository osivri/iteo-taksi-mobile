import { getIstanbulDistricts, getNeighborhoodsForDistrict } from '@/lib/istanbul-locations';

export const ISTANBUL_PROVINCE = 'İstanbul';
export const ALL_ISTANBUL_LABEL = 'Tüm İstanbul';

export type MarketplaceLocatable = {
  district: string | null;
  addressLine?: string | null;
};

export function resolveItemDistrict(item: MarketplaceLocatable): string | null {
  const d = item.district?.trim();
  return d || null;
}

export function resolveItemNeighborhood(item: MarketplaceLocatable, district: string): string | null {
  if (!item.addressLine?.trim() || !district) return null;
  const neighborhoods = getNeighborhoodsForDistrict(district);
  const lower = item.addressLine.toLowerCase();
  const match = neighborhoods.find((n) => lower.includes(n.toLowerCase()));
  return match ?? null;
}

export function filterMarketplaceByLocation<T extends MarketplaceLocatable>(
  items: T[],
  district: string,
  neighborhood: string,
): T[] {
  let list = items;
  if (district) {
    list = list.filter((i) => resolveItemDistrict(i) === district);
  }
  if (neighborhood && district) {
    list = list.filter((i) => resolveItemNeighborhood(i, district) === neighborhood);
  }
  return list;
}

export function countByDistrict<T extends MarketplaceLocatable>(items: T[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const d = resolveItemDistrict(item);
    if (!d) continue;
    counts[d] = (counts[d] ?? 0) + 1;
  }
  return counts;
}

export function countByNeighborhood<T extends MarketplaceLocatable>(
  items: T[],
  district: string,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    if (resolveItemDistrict(item) !== district) continue;
    const n = resolveItemNeighborhood(item, district);
    if (!n) continue;
    counts[n] = (counts[n] ?? 0) + 1;
  }
  return counts;
}

export function formatLocationLabel(district: string, neighborhood: string): string {
  if (district && neighborhood) return `${ISTANBUL_PROVINCE} › ${district} › ${neighborhood}`;
  if (district) return `${ISTANBUL_PROVINCE} › ${district} › Tümü`;
  return ALL_ISTANBUL_LABEL;
}

export function formatItemLocationShort(item: MarketplaceLocatable): string | null {
  const district = resolveItemDistrict(item);
  if (!district) return null;
  const neighborhood = resolveItemNeighborhood(item, district);
  return neighborhood ? `${district} · ${neighborhood}` : district;
}

export function sortedDistrictEntries(counts: Record<string, number>): Array<[string, number]> {
  return getIstanbulDistricts()
    .map((name) => [name, counts[name] ?? 0] as [string, number])
    .sort((a, b) => a[0].localeCompare(b[0], 'tr'));
}

export function sortedNeighborhoodEntries(
  counts: Record<string, number>,
  district: string,
): Array<[string, number]> {
  return getNeighborhoodsForDistrict(district)
    .map((name) => [name, counts[name] ?? 0] as [string, number])
    .sort((a, b) => a[0].localeCompare(b[0], 'tr'));
}
