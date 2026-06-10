import type { Vehicle } from '@/hooks/queries/vehicles';
import { formatVehicleSummary } from '@/hooks/queries/vehicles';

export const vehicleStatusLabels: Record<string, string> = {
  ACTIVE: 'Aktif',
  PASSIVE: 'Pasif',
};

export function formatVehiclePlateLabel(vehicle: Pick<Vehicle, 'plateNumber' | 'brand' | 'model' | 'year'>): string {
  const extra = formatVehicleSummary(vehicle);
  if (extra === 'Marka / model belirtilmedi') return vehicle.plateNumber;
  return `${vehicle.plateNumber} · ${extra}`;
}

export function parseVehicleYear(value: string): number | undefined {
  const parsed = Number.parseInt(value.trim(), 10);
  if (!value.trim() || Number.isNaN(parsed)) return undefined;
  const maxYear = new Date().getFullYear() + 1;
  if (parsed < 1980 || parsed > maxYear) return undefined;
  return parsed;
}

export function normalizeDateInput(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return undefined;
  return trimmed;
}

export function vehicleStatusTone(status: string): 'success' | 'neutral' {
  return status === 'ACTIVE' ? 'success' : 'neutral';
}
