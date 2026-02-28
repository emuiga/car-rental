import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/fetcher";

export interface Booking {
  id: string;
  bookingNumber: string;
  status: string;
  paymentStatus: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  notes: string | null;
  createdAt: string;
  vehicle: { id: string; make: string; model: string; licensePlate: string };
  customer: { id: string; firstName: string; lastName: string; phone: string };
  payments?: Payment[];
}

export interface Payment {
  id: string;
  amount: number;
  method: string;
  reference: string | null;
  notes: string | null;
  createdAt: string;
}

export interface BookingPayload {
  vehicleId: string;
  customerId: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  notes?: string;
}

export function useBookings(params?: Record<string, string>) {
  return useQuery<Booking[]>({
    queryKey: ["bookings", params],
    queryFn: () => api.get("/api/bookings", params),
  });
}

export function useBooking(id: string) {
  return useQuery<Booking>({
    queryKey: ["bookings", id],
    queryFn: () => api.get(`/api/bookings/${id}`),
    enabled: !!id,
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BookingPayload) => api.post("/api/bookings", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}

export function useUpdateBookingStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: string) => api.patch(`/api/bookings/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["bookings", id] });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateBooking(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<BookingPayload>) => api.patch(`/api/bookings/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["bookings", id] });
    },
  });
}
