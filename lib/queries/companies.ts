import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/fetcher";

export interface Company {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string | null;
  address: string | null;
  subscriptionStatus: string;
  enabledFeatures: Record<string, boolean>;
  createdAt: string;
  _count?: { users: number; vehicles: number; bookings: number };
}

export interface CompanyPayload {
  name: string;
  slug: string;
  email: string;
  phone?: string;
  address?: string;
}

export function useCompanies() {
  return useQuery<Company[]>({
    queryKey: ["companies"],
    queryFn: () => api.get("/api/companies"),
  });
}

export function useCompany(id: string) {
  return useQuery<Company>({
    queryKey: ["companies", id],
    queryFn: () => api.get(`/api/companies/${id}`),
    enabled: !!id,
  });
}

export function useCreateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CompanyPayload) => api.post("/api/companies", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["companies"] }),
  });
}

export function useUpdateCompany(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CompanyPayload> & { subscriptionStatus?: string }) =>
      api.patch(`/api/companies/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["companies"] });
      qc.invalidateQueries({ queryKey: ["companies", id] });
    },
  });
}

export function useUpdateCompanyFeatures(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (features: Record<string, boolean>) =>
      api.put(`/api/companies/${id}/features`, { features }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["companies", id] }),
  });
}

export function useDeleteCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/api/companies/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["companies"] }),
  });
}
