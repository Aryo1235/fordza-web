"use client";

// features/products/hooks.ts
// React Query hooks untuk fitur produk
// Komponen cukup import dari sini — tidak perlu tahu URL API-nya

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProductImage,
  addProductImage,
} from "./api";
import type { ProductFilters } from "./types";

// Query Keys — terpusat agar mudah di-invalidate
export const productKeys = {
  all: ["products"] as const,
  adminList: (filters: ProductFilters) => ["admin-products", filters] as const,
  detail: (id: string) => ["product", id] as const,
};

/** List produk untuk halaman Admin (dengan pagination & filter) */
export function useProductsAdmin(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: productKeys.adminList(filters),
    queryFn: () => getAdminProducts(filters),
    placeholderData: (prev) => prev, // Gak flicker saat ganti halaman
  });
}

/** Detail 1 produk berdasarkan ID */
export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => getProductById(id),
    enabled: !!id,
  });
}

/** Buat produk baru */
export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => createProduct(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

/** Update produk yang sudah ada */
export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      updateProduct(id, formData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) });
    },
  });
}

/** Soft delete produk */
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

/** Hapus 1 gambar dari produk */
export function useDeleteProductImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, imageId }: { productId: string; imageId: string }) =>
      deleteProductImage(productId, imageId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.productId) });
    },
  });
}

/** Tambah gambar baru ke produk */
export function useAddProductImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, file }: { productId: string; file: File }) =>
      addProductImage(productId, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.productId) });
    },
  });
}
