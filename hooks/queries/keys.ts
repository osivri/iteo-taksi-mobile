import type { FinancePeriod } from '@/lib/date-ranges';

export const queryKeys = {
  profile: ['profile'] as const,
  vehicles: ['vehicles'] as const,
  plateRequests: ['plate-requests'] as const,
  availableVehicles: ['marketplace', 'available-vehicles'] as const,
  availableDrivers: ['marketplace', 'available-drivers'] as const,
  financeRecords: (period: FinancePeriod, vehicleId: string) => ['finance', 'records', period, vehicleId] as const,
  financeSummary: (period: FinancePeriod, vehicleId: string) => ['finance', 'summary', period, vehicleId] as const,
  financeTrends: (period: FinancePeriod, vehicleId: string) => ['finance', 'trends', period, vehicleId] as const,
  payments: ['payments'] as const,
  announcements: ['announcements'] as const,
  appointments: ['appointments'] as const,
  notifications: ['notifications'] as const,
  news: ['news'] as const,
  ohs: ['ohs'] as const,
  serviceRequests: ['service-requests'] as const,
  serviceRequestsByType: (type: string) => ['service-requests', type] as const,
  forgottenItems: ['forgotten-items'] as const,
  fees: ['fees'] as const,
  listings: (filters?: { type?: string; district?: string; neighborhood?: string }) =>
    ['listings', filters ?? {}] as const,
  listingsMine: ['listings', 'mine'] as const,
  listing: (id: string) => ['listings', id] as const,
  stands: ['stands'] as const,
  spareParts: ['spareParts'] as const,
  ratings: ['ratings'] as const,
};
