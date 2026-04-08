"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export function useSizeTemplatesAdmin() {
  return useQuery({
    queryKey: ["admin-size-templates"],
    queryFn: async () => {
      const res = await api.get("/api/admin/size-templates");
      return res.data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useCreateSizeTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; type: string; sizes: string[] }) => {
      const res = await api.post("/api/admin/size-templates", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-size-templates"] });
      queryClient.invalidateQueries({ queryKey: ["admin-size-templates-all"] });
    },
  });
}

export function useUpdateSizeTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; type: string; sizes: string[] } }) => {
      const res = await api.put(`/api/admin/size-templates/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-size-templates"] });
      queryClient.invalidateQueries({ queryKey: ["admin-size-templates-all"] });
    },
  });
}

export function useDeleteSizeTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/api/admin/size-templates/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-size-templates"] });
      queryClient.invalidateQueries({ queryKey: ["admin-size-templates-all"] });
    },
  });
}
