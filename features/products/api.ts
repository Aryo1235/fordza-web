// features/products/api.ts
// Semua fetch function yang berkomunikasi dengan /api/admin/products
// Digunakan oleh hooks.ts — TIDAK langsung dipakai di komponen

import api from "@/lib/api";
import type { ProductFilters } from "./types";

/** GET /api/admin/products — List produk (admin dengan pagination) */
export async function getAdminProducts(filters: ProductFilters = {}) {
  try {
    const { page = 1, limit = 10, search = "", categoryId = "" } = filters;
    const res = await api.get("/api/admin/products", {
      params: { page, limit, search, categoryId },
    });
    return res.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal mengambil daftar produk");
  }
}

/** GET /api/admin/products/:id — Detail 1 produk (Admin) */
export async function getProductById(id: string) {
  try {
    const res = await api.get(`/api/admin/products/${id}`);
    return res.data.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal mengambil detail produk");
  }
}

/** GET /api/public/products/:id — Detail 1 produk (Public) */
export async function getPublicProductById(id: string) {
  try {
    const res = await api.get(`/api/public/products/${id}`);
    return res.data.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal mengambil detail produk");
  }
}

/** POST /api/admin/products — Buat produk baru */
export async function createProduct(formData: FormData) {
  try {
    const res = await api.post("/api/admin/products", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal membuat produk");
  }
}

/** PUT /api/admin/products/:id — Update produk */
export async function updateProduct(id: string, formData: FormData) {
  try {
    const res = await api.put(`/api/admin/products/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal memperbarui produk");
  }
}

/** DELETE /api/admin/products/:id — Soft delete produk */
export async function deleteProduct(id: string) {
  try {
    const res = await api.delete(`/api/admin/products/${id}`);
    return res.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal menghapus produk");
  }
}

/** DELETE /api/admin/products/:productId/images/:imageId — Hapus gambar */
export async function deleteProductImage(productId: string, imageId: string) {
  try {
    const res = await api.delete(`/api/admin/products/${productId}/images/${imageId}`);
    return res.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal menghapus gambar");
  }
}

/** POST /api/admin/products/:productId/images — Tambah gambar baru */
export async function addProductImage(productId: string, file: File) {
  try {
    const formData = new FormData();
    formData.append("image", file);
    const res = await api.post(`/api/admin/products/${productId}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal menambah gambar");
  }
}

/** GET /api/admin/stock/logs — Histori pergerakan stok universal */
export async function getStockLogs(params: { page?: number; limit?: number; search?: string; type?: string; from?: string; to?: string } = {}) {
  try {
    const res = await api.get("/api/admin/stock/logs", { params });
    return res.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal mengambil log stok");
  }
}

/** GET /api/admin/stock/logs/sku — Histori pergerakan stok level SKU */
export async function getSkuStockLogs(params: { page?: number; limit?: number; search?: string; type?: string; productId?: string; skuId?: string; from?: string; to?: string } = {}) {
  try {
    const res = await api.get("/api/admin/stock/logs/sku", { params });
    return res.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal mengambil log stok SKU");
  }
}

/** POST /api/admin/products/bulk-import — Bulk Import Produk */
export async function bulkImportProducts(products: any[]) {
  try {
    const res = await api.post("/api/admin/products/bulk-import", products);
    return res.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal mengimpor produk");
  }
}

/** GET /api/admin/promo/products — Get products for promo selection */
export async function getProductsForPromo(search?: string) {
  try {
    const res = await api.get("/api/admin/promo/products", { params: { search } });
    return res.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal mengambil daftar produk untuk promo");
  }
}

/** GET /api/admin/testimonials/products — Get products for testimonial selection */
export async function getProductsForTestimonials(search?: string) {
  try {
    const res = await api.get("/api/admin/testimonials/products", { params: { search } });
    return res.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal mengambil daftar produk untuk testimoni");
  }
}

/** GET /api/recommend/:id — Get related products based on KNN recommendation */
export async function getRelatedProducts(productId: string) {
  try {
    const res = await api.get(`/api/recommend/${productId}`);
    return res.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal mengambil rekomendasi produk serupa");
  }
}
