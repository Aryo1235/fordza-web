import api from "@/lib/api";
import { CheckoutPayload } from "./types";

export async function getKasirProducts(search = "", page = 1, limit = 12) {
  try {
    const res = await api.get("/api/kasir/products", { params: { search, page, limit } });
    return res.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal mengambil daftar produk kasir");
  }
}

export async function checkoutTransaction(data: CheckoutPayload) {
  try {
    const res = await api.post("/api/kasir/transactions", data);
    return res.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal memproses transaksi");
  }
}

export async function getKasirTransactions(page = 1, limit = 20, search?: string, dateFrom?: string, dateTo?: string, kasirId?: string) {
  try {
    const res = await api.get("/api/kasir/transactions", { 
      params: { page, limit, search, dateFrom, dateTo, kasirId } 
    });
    return res.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal mengambil histori transaksi");
  }
}

export async function checkInvoice(invoiceNo: string) {
  try {
    const res = await api.get("/api/kasir/transactions", { params: { search: invoiceNo, limit: 1 } });
    return res.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal mengecek invoice");
  }
}

export async function voidKasirTransaction(id: string, data: { pin: string; cancelReason: string }) {
  try {
    const res = await api.patch(`/api/kasir/transactions/${id}`, data);
    return res.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal membatalkan transaksi");
  }
}
