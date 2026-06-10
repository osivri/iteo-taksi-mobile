import { useQuery } from '@tanstack/react-query';
import { api, ApiResponse } from '@/lib/api';
import { queryKeys } from './keys';

export interface FeeConfig {
  key: string;
  amount: number;
  currency: string;
  label: string | null;
}

export function useFees() {
  return useQuery({
    queryKey: queryKeys.fees,
    queryFn: async () => {
      const res = await api.get<ApiResponse<FeeConfig[]>>('/fees');
      return res.data ?? [];
    },
    staleTime: 5 * 60_000,
  });
}

export function getFeeAmount(fees: FeeConfig[] | undefined, key: string, fallback: number) {
  return fees?.find((f) => f.key === key)?.amount ?? fallback;
}
