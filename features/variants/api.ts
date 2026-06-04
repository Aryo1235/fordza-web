// features/variants/api.ts
// Semua fetch function yang berkomunikasi dengan /api/admin/variants & /api/admin/skus
// Digunakan oleh hooks.ts — TIDAK langsung dipakai di komponen

import api from "@/lib/api";
import type {
  CreateVariantPayload,
  UpdateVariantPayload,
  CreateSkuPayload,
  UpdateSkuPayload,
} from "./types";

// ─── VARIANT ────────────────────────────────────────────────

/** GET /api/admin/products/:productId/variants — List semua varian produk */
export async function getVariantsByProduct(productId: string) {
  const res = await api.get(`/api/admin/products/${productId}/variants`);
  return res.data.data;
}

/** POST /api/admin/products/:productId/variants — Buat varian baru */
export async function createVariant(
  productId: string,
  payload: CreateVariantPayload,
) {
  try {
    // Gunakan JSON daripada FormData karena images sekarang berupa objek URL/Key (sudah diupload sebelumnya)
    // dan ini juga mendukung nested objects (skus) dengan lebih bersih.
    const res = await api.post(
      `/api/admin/products/${productId}/variants`,
      payload,
    );
    return res.data.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Gagal membuat varian";
    throw new Error(message);
  }
}

/** PATCH /api/admin/variants/:variantId — Update data varian */
export async function updateVariant(
  variantId: string,
  payload: UpdateVariantPayload,
) {
  try {
    const res = await api.patch(`/api/admin/variants/${variantId}`, payload);
    return res.data.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Gagal memperbarui varian";
    throw new Error(message);
  }
}

/** DELETE /api/admin/variants/:variantId — Hapus varian (cascade ke SKU & gambar) */
export async function deleteVariant(variantId: string) {
  try {
    const res = await api.delete(`/api/admin/variants/${variantId}`);
    return res.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Gagal menghapus varian";
    throw new Error(message);
  }
}

// ─── SKU (UKURAN) ────────────────────────────────────────────

/** POST /api/admin/variants/:variantId/skus — Tambah ukuran ke varian */
export async function createSku(variantId: string, payload: CreateSkuPayload) {
  try {
    const res = await api.post(`/api/admin/variants/${variantId}/skus`, payload);
    return res.data.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Gagal menambah ukuran";
    throw new Error(message);
  }
}

/** PATCH /api/admin/skus/:skuId — Update stok / harga override 1 SKU */
export async function updateSku(skuId: string, payload: UpdateSkuPayload) {
  try {
    const res = await api.patch(`/api/admin/skus/${skuId}`, payload);
    return res.data.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Gagal memperbarui stok ukuran";
    throw new Error(message);
  }
}

/** DELETE /api/admin/skus/:skuId — Hapus 1 SKU */
export async function deleteSku(skuId: string) {
  try {
    const res = await api.delete(`/api/admin/skus/${skuId}`);
    return res.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Gagal menghapus ukuran";
    throw new Error(message);
  }
}

/** GET /api/admin/variants — Search varian untuk dropdown admin */
export async function searchVariantsAdmin(
  search: string = "",
  limit: number = 20,
) {
  const res = await api.get(`/api/admin/variants`, {
    params: { search, limit },
  });
  return res.data;
}
