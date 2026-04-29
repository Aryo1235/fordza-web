"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bulkUpdateStock } from "./api";

/** Hook untuk melakukan pembaruan stok massal (Stock Opname) */
export function useBulkUpdateStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkUpdateStock,
    onSuccess: () => {
      // Invalidate products list to refresh stock prices/counts
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["kasir-products"] });
    },
  });
}
