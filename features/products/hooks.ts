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
  getStockLogs,
  getSkuStockLogs,
  getPublicProductById,
} from "./api";
import type { ProductFilters, Product } from "./types";

// Query Keys — terpusat agar mudah di-invalidate
export const productKeys = {
  all: ["products"] as const,
  adminList: (filters: ProductFilters) => ["products", "admin-list", filters] as const,
  detail: (id: string) => ["products", "detail", id] as const,
  publicDetail: (id: string) => ["products", "public-detail", id] as const,
  stockLogs: (params: any) => ["products", "stock-logs", params.detail, params] as const,
};

/** List produk untuk halaman Admin (dengan pagination & filter) */
export function useProductsAdmin(filters: ProductFilters = {}, enabled: boolean = true) {
  return useQuery({
    queryKey: productKeys.adminList(filters),
    queryFn: () => getAdminProducts(filters),
    placeholderData: (prev) => prev, 
    enabled,
  });
}

/** Hook untuk mengambil log pergerakan stok universal */
export function useStockLogs(
  params: { page?: number; limit?: number; search?: string; type?: string } = {},
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: productKeys.stockLogs({ ...params, detail: "universal" }),
    queryFn: () => getStockLogs(params),
    placeholderData: (prev) => prev,
    ...options,
  });
}

/** Hook untuk mengambil log pergerakan stok level SKU (detail) */
export function useSkuStockLogs(
  params: { page?: number; limit?: number; search?: string; type?: string; productId?: string; skuId?: string } = {},
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: productKeys.stockLogs({ ...params, detail: "sku" }),
    queryFn: () => getSkuStockLogs(params),
    placeholderData: (prev) => prev,
    ...options,
  });
}

/** Detail 1 produk berdasarkan ID (Admin) */
export function useProduct(id: string) {
  return useQuery<Product>({
    queryKey: productKeys.detail(id),
    queryFn: () => getProductById(id),
    enabled: !!id,
  });
}

/** Detail 1 produk untuk halaman publik (dengan cache 5 menit) */
export function usePublicProduct(id: string) {
  return useQuery<Product>({
    queryKey: productKeys.publicDetail(id),
    queryFn: () => getPublicProductById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 Menit data dianggap segar
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
    onSuccess: () => {
      // Hanya invalidate list — tidak perlu invalidate detail
      // karena halaman langsung redirect setelah update
      queryClient.invalidateQueries({ queryKey: productKeys.all });
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
