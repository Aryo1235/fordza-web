import api from "@/lib/api";

/** PATCH /api/admin/products/bulk-stock — Update stok massal (Stock Opname) */
export async function bulkUpdateStock(items: { id: string; stock: number }[]) {
  const res = await api.patch("/api/admin/products/bulk-stock", { items });
  return res.data;
}
