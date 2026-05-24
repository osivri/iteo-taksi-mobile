export type FinancePeriod = 'week' | 'month' | 'all';

export function getPeriodRange(period: FinancePeriod): { from?: string; to?: string } {
  const now = new Date();
  const to = now.toISOString();

  if (period === 'all') return {};
  if (period === 'week') {
    const from = new Date(now);
    from.setDate(from.getDate() - 7);
    return { from: from.toISOString(), to };
  }

  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: from.toISOString(), to };
}

export const periodLabels: Record<FinancePeriod, string> = {
  week: 'Hafta',
  month: 'Ay',
  all: 'Tümü',
};
