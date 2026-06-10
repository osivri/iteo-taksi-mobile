import { useQuery } from '@tanstack/react-query';
import { api, ApiResponse } from '@/lib/api';
import { queryKeys } from './keys';

export function usePaymentsList() {
  return useQuery({
    queryKey: queryKeys.payments,
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ id: string }> & { items: Array<{ id: string; type: string; amount: number; status: string; paidAt: string | null }> }>('/payments');
      return res.items ?? [];
    },
  });
}

export function useAnnouncementsList() {
  return useQuery({
    queryKey: queryKeys.announcements,
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ id: string; title: string; content: string; category: string; priority: string; publishedAt: string | null }> & { items: Array<{ id: string; title: string; content: string; category: string; priority: string; publishedAt: string | null }> }>(
        '/announcements?limit=50',
      );
      return res.items ?? [];
    },
  });
}

export function useAppointmentsList() {
  return useQuery({
    queryKey: queryKeys.appointments,
    queryFn: async () => {
      const res = await api.get<
        ApiResponse<{ id: string }> & {
          items: Array<{
            id: string;
            type: string;
            status: string;
            requestedDate: string;
            description: string | null;
            plateNumber: string | null;
            serviceType: string | null;
          }>;
        }
      >('/appointments');
      return res.items ?? [];
    },
  });
}

export function useNotificationsList() {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: async () => {
      const res = await api.get<
        ApiResponse<{ id: string }> & {
          items: Array<{ id: string; title: string; body: string; type: string; isRead: boolean; createdAt: string }>;
        }
      >('/notifications?limit=50');
      return res.items ?? [];
    },
  });
}

type NewsListItem = {
  id: string;
  title: string;
  summary: string | null;
  category: string;
  content: string;
  publishedAt: string | null;
};

export function useNewsList() {
  return useQuery({
    queryKey: queryKeys.news,
    queryFn: async () => {
      const res = await api.get<{ items: NewsListItem[] }>('/news?limit=50');
      return res.items ?? [];
    },
  });
}

export function useOhsList() {
  return useQuery({
    queryKey: queryKeys.ohs,
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ id: string }> & { items: Array<{ id: string; title: string; category: string; type: string }> }>('/ohs/contents?limit=50');
      return res.items ?? [];
    },
  });
}

export function useServiceRequestsList() {
  return useQuery({
    queryKey: queryKeys.serviceRequests,
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ id: string }> & { items: Array<{ id: string; type: string; title: string; description: string | null; plateNumber: string | null; status: string; createdAt: string }> }>(
        '/service-requests',
      );
      return res.items ?? [];
    },
  });
}

export function useServiceRequestsByType(type: string) {
  return useQuery({
    queryKey: queryKeys.serviceRequestsByType(type),
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ id: string }> & { items: Array<{ id: string; type: string; title: string; description: string | null; plateNumber: string | null; status: string; createdAt: string }> }>(
        `/service-requests?limit=50&type=${type}`,
      );
      return res.items ?? [];
    },
  });
}

type ForgottenListItem = {
  id: string;
  plateNumber: string;
  description: string;
  photoUrl: string | null;
  status: string;
  adminNote: string | null;
  createdAt: string;
};

export function useForgottenItemsList() {
  return useQuery({
    queryKey: queryKeys.forgottenItems,
    queryFn: async () => {
      const res = await api.get<{ items: ForgottenListItem[] }>('/forgotten-items');
      return res.items ?? [];
    },
  });
}
