import api from "@/lib/api";
import type { CashierShift, OpenShiftPayload, CloseShiftPayload } from "./types";

export async function getCurrentShift(): Promise<CashierShift | null> {
  const res = await api.get("/api/admin/shifts/current");
  return res.data?.data || null;
}

export async function openShift(payload: OpenShiftPayload): Promise<CashierShift> {
  const res = await api.post("/api/admin/shifts/open", payload);
  return res.data?.data;
}

export async function closeShift(payload: CloseShiftPayload): Promise<CashierShift> {
  const res = await api.post("/api/admin/shifts/close", payload);
  return res.data?.data;
}
