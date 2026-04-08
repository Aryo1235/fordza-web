// features/kasir/api.ts
import api from "@/lib/api";

export async function getKasirProducts(search = "", page = 1, limit = 12) {
  const res = await api.get("/api/kasir/products", { params: { search, page, limit } });
  return res.data;
}

export async function checkoutTransaction(data: { items: { productId: string; quantity: number }[]; amountPaid: number }) {
  const res = await api.post("/api/kasir/transactions", data);
  return res.data;
}

export async function getKasirTransactions(page = 1, limit = 20, search?: string, dateFrom?: string, dateTo?: string) {
  const res = await api.get("/api/kasir/transactions", { 
    params: { page, limit, search, dateFrom, dateTo } 
  });
  return res.data;
}

export async function checkInvoice(invoiceNo: string) {
  const res = await api.get("/api/kasir/transactions", { params: { search: invoiceNo, limit: 1 } });
  return res.data;
}
