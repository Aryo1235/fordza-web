"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminTestimonials, createTestimonial, updateTestimonial, deleteTestimonial } from "./api";
import type { TestimonialFilters } from "./types";

export const testimonialKeys = {
  all: ["testimonials"] as const,
  adminList: (filters: TestimonialFilters) => ["admin-testimonials", filters] as const,
};

export function useTestimonialsAdmin(page = 1, limit = 10, search = "") {
  return useQuery({
    queryKey: testimonialKeys.adminList({ page, limit, search }),
    queryFn: () => getAdminTestimonials({ page, limit, search }),
    placeholderData: (prev) => prev,
  });
}

export function useCreateTestimonial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => createTestimonial(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testimonialKeys.all });
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
    },
  });
}

export function useUpdateTestimonial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateTestimonial(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testimonialKeys.all });
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
    },
  });
}

export function useDeleteTestimonial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTestimonial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testimonialKeys.all });
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
    },
  });
}
