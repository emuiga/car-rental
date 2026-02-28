import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/fetcher";

export interface DashboardStats {
  revenue: { thisMonth: number; lastMonth: number; change: number };
  bookings: { total: number; pending: number; active: number; completed: number; cancelled: number };
  vehicles: { total: number; available: number; rented: number; maintenance: number };
  customers: { total: number };
}

export function useDashboard() {
  return useQuery<DashboardStats>({
    queryKey: ["dashboard"],
    queryFn: () => api.get("/api/dashboard"),
  });
}
