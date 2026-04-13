import api from "@/lib/api";
import type { TestimonialFilters } from "./types";

export async function getAdminTestimonials(filters: TestimonialFilters = {}) {
  const res = await api.get("/api/admin/testimonials", {
    params: filters,
  });
  return res.data;
}

export async function createTestimonial(data: any) {
  const res = await api.post("/api/admin/testimonials", data);
  return res.data;
}

export async function updateTestimonial(id: string, data: any) {
  const res = await api.put(`/api/admin/testimonials/${id}`, data);
  return res.data;
}

export async function deleteTestimonial(id: string) {
  const res = await api.delete(`/api/admin/testimonials/${id}`);
  return res.data;
}
