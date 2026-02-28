import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/fetcher";

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  idType: string | null;
  idNumber: string | null;
  type: string;
  address: string | null;
  notes: string | null;
  createdAt: string;
  _count?: { bookings: number };
}

export interface CustomerPayload {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  idType?: string;
  idNumber?: string;
  type?: string;
  address?: string;
  notes?: string;
}

export function useCustomers(params?: Record<string, string>) {
  return useQuery<Customer[]>({
    queryKey: ["customers", params],
    queryFn: () => api.get("/api/customers", params),
  });
}

export function useCustomer(id: string) {
  return useQuery<Customer>({
    queryKey: ["customers", id],
    queryFn: () => api.get(`/api/customers/${id}`),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CustomerPayload) => api.post("/api/customers", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useUpdateCustomer(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CustomerPayload>) => api.patch(`/api/customers/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["customers", id] });
    },
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/api/customers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}
