import { useQuery } from '@tanstack/react-query';
import { api, ApiResponse } from '@/lib/api';
import { queryKeys } from './keys';

export function useListings() {
  return useQuery({
    queryKey: queryKeys.listings,
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ items: Record<string, unknown>[] }> & { items?: Record<string, unknown>[] }>('/listings');
      return res.data?.items ?? res.items ?? [];
    },
  });
}

export function useStands() {
  return useQuery({
    queryKey: queryKeys.stands,
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ items: Record<string, unknown>[] }> & { items?: Record<string, unknown>[] }>('/stands?limit=100');
      return res.data?.items ?? res.items ?? [];
    },
  });
}

export function useSpareParts() {
  return useQuery({
    queryKey: queryKeys.spareParts,
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ items: Record<string, unknown>[] }> & { items?: Record<string, unknown>[] }>('/spare-parts');
      return res.data?.items ?? res.items ?? (Array.isArray(res.data) ? res.data : []);
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
