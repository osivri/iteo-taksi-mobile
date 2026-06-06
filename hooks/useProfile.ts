import { useQuery } from '@tanstack/react-query';
import { api, ApiResponse } from '@/lib/api';

export const PROFILE_QUERY_KEY = ['profile'] as const;

export function useProfile<T>() {
  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: () => api.get<ApiResponse<T>>('/users/me').then((r) => r.data!),
    staleTime: 30_000,
  });
}
