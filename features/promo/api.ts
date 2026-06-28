// features/promo/api.ts
import api from "@/lib/api";
import { CreatePromoInput } from "./types";

export async function getPromosAdmin() {
  try {
    const res = await api.get("/api/admin/promo");
    return res.data.data || [];
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal mengambil daftar promo");
  }
}

export async function getPromoById(id: string) {
  try {
    const res = await api.get(`/api/admin/promo/${id}`);
    return res.data.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal mengambil detail promo");
  }
}

export async function createPromo(data: CreatePromoInput) {
  try {
    const res = await api.post("/api/admin/promo", data);
    return res.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal membuat promo");
  }
}

export async function updatePromo(id: string, data: Partial<CreatePromoInput>) {
  try {
    const res = await api.patch(`/api/admin/promo/${id}`, data);
    return res.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal memperbarui promo");
  }
}

export async function deletePromo(id: string) {
  try {
    const res = await api.delete(`/api/admin/promo/${id}`);
    return res.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal menghapus promo");
  }
}

/** GET /api/public/promo/products — Daftar produk yang sedang promo (public, tanpa auth) */
export async function getPublicPromoProducts(filters: import("./types").PromoProductFilters = {}) {
  try {
    const { page = 1, limit = 12, sortBy = "latest", search } = filters;
    const res = await api.get("/api/public/promo/products", {
      params: { page, limit, sortBy, search },
    });
    return res.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal mengambil produk promo");
  }
}
