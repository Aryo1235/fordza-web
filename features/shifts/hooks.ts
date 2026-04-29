"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentShift, openShift, closeShift } from "./api";
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
