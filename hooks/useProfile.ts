import { useQuery } from '@tanstack/react-query';
import { api, ApiResponse } from '@/lib/api';

import { queryKeys } from '@/hooks/queries/keys';

export const PROFILE_QUERY_KEY = queryKeys.profile;

export function useProfile<T>() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: () => api.get<ApiResponse<T>>('/users/me').then((r) => r.data!),
    staleTime: 30_000,
  });
}
