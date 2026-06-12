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
    const err = new Error(error?.response?.data?.message || "Gagal menghapus banner");
    (err as any).response = error?.response;
    throw err;
  }
}

export async function getBannerById(id: string) {
  try {
    const res = await api.get(`/api/admin/banners/${id}`);
    return res.data.data;
  } catch (error: any) {
    const err = new Error(error?.response?.data?.message || "Gagal mengambil detail banner");
    (err as any).response = error?.response;
    throw err;
  }
}

export async function updateBanner(id: string, formData: FormData) {
  try {
    const res = await api.put(`/api/admin/banners/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (error: any) {
    const err = new Error(error?.response?.data?.message || "Gagal memperbarui banner");
    (err as any).response = error?.response;
    throw err;
  }
}
