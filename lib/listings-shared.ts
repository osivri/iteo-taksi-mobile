export interface Listing {
  id: string;
  userId?: string;
  type: string;
  status: string;
  title: string;
  description: string | null;
  price: number;
  district: string | null;
  neighborhood: string | null;
  photos: string[];
  contactPhone: string | null;
  brand: string | null;
  model: string | null;
  vehicleYear: number | null;
  plateNumber: string | null;
  mileage: number | null;
  fuelType: string | null;
  damageInfo: string | null;
  adminNote: string | null;
  createdAt: string;
  isOwner?: boolean;
}

export type ListingTab = 'browse' | 'create' | 'mine';
export type ListingTypeFilter = 'ALL' | 'VEHICLE_RENTAL' | 'PLATE_SALE';
export type SortOption = 'newest' | 'price_asc' | 'price_desc';

export const typeLabels: Record<string, string> = {
  VEHICLE_RENTAL: 'Araç Kiralama',
  PLATE_SALE: 'Plaka Satış',
};

export const fuelTypeOptions = ['Benzin', 'Dizel', 'LPG', 'Elektrik', 'Hibrit'] as const;

export const statusLabels: Record<string, string> = {
  PENDING: 'Onay Bekliyor',
  APPROVED: 'Onaylı',
  REJECTED: 'Reddedildi',
};

export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral';

export function statusTone(status: string): StatusTone {
  if (status === 'APPROVED') return 'success';
  if (status === 'PENDING') return 'warning';
  if (status === 'REJECTED') return 'danger';
  return 'neutral';
}

export function formatPrice(price: number) {
  return `${price.toLocaleString('tr-TR')} ₺`;
}

export function hasVehicleDetails(
  listing: Pick<Listing, 'brand' | 'model' | 'vehicleYear' | 'plateNumber' | 'mileage' | 'fuelType' | 'damageInfo'>,
) {
  return Boolean(
    listing.brand ||
      listing.model ||
      listing.vehicleYear ||
      listing.plateNumber ||
      listing.mileage ||
      listing.fuelType ||
      listing.damageInfo,
  );
}

export function formatLocation(listing: Pick<Listing, 'district' | 'neighborhood'>) {
  const parts = [listing.district, listing.neighborhood].filter(Boolean);
  return parts.length > 0 ? parts.join(' / ') : 'Konum belirtilmedi';
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function sortListings(items: Listing[], sort: SortOption): Listing[] {
  const list = [...items];
  if (sort === 'price_asc') return list.sort((a, b) => a.price - b.price);
  if (sort === 'price_desc') return list.sort((a, b) => b.price - a.price);
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function filterListingsClient(
  items: Listing[],
  opts: { search: string; minPrice: string; maxPrice: string },
): Listing[] {
  let list = items;
  const q = opts.search.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        (i.description?.toLowerCase().includes(q) ?? false) ||
        (i.district?.toLowerCase().includes(q) ?? false) ||
        (i.neighborhood?.toLowerCase().includes(q) ?? false) ||
        (i.brand?.toLowerCase().includes(q) ?? false) ||
        (i.model?.toLowerCase().includes(q) ?? false) ||
        (i.plateNumber?.toLowerCase().includes(q) ?? false),
    );
  }
  const min = opts.minPrice ? Number(opts.minPrice) : null;
  const max = opts.maxPrice ? Number(opts.maxPrice) : null;
  if (min != null && !Number.isNaN(min)) list = list.filter((i) => i.price >= min);
  if (max != null && !Number.isNaN(max)) list = list.filter((i) => i.price <= max);
  return list;
}
