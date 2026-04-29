// features/promo/hooks.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPromosAdmin,
  getPromoById,
  createPromo,
  updatePromo,
  deletePromo,
} from "./api";
import { CreatePromoInput } from "./types";

export const promoKeys = {
  all: ["promos"] as const,
  adminList: ["admin-promos"] as const,
  detail: (id: string) => ["promo", id] as const,
};

export function usePromosAdmin() {
  return useQuery({
    queryKey: promoKeys.adminList,
    queryFn: getPromosAdmin,
  });
}

export function usePromo(id: string) {
  return useQuery({
    queryKey: promoKeys.detail(id),
    queryFn: () => getPromoById(id),
    enabled: !!id,
  });
}

export function useCreatePromo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePromoInput) => createPromo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promoKeys.adminList });
    },
  });
}

export function useUpdatePromo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreatePromoInput> }) =>
      updatePromo(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: promoKeys.adminList });
      queryClient.invalidateQueries({ queryKey: promoKeys.detail(variables.id) });
    },
  });
}

export function useDeletePromo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePromo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promoKeys.adminList });
    },
  });
}
