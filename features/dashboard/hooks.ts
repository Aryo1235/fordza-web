"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "./api";

export const dashboardKeys = {
  stats: ["admin", "dashboard-stats"] as const,
};

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats,
    queryFn: getDashboardStats,
  });
}
