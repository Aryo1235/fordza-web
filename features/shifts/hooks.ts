"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentShift, openShift, closeShift, getShiftsAdmin, getShiftDetailAdmin, getShiftsStatsAdmin, getCashiersAdmin } from "./api";
import type { OpenShiftPayload, CloseShiftPayload } from "./types";

export const shiftKeys = {
  all: ["shifts"] as const,
  current: ["current-shift"] as const,
};

export function useCurrentShift() {
  return useQuery({
    queryKey: shiftKeys.current,
    queryFn: getCurrentShift,
    retry: false, // Jika 404 (tidak ada shift), langsung fallback tanpa retry
  });
}

export function useOpenShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: OpenShiftPayload) => openShift(payload),
    onSuccess: () => {
      // Refresh cache state 'current-shift' seketika di seluruh app
      queryClient.invalidateQueries({ queryKey: shiftKeys.current });
    },
  });
}

export function useCloseShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CloseShiftPayload) => closeShift(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shiftKeys.current });
    },
  });
}

export function useShiftsAdmin(filters: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  kasirId?: string;
}) {
  return useQuery({
    queryKey: [...shiftKeys.all, "admin-list", filters] as const,
    queryFn: () => getShiftsAdmin(filters),
    placeholderData: (prev) => prev,
  });
}

export function useShiftsStatsAdmin() {
  return useQuery({
    queryKey: [...shiftKeys.all, "admin-stats"] as const,
    queryFn: getShiftsStatsAdmin,
  });
}

export function useShiftDetailAdmin(id: string) {
  return useQuery({
    queryKey: [...shiftKeys.all, "admin-detail", id] as const,
    queryFn: () => getShiftDetailAdmin(id),
    enabled: !!id,
  });
}

export function useCashiersAdmin() {
  return useQuery({
    queryKey: ["cashiers", "admin-list"] as const,
    queryFn: getCashiersAdmin,
  });
}
