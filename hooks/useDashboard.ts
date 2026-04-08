import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["admin", "dashboard-stats"],
    queryFn: async () => {
      const res = await api.get("/api/admin/dashboard");
      return res.data?.data;
    },
  });
}
