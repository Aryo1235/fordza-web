// features/promo/api.ts
import api from "@/lib/api";
import { CreatePromoInput } from "./types";

export async function getPromosAdmin() {
  const res = await api.get("/api/admin/promo");
  // Bapak pakai pola { success, data } jadi kita ambil res.data.data
  return res.data.data || [];
}

export async function getPromoById(id: string) {
  const res = await api.get(`/api/admin/promo/${id}`);
  return res.data.data;
}

export async function createPromo(data: CreatePromoInput) {
  const res = await api.post("/api/admin/promo", data);
  return res.data;
}

export async function updatePromo(id: string, data: Partial<CreatePromoInput>) {
  const res = await api.patch(`/api/admin/promo/${id}`, data);
  return res.data;
}

export async function deletePromo(id: string) {
  const res = await api.delete(`/api/admin/promo/${id}`);
  return res.data;
}
