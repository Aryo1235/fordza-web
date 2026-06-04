import api from "@/lib/api";
import type { BannerFilters } from "./types";

export async function getAdminBanners(filters: BannerFilters = {}) {
  try {
    const res = await api.get("/api/admin/banners", {
      params: filters,
    });
    return res.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal mengambil daftar banner");
  }
}

export async function createBanner(formData: FormData) {
  try {
    const res = await api.post("/api/admin/banners", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal membuat banner");
  }
}

export async function deleteBanner(id: string) {
  try {
    const res = await api.delete(`/api/admin/banners/${id}`);
    return res.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal menghapus banner");
  }
}
