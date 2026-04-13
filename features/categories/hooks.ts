"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCategoriesAdmin,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "./api";

export const categoryKeys = {
  all: ["categories"] as const,
  adminList: (page: number) => ["admin-categories", page] as const,
  adminListAll: ["admin-categories-all"] as const,
  detail: (id: string) => ["category", id] as const,
};

export function useCategoriesAdmin(page = 1, limit = 10) {
  return useQuery({
    queryKey: categoryKeys.adminList(page),
    queryFn: () => getCategoriesAdmin(page, limit),
    placeholderData: (prev) => prev,
  });
}

export function useAllCategoriesAdmin() {
  return useQuery({
    queryKey: categoryKeys.adminListAll,
    queryFn: () => getCategoriesAdmin(1, 100), // Ambil 100 data (asumsi cukup untuk dropdown)
  });
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: () => getCategoryById(id),
    enabled: !!id,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => createCategory(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: categoryKeys.adminListAll });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) => updateCategory(id, formData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: categoryKeys.adminListAll });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: categoryKeys.adminListAll });
    },
  });
}
