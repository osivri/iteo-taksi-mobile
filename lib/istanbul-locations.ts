import { getDistrictsAndNeighbourhoodsByCityCode } from 'turkey-neighbourhoods';

const ISTANBUL_CODE = '34';

function formatNeighborhoodName(raw: string): string {
  return raw.replace(/\s+Mah\.?$/i, '').trim();
}

let districtNeighborhoodMap: Record<string, string[]> | null = null;

function getDistrictNeighborhoodMap(): Record<string, string[]> {
  if (!districtNeighborhoodMap) {
    const raw = getDistrictsAndNeighbourhoodsByCityCode(ISTANBUL_CODE);
    districtNeighborhoodMap = Object.fromEntries(
      Object.entries(raw).map(([district, neighborhoods]) => [
        district,
        neighborhoods
          .map(formatNeighborhoodName)
          .sort((a, b) => a.localeCompare(b, 'tr')),
      ]),
    );
  }
  return districtNeighborhoodMap;
}

export function getIstanbulDistricts(): string[] {
  return Object.keys(getDistrictNeighborhoodMap()).sort((a, b) => a.localeCompare(b, 'tr'));
}

export function getNeighborhoodsForDistrict(district: string): string[] {
  if (!district.trim()) return [];
  return getDistrictNeighborhoodMap()[district] ?? [];
}
