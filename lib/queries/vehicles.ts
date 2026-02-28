import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/fetcher";

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  category: string;
  status: string;
  dailyRate: number;
  color: string | null;
  mileage: number | null;
  fuelType: string | null;
  transmission: string | null;
  seats: number | null;
  notes: string | null;
  createdAt: string;
}

export interface VehiclePayload {
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  category: string;
  dailyRate: number;
  color?: string;
  mileage?: number;
  fuelType?: string;
  transmission?: string;
  seats?: number;
  notes?: string;
}

export function useVehicles(params?: Record<string, string>) {
  return useQuery<Vehicle[]>({
    queryKey: ["vehicles", params],
    queryFn: () => api.get("/api/vehicles", params),
  });
}

export function useVehicle(id: string) {
  return useQuery<Vehicle>({
    queryKey: ["vehicles", id],
    queryFn: () => api.get(`/api/vehicles/${id}`),
    enabled: !!id,
  });
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: VehiclePayload) => api.post("/api/vehicles", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  });
}

export function useUpdateVehicle(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<VehiclePayload> & { status?: string }) =>
      api.patch(`/api/vehicles/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["vehicles", id] });
    },
  });
}

export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/api/vehicles/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  });
}
