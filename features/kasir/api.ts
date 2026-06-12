import api from "@/lib/api";
import { CheckoutPayload } from "./types";

/** Helper to extract trace ID and create rich error objects */
function createError(error: any, fallbackMessage: string): Error {
  const message = error?.response?.data?.message || fallbackMessage;
  const customError = new Error(message) as any;
  customError.traceId = error?.response?.data?.traceId || error?.response?.headers?.["x-request-id"];
  customError.code = error?.response?.data?.code;
  return customError;
}

export async function getKasirProducts(search = "", page = 1, limit = 12) {
  try {
    const res = await api.get("/api/kasir/products", { params: { search, page, limit } });
    return res.data;
  } catch (error: any) {
    throw createError(error, "Gagal mengambil daftar produk kasir");
  }
}

/** GET /api/kasir/products/stock-check — Data ringan khusus dialog Cek Stok Cepat */
export async function getKasirStockCheck(search = "", page = 1, limit = 20) {
  try {
    const res = await api.get("/api/kasir/products/stock-check", { params: { search, page, limit } });
    return res.data;
  } catch (error: any) {
    throw createError(error, "Gagal mengambil data stok");
  }
}

export async function checkoutTransaction(data: CheckoutPayload) {
  try {
    const res = await api.post("/api/kasir/transactions", data);
    return res.data;
  } catch (error: any) {
    throw createError(error, "Gagal memproses transaksi");
  }
}

export async function getKasirTransactions(page = 1, limit = 20, search?: string, dateFrom?: string, dateTo?: string, kasirId?: string) {
  try {
    const res = await api.get("/api/kasir/transactions", { 
      params: { page, limit, search, dateFrom, dateTo, kasirId } 
    });
    return res.data;
  } catch (error: any) {
    throw createError(error, "Gagal mengambil histori transaksi");
  }
}

export async function checkInvoice(invoiceNo: string) {
  try {
    const res = await api.get("/api/kasir/transactions", { params: { search: invoiceNo, limit: 1 } });
    return res.data;
  } catch (error: any) {
    throw createError(error, "Gagal mengecek invoice");
  }
}

export async function voidKasirTransaction(id: string, data: { pin: string; cancelReason: string }) {
  try {
    const res = await api.patch(`/api/kasir/transactions/${id}`, data);
    return res.data;
  } catch (error: any) {
    throw createError(error, "Gagal membatalkan transaksi");
  }
}
