import { useQuery } from '@tanstack/react-query';
import { api, ApiResponse } from '@/lib/api';
import { parseApiItems } from '@/lib/parse-api-list';
import { queryKeys } from './keys';

export interface Vehicle {
  id: string;
  plateNumber: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  status: string;
  activeDriverId?: string | null;
}

export function formatVehicleSummary(vehicle: Pick<Vehicle, 'brand' | 'model' | 'year'>): string {
  const parts = [vehicle.brand, vehicle.model, vehicle.year ? String(vehicle.year) : null].filter(Boolean);
  return parts.join(' ') || 'Marka / model belirtilmedi';
}

export interface PlateRequest {
  id: string;
  plateNumber: string;
  status: string;
  initiatedBy?: string;
  driverName?: string;
  ownerName?: string;
  createdAt: string;
}

export interface AvailableVehicle {
  id: string;
  plateNumber: string;
  brand: string | null;
  model: string | null;
  ownerName: string;
  hasPendingRequest: boolean;
  district: string | null;
  city: string | null;
  addressLine: string | null;
}

export interface AvailableDriver {
  id: string;
  fullName: string;
  memberNo: string | null;
  phone: string | null;
  district: string | null;
  city: string | null;
  addressLine: string | null;
}

export function useVehiclesList(enabled = true) {
  return useQuery({
    queryKey: queryKeys.vehicles,
    enabled,
    queryFn: async () => {
      const res = await api.get<ApiResponse<Vehicle[]>>('/vehicles?limit=100');
      return parseApiItems<Vehicle>(res);
    },
  });
}

export function usePlateRequests() {
  return useQuery({
    queryKey: queryKeys.plateRequests,
    queryFn: async () => {
      const res = await api.get<ApiResponse<PlateRequest[]>>('/vehicles/plate-requests?limit=100');
      return parseApiItems<PlateRequest>(res);
    },
  });
}

export function useAvailableVehicles(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.availableVehicles,
    enabled,
    queryFn: async () => {
      const res = await api.get<ApiResponse<AvailableVehicle[]>>('/vehicles/marketplace/available-vehicles?limit=100');
      return parseApiItems<AvailableVehicle>(res);
    },
  });
}

export function useAvailableDrivers(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.availableDrivers,
    enabled,
    queryFn: async () => {
      const res = await api.get<ApiResponse<AvailableDriver[]>>('/vehicles/marketplace/available-drivers?limit=100');
      return parseApiItems<AvailableDriver>(res);
    },
  });
}
