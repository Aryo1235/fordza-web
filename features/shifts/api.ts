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
