// features/products/api.ts
// Semua fetch function yang berkomunikasi dengan /api/admin/products
// Digunakan oleh hooks.ts — TIDAK langsung dipakai di komponen

import api from "@/lib/api";
import type { ProductFilters } from "./types";

/** GET /api/admin/products — List produk (admin dengan pagination) */
export async function getAdminProducts(filters: ProductFilters = {}) {
  const { page = 1, limit = 10, search = "", categoryId = "" } = filters;
  const res = await api.get("/api/admin/products", {
    params: { page, limit, search, categoryId },
  });
  return res.data;
}

/** GET /api/admin/products/:id — Detail 1 produk (Admin) */
export async function getProductById(id: string) {
  const res = await api.get(`/api/admin/products/${id}`);
  return res.data.data;
}

/** GET /api/public/products/:id — Detail 1 produk (Public) */
export async function getPublicProductById(id: string) {
  const res = await api.get(`/api/public/products/${id}`);
  return res.data.data;
}

/** POST /api/admin/products — Buat produk baru */
export async function createProduct(formData: FormData) {
  const res = await api.post("/api/admin/products", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

/** PUT /api/admin/products/:id — Update produk */
export async function updateProduct(id: string, formData: FormData) {
  const res = await api.put(`/api/admin/products/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

/** DELETE /api/admin/products/:id — Soft delete produk */
export async function deleteProduct(id: string) {
  const res = await api.delete(`/api/admin/products/${id}`);
  return res.data;
}

/** DELETE /api/admin/products/:productId/images/:imageId — Hapus gambar */
export async function deleteProductImage(productId: string, imageId: string) {
  const res = await api.delete(`/api/admin/products/${productId}/images/${imageId}`);
  return res.data;
}

/** POST /api/admin/products/:productId/images — Tambah gambar baru */
export async function addProductImage(productId: string, file: File) {
  const formData = new FormData();
  formData.append("image", file);
  const res = await api.post(`/api/admin/products/${productId}/images`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

/** GET /api/admin/stock/logs — Histori pergerakan stok universal */
export async function getStockLogs(params: { page?: number; limit?: number; search?: string; type?: string } = {}) {
  const res = await api.get("/api/admin/stock/logs", { params });
  return res.data;
}

/** GET /api/admin/stock/logs/sku — Histori pergerakan stok level SKU */
export async function getSkuStockLogs(params: { page?: number; limit?: number; search?: string; type?: string; productId?: string; skuId?: string } = {}) {
  const res = await api.get("/api/admin/stock/logs/sku", { params });
  return res.data;
}
