"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bulkUpdateStock, getStockOpnameProducts } from "./api";

/** Hook untuk mengambil daftar produk khusus Stock Opname (hanya yang aktif) */
export function useStockOpnameProducts(
  filters: { page?: number; limit?: number; search?: string } = {},
) {
  return useQuery({
    queryKey: ["stock-opname", filters],
    queryFn: () => getStockOpnameProducts(filters),
    placeholderData: (prev) => prev,
  });
}

/** Hook untuk melakukan pembaruan stok massal (Stock Opname) */
export function useBulkUpdateStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkUpdateStock,
    onSuccess: () => {
      // Invalidate products, stock-opname, and kasir lists to refresh stock counts
      queryClient.invalidateQueries({ queryKey: ["stock-opname"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["kasir-products"] });
    },
  });
}
