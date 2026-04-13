import api from "@/lib/api";

export async function getDashboardStats() {
  const res = await api.get("/api/admin/dashboard");
  return res.data?.data;
}
