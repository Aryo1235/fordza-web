"use client";

import { useQuery } from "@tanstack/react-query";
import { getSalesReportItems, getSalesReportSummary } from "./api";
import { format } from "date-fns";

export const reportKeys = {
  summary: (from: string, to: string) =>
    ["admin", "reports", "summary", from, to] as const,
  items: (
    from: string,
    to: string,
    search: string,
    sortBy: "quantity" | "revenue" | "name",
    minQuantity: number | undefined,
    page: number,
    limit: number,
  ) =>
    [
      "admin",
      "reports",
      "items",
      from,
      to,
      search,
      sortBy,
      minQuantity ?? "",
      page,
      limit,
    ] as const,
};

/** Hook untuk mengambil ringkasan penjualan */
export function useSalesReportSummary(
  dateFrom: Date,
  dateTo: Date,
  filters: {
    search?: string;
    sortBy?: "quantity" | "revenue" | "name";
    minQuantity?: number;
  } = {},
) {
  const from = format(dateFrom, "yyyy-MM-dd");
  const to = format(dateTo, "yyyy-MM-dd");

  return useQuery({
    queryKey: reportKeys.summary(from, to),
    queryFn: () => getSalesReportSummary(from, to),
    staleTime: 60_000,
  });
}

/** Hook untuk mengambil data tabel penjualan yang dipaginasi */
export function useSalesReportItems(
  dateFrom: Date,
  dateTo: Date,
  filters: {
    search?: string;
    sortBy?: "quantity" | "revenue" | "name";
    minQuantity?: number;
    page?: number;
    limit?: number;
  } = {},
) {
  const from = format(dateFrom, "yyyy-MM-dd");
  const to = format(dateTo, "yyyy-MM-dd");

  return useQuery({
    queryKey: reportKeys.items(
      from,
      to,
      filters.search || "",
      filters.sortBy || "quantity",
      filters.minQuantity,
      filters.page || 1,
      filters.limit || 10,
    ),
    queryFn: () => getSalesReportItems(from, to, filters),
    staleTime: 30_000,
  });
}

export const useSalesReport = useSalesReportSummary;
