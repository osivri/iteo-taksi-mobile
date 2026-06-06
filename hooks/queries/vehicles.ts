import { useQuery } from '@tanstack/react-query';
import { api, ApiResponse } from '@/lib/api';
import { queryKeys } from './keys';

export interface Vehicle {
  id: string;
  plateNumber: string;
  brand: string | null;
  model: string | null;
  status: string;
  activeDriverId?: string | null;
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
}

export interface AvailableDriver {
  id: string;
  fullName: string;
  memberNo: string | null;
  phone: string | null;
}

export function useVehiclesList(enabled = true) {
  return useQuery({
    queryKey: queryKeys.vehicles,
    enabled,
    queryFn: async () => {
      const res = await api.get<ApiResponse<Vehicle[]>>('/vehicles');
      return Array.isArray(res.data) ? res.data : [];
    },
  });
}

export function usePlateRequests() {
  return useQuery({
    queryKey: queryKeys.plateRequests,
    queryFn: async () => {
      const res = await api.get<ApiResponse<PlateRequest[]>>('/vehicles/plate-requests');
      return Array.isArray(res.data) ? res.data : [];
    },
  });
}

export function useAvailableVehicles(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.availableVehicles,
    enabled,
    queryFn: async () => {
      const res = await api.get<ApiResponse<AvailableVehicle[]>>('/vehicles/marketplace/available-vehicles');
      return Array.isArray(res.data) ? res.data : [];
    },
  });
}

export function useAvailableDrivers(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.availableDrivers,
    enabled,
    queryFn: async () => {
      const res = await api.get<ApiResponse<AvailableDriver[]>>('/vehicles/marketplace/available-drivers');
      return Array.isArray(res.data) ? res.data : [];
    },
  });
}
