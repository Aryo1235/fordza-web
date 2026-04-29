"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getAdminSizeTemplates, 
  createSizeTemplate, 
  updateSizeTemplate, 
  deleteSizeTemplate 
} from "./api";
import type { SizeTemplateCreateInput } from "./types";

export const sizeTemplateKeys = {
  all: ["size-templates"] as const,
  adminList: () => ["admin-size-templates"] as const,
};

export function useSizeTemplatesAdmin() {
  return useQuery({
    queryKey: sizeTemplateKeys.adminList(),
    queryFn: getAdminSizeTemplates,
    placeholderData: (prev) => prev,
  });
}

export function useCreateSizeTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SizeTemplateCreateInput) => createSizeTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sizeTemplateKeys.all });
      queryClient.invalidateQueries({ queryKey: ["admin-size-templates"] }); // Compatibility
      queryClient.invalidateQueries({ queryKey: ["admin-size-templates-all"] }); // Compatibility
    },
  });
}

export function useUpdateSizeTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SizeTemplateCreateInput }) => 
      updateSizeTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sizeTemplateKeys.all });
      queryClient.invalidateQueries({ queryKey: ["admin-size-templates"] });
      queryClient.invalidateQueries({ queryKey: ["admin-size-templates-all"] });
    },
  });
}

export function useDeleteSizeTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSizeTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sizeTemplateKeys.all });
      queryClient.invalidateQueries({ queryKey: ["admin-size-templates"] });
      queryClient.invalidateQueries({ queryKey: ["admin-size-templates-all"] });
    },
  });
}
