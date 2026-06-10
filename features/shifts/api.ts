import api from "@/lib/api";
import type { CashierShift, OpenShiftPayload, CloseShiftPayload } from "./types";

export async function getCurrentShift(): Promise<CashierShift | null> {
  try {
    const res = await api.get("/api/admin/shifts/current");
    return res.data?.data || null;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal mengambil data shift");
  }
}

export async function openShift(payload: OpenShiftPayload): Promise<CashierShift> {
  try {
    const res = await api.post("/api/admin/shifts/open", payload);
    return res.data?.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal membuka shift");
  }
}

export async function closeShift(payload: CloseShiftPayload): Promise<CashierShift> {
  try {
    const res = await api.post("/api/admin/shifts/close", payload);
    return res.data?.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal menutup shift");
  }
}

export async function getShiftsAdmin(filters: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  kasirId?: string;
}): Promise<{ data: CashierShift[]; meta: any }> {
  try {
    const { page, limit, search, status, kasirId } = filters;
    const res = await api.get("/api/admin/shifts", {
      params: { page, limit, search, status, kasirId },
    });
    return res.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal mengambil daftar shift");
  }
}

export async function getShiftDetailAdmin(id: string): Promise<CashierShift & { transactions: any[] }> {
  try {
    const res = await api.get(`/api/admin/shifts/${id}`);
    return res.data?.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal mengambil detail shift");
  }
}

export async function getShiftsStatsAdmin(): Promise<{
  totalActiveShifts: number;
  totalClosedShifts: number;
  totalStartingCash: number;
  totalActualCash: number;
  totalMinusCases: number;
  totalMinusAmount: number;
}> {
  try {
    const res = await api.get("/api/admin/shifts/stats");
    return res.data?.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal mengambil statistik laci");
  }
}

export async function getCashiersAdmin(): Promise<Array<{ id: string; name: string | null; username: string }>> {
  try {
    const res = await api.get("/api/admin/cashiers");
    return res.data?.data || [];
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal mengambil daftar kasir");
  }
}
