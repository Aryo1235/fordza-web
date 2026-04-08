import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getKasirProducts, checkoutTransaction, getKasirTransactions, checkInvoice } from "./api";

export const kasirKeys = {
  products: (search: string) => ["kasir-products", search] as const,
  transactions: (page: number, search?: string, dateFrom?: string, dateTo?: string) => 
    ["kasir-transactions", page, search, dateFrom, dateTo] as const,
  invoice: (invoiceNo: string) => ["kasir-invoice", invoiceNo] as const,
};

export function useKasirProducts(search = "") {
  return useInfiniteQuery({
    queryKey: kasirKeys.products(search),
    queryFn: ({ pageParam = 1 }) => getKasirProducts(search, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
  });
}

export function useKasirTransactions(page = 1, limit = 20, search?: string, dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: kasirKeys.transactions(page, search, dateFrom, dateTo),
    queryFn: () => getKasirTransactions(page, limit, search, dateFrom, dateTo),
    placeholderData: (prev) => prev,
  });
}

export function useCheckInvoice(invoiceNo: string) {
  return useQuery({
    queryKey: kasirKeys.invoice(invoiceNo),
    queryFn: () => checkInvoice(invoiceNo),
    enabled: false,
    retry: false, // Don't keep retrying if invoice doesn't exist
  });
}

export function useCheckout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: checkoutTransaction,
    onSuccess: () => {
      // Invalidate products to refresh stock (targeting all searches)
      queryClient.invalidateQueries({ queryKey: ["kasir-products"] });
      // Invalidate transactions list
      queryClient.invalidateQueries({ queryKey: ["kasir-transactions"] });
    },
  });
}
