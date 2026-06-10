import { useQuery } from '@tanstack/react-query';
import { api, ApiResponse } from '@/lib/api';
import { parseApiItems } from '@/lib/parse-api-list';
import type { Listing } from '@/lib/listings-shared';
import { queryKeys } from './keys';

export interface ListingsFilters {
  type?: string;
  district?: string;
  neighborhood?: string;
  limit?: number;
}

export function useListings(filters: ListingsFilters = {}) {
  const { type, district, neighborhood, limit = 50 } = filters;
  return useQuery({
    queryKey: queryKeys.listings({ type, district, neighborhood }),
    queryFn: async () => {
      const params = new URLSearchParams({ limit: String(limit) });
      if (type && type !== 'ALL') params.set('type', type);
      if (district?.trim()) params.set('district', district.trim());
      if (neighborhood?.trim()) params.set('neighborhood', neighborhood.trim());
      const res = await api.get<ApiResponse<{ items: Listing[] }> & { items?: Listing[] }>(`/listings?${params}`);
      return parseApiItems<Listing>(res);
    },
  });
}

export function useMyListings() {
  return useQuery({
    queryKey: queryKeys.listingsMine,
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ items: Listing[] }> & { items?: Listing[] }>('/listings/mine?limit=50');
      return parseApiItems<Listing>(res);
    },
  });
}

export function useListing(id: string) {
  return useQuery({
    queryKey: queryKeys.listing(id),
    queryFn: async () => {
      const res = await api.get<ApiResponse<Listing>>(`/listings/${id}`);
      return res.data ?? null;
    },
    enabled: Boolean(id),
  });
}

export function useStands() {
  return useQuery({
    queryKey: queryKeys.stands,
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ items: Record<string, unknown>[] }> & { items?: Record<string, unknown>[] }>('/stands?limit=100');
      return parseApiItems<Record<string, unknown>>(res);
    },
  });
}

export function useSpareParts() {
  return useQuery({
    queryKey: queryKeys.spareParts,
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ items: Record<string, unknown>[] }> & { items?: Record<string, unknown>[] }>('/spare-parts');
      return parseApiItems<Record<string, unknown>>(res);
    },
  });
}

export function useMyRatings(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.ratings,
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ summary: { average: number; count: number }; items: Record<string, unknown>[] }>>('/ratings/me');
      return res.data;
    },
    enabled,
  });
}
