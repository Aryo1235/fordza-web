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
export async function createVariant(productId: string, payload: CreateVariantPayload) {
  // Gunakan JSON daripada FormData karena images sekarang berupa objek URL/Key (sudah diupload sebelumnya)
  // dan ini juga mendukung nested objects (skus) dengan lebih bersih.
  const res = await api.post(`/api/admin/products/${productId}/variants`, payload);
  return res.data.data;
}

/** PATCH /api/admin/variants/:variantId — Update data varian */
export async function updateVariant(variantId: string, payload: UpdateVariantPayload) {
  const res = await api.patch(`/api/admin/variants/${variantId}`, payload);
  return res.data.data;
}

/** DELETE /api/admin/variants/:variantId — Hapus varian (cascade ke SKU & gambar) */
export async function deleteVariant(variantId: string) {
  const res = await api.delete(`/api/admin/variants/${variantId}`);
  return res.data;
}

// ─── SKU (UKURAN) ────────────────────────────────────────────

/** POST /api/admin/variants/:variantId/skus — Tambah ukuran ke varian */
export async function createSku(variantId: string, payload: CreateSkuPayload) {
  const res = await api.post(`/api/admin/variants/${variantId}/skus`, payload);
  return res.data.data;
}

/** PATCH /api/admin/skus/:skuId — Update stok / harga override 1 SKU */
export async function updateSku(skuId: string, payload: UpdateSkuPayload) {
  const res = await api.patch(`/api/admin/skus/${skuId}`, payload);
  return res.data.data;
}

/** DELETE /api/admin/skus/:skuId — Hapus 1 SKU */
export async function deleteSku(skuId: string) {
  const res = await api.delete(`/api/admin/skus/${skuId}`);
  return res.data;
}
