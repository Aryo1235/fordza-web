"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminBanners, createBanner, deleteBanner, getBannerById, updateBanner } from "./api";

export const bannerKeys = {
  all: ["banners"] as const,
  adminList: (page: number) => ["admin-banners", page] as const,
};

export function useBannersAdmin(page = 1, limit = 10) {
  return useQuery({
    queryKey: bannerKeys.adminList(page),
    queryFn: () => getAdminBanners({ page, limit }),
    placeholderData: (prev) => prev,
  });
}

export function useCreateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => createBanner(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bannerKeys.all });
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] }); // Backward compatibility for cache
    },
  });
}

export function useDeleteBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBanner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bannerKeys.all });
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
    },
  });
}

export function useBanner(id: string) {
  return useQuery({
    queryKey: ["banner", id],
    queryFn: () => getBannerById(id),
    enabled: !!id,
  });
}

export function useUpdateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) => updateBanner(id, formData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: bannerKeys.all });
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      queryClient.invalidateQueries({ queryKey: ["banner", variables.id] });
    },
  });
}
