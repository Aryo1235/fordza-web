"use client";

import { useQuery } from "@tanstack/react-query";
import { getTransactionHistory, getTransactionById } from "./api";
import { format } from "date-fns";

export const transactionKeys = {
  history: (filters: { from: string; to: string; page: number; limit: number; search: string }) => 
    ["admin", "transactions", filters] as const,
};

/** Hook untuk mengambil data riwayat transaksi (Audit Log) */
export function useTransactions(dateFrom: Date, dateTo: Date, page = 1, limit = 10, search = "") {
  const from = format(dateFrom, "yyyy-MM-dd");
  const to = format(dateTo, "yyyy-MM-dd");

  return useQuery({
    queryKey: transactionKeys.history({ from, to, page, limit, search }),
    queryFn: () => getTransactionHistory({ from, to, page, limit, search }),
    placeholderData: (prev) => prev,
  });
}

/** Hook untuk mengambil detail 1 transaksi (lengkap dengan items) */
export function useTransactionDetail(id: string, isAdmin = true) {
  return useQuery({
    queryKey: ["transactions", "detail", id],
    queryFn: () => getTransactionById(id, isAdmin),
    enabled: !!id, // Hanya jalan jika ID ada
  });
}
