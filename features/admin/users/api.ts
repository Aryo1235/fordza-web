import api from "@/lib/api";

/** GET /api/admin/users — Ambil daftar seluruh user (admin/kasir) */
export async function getUsers() {
  const res = await api.get("/api/admin/users");
  return res.data;
}

/** POST /api/admin/users — Buat user baru */
export async function createUser(data: any) {
  const res = await api.post("/api/admin/users", data);
  return res.data;
}

/** PATCH /api/admin/users/:id — Update data user atau PIN */
export async function updateUser(id: string, data: any) {
  const res = await api.patch(`/api/admin/users/${id}`, data);
  return res.data;
}

/** DELETE /api/admin/users/:id — Hapus user */
export async function deleteUser(id: string) {
  const res = await api.delete(`/api/admin/users/${id}`);
  return res.data;
}

/** GET /api/admin/cashiers — Ambil daftar kasir aktif */
export async function getCashiers() {
  const res = await api.get("/api/admin/cashiers");
  return res.data;
}
