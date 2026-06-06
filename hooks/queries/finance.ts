import { useQuery } from '@tanstack/react-query';
import { api, ApiResponse } from '@/lib/api';
import { FinancePeriod, getPeriodRange } from '@/lib/date-ranges';
import { queryKeys } from './keys';

export interface FinanceRecord {
  id: string;
  type: string;
  category: string;
  amount: number;
  recordDate: string;
  vehicleId: string | null;
  description: string | null;
  receiptImageUrl: string | null;
  receiptOcrData?: {
    amount: number | null;
    category: string | null;
    merchant: string | null;
    confidence: number;
  } | null;
}

export interface FinanceSummary {
  totalIncome: number;
  totalExpense: number;
  net: number;
  currency: string;
}

export interface FinanceTrendPoint {
  date: string;
  income: number;
  expense: number;
  net: number;
}

function buildRangeQuery(period: FinancePeriod, vehicleId: string) {
  const range = getPeriodRange(period);
  const qs = new URLSearchParams(range.from ? { from: range.from, to: range.to! } : {});
  if (vehicleId) qs.set('vehicleId', vehicleId);
  return qs.toString() ? `?${qs}` : vehicleId ? `?vehicleId=${vehicleId}` : '';
}

export function useFinanceRecords(period: FinancePeriod, vehicleId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.financeRecords(period, vehicleId),
    enabled,
    queryFn: async () => {
      const range = getPeriodRange(period);
      const qs = new URLSearchParams({ limit: '20' });
      if (range.from) qs.set('from', range.from);
      if (range.to) qs.set('to', range.to);
      if (vehicleId) qs.set('vehicleId', vehicleId);
      const res = await api.get<ApiResponse<FinanceRecord> & { items: FinanceRecord[] }>(`/finance/records?${qs}`);
      return res.items ?? [];
    },
  });
}

export function useFinanceSummary(period: FinancePeriod, vehicleId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.financeSummary(period, vehicleId),
    enabled,
    queryFn: async () => {
      const suffix = buildRangeQuery(period, vehicleId);
      const res = await api.get<ApiResponse<FinanceSummary>>(`/finance/summary${suffix}`);
      return res.data ?? null;
    },
  });
}

export function useFinanceTrends(period: FinancePeriod, vehicleId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.financeTrends(period, vehicleId),
    enabled,
    queryFn: async () => {
      const suffix = buildRangeQuery(period, vehicleId);
      const res = await api.get<ApiResponse<{ points: FinanceTrendPoint[] }>>(`/finance/trends${suffix}`);
      return res.data?.points ?? [];
    },
  });
}
