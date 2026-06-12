import api from "@/lib/api";

/** PATCH /api/admin/stock/opname — Update stok massal (Stock Opname) */
export async function bulkUpdateStock(items: { id: string; stock: number }[]) {
  const res = await api.patch("/api/admin/stock/opname", { items });
  return res.data;
}

interface StockOpnameFilters {
  page?: number;
  limit?: number;
  search?: string;
}

/** GET /api/admin/stock/opname — Ambil daftar produk untuk stock opname */
export async function getStockOpnameProducts(filters?: StockOpnameFilters) {
  const res = await api.get("/api/admin/stock/opname", { params: filters });
  return res.data;
}

