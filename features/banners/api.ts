import api from "@/lib/api";
import type { BannerFilters } from "./types";

export async function getAdminBanners(filters: BannerFilters = {}) {
  const res = await api.get("/api/admin/banners", {
    params: filters,
  });
  return res.data;
}

export async function createBanner(formData: FormData) {
  const res = await api.post("/api/admin/banners", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function deleteBanner(id: string) {
  const res = await api.delete(`/api/admin/banners/${id}`);
  return res.data;
}
