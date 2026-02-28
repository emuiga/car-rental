import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/fetcher";

export interface Payment {
  id: string;
  amount: number;
  method: string;
  reference: string | null;
  notes: string | null;
  createdAt: string;
  booking: {
    id: string;
    bookingNumber: string;
    totalAmount: number;
    paymentStatus: string;
    customer: { firstName: string; lastName: string };
    vehicle: { make: string; model: string; licensePlate: string };
  };
}

export interface PaymentPayload {
  bookingId: string;
  amount: number;
  method: string;
  reference?: string;
  notes?: string;
}

export function usePayments(params?: Record<string, string>) {
  return useQuery<Payment[]>({
    queryKey: ["payments", params],
    queryFn: () => api.get("/api/payments", params),
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PaymentPayload) => api.post("/api/payments", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeletePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/api/payments/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
