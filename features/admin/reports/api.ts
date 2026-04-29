import api from "@/lib/api";

/**
 * GET /api/admin/reports — Ringkasan penjualan
 * @param from - Format YYYY-MM-DD
 * @param to - Format YYYY-MM-DD
 */
export async function getSalesReportSummary(
  from?: string,
  to?: string,
  filters?: {
    search?: string;
    sortBy?: "quantity" | "revenue" | "name";
    minQuantity?: number;
  },
) {
  const res = await api.get("/api/admin/reports", {
    params: {
      from,
      to,
    },
  });
  return res.data.data;
}

export async function getSalesReportItems(
  from?: string,
  to?: string,
  filters?: {
    search?: string;
    sortBy?: "quantity" | "revenue" | "name";
    minQuantity?: number;
    page?: number;
    limit?: number;
  },
) {
  const res = await api.get("/api/admin/reports/items", {
    params: {
      from,
      to,
      search: filters?.search,
      sortBy: filters?.sortBy,
      minQuantity: filters?.minQuantity,
      page: filters?.page,
      limit: filters?.limit,
    },
  });
  return res.data.data;
}

export const getSalesReport = getSalesReportSummary;
