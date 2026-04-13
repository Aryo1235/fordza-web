import api from "@/lib/api";

/** 
 * GET /api/admin/transactions — Riwayat transaksi detail (Paginated)
 */
export async function getTransactionHistory(
  params: { 
    from?: string; 
    to?: string; 
    page?: number; 
    limit?: number; 
    search?: string;
  }
) {
  const res = await api.get("/api/admin/transactions", {
    params,
  });
  return res.data;
}

/** 
 * GET /api/[role]/transactions/[id] — Ambil detail 1 transaksi
 */
export async function getTransactionById(id: string, isAdmin = true) {
  const role = isAdmin ? "admin" : "kasir";
  const res = await api.get(`/api/${role}/transactions/${id}`);
  return res.data.data;
}
