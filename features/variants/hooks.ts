"use client";

// features/variants/hooks.ts
// React Query hooks untuk fitur Varian & SKU
// Komponen cukup import dari sini — tidak perlu tahu URL API-nya

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getVariantsByProduct,
  createVariant,
  updateVariant,
  deleteVariant,
  createSku,
  updateSku,
  deleteSku,
  searchVariantsAdmin,
} from "./api";
import type {
  CreateVariantPayload,
  UpdateVariantPayload,
  CreateSkuPayload,
  UpdateSkuPayload,
} from "./types";

// Query Keys — terpusat agar mudah di-invalidate
export const variantKeys = {
  all: ["variants"] as const,
  byProduct: (productId: string) => ["variants", "product", productId] as const,
};

// ─── VARIANT HOOKS ─────────────────────────────────────────

/** List semua varian milik 1 produk */
export function useVariants(productId: string) {
  return useQuery({
    queryKey: variantKeys.byProduct(productId),
    queryFn: () => getVariantsByProduct(productId),
    enabled: !!productId,
  });
}

/** Buat varian baru pada sebuah produk */
export function useCreateVariant(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateVariantPayload) => createVariant(productId, payload),
    onSuccess: () => {
      // Refresh list varian & data produk (cached stock berubah)
      queryClient.invalidateQueries({ queryKey: variantKeys.byProduct(productId) });
      queryClient.invalidateQueries({ queryKey: ["products", "detail", productId] });
    },
  });
}

/** Update data varian (warna, harga dasar, diskon, dll) */
export function useUpdateVariant(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ variantId, payload }: { variantId: string; payload: UpdateVariantPayload }) =>
      updateVariant(variantId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: variantKeys.byProduct(productId) });
    },
  });
}

/** Hapus varian (cascade ke semua SKU & gambar varian) */
export function useDeleteVariant(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variantId: string) => deleteVariant(variantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: variantKeys.byProduct(productId) });
      queryClient.invalidateQueries({ queryKey: ["products", "detail", productId] });
    },
  });
}

// ─── SKU HOOKS ─────────────────────────────────────────────

/** Tambah ukuran baru ke dalam sebuah varian */
export function useCreateSku(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ variantId, payload }: { variantId: string; payload: CreateSkuPayload }) =>
      createSku(variantId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: variantKeys.byProduct(productId) });
      // Stok produk induk juga berubah
      queryClient.invalidateQueries({ queryKey: ["products", "detail", productId] });
    },
  });
}

/** Update stok atau harga bigsize 1 SKU */
export function useUpdateSku(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ skuId, payload }: { skuId: string; payload: UpdateSkuPayload }) =>
      updateSku(skuId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: variantKeys.byProduct(productId) });
      queryClient.invalidateQueries({ queryKey: ["products", "detail", productId] });
    },
  });
}

/** Hapus 1 SKU dari varian */
export function useDeleteSku(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (skuId: string) => deleteSku(skuId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: variantKeys.byProduct(productId) });
      queryClient.invalidateQueries({ queryKey: ["products", "detail", productId] });
    },
  });
}

/** Search varian untuk dropdown admin */
export function useVariantsAdminSearch(search: string = "", limit: number = 20) {
  return useQuery({
    queryKey: ["variants", "admin-search", search, limit] as const,
    queryFn: () => searchVariantsAdmin(search, limit),
  });
}
