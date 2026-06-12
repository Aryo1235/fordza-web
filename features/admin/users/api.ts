import api from "@/lib/api";

/** GET /api/admin/users — Ambil daftar seluruh user (admin/kasir) */
export async function getUsers() {
  try {
    const res = await api.get("/api/admin/users");
    return res.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal mengambil daftar user");
  }
}

/** POST /api/admin/users — Buat user baru */
export async function createUser(data: any) {
  try {
    const res = await api.post("/api/admin/users", data);
    return res.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal membuat user");
  }
}

/** PATCH /api/admin/users/:id — Update data user atau PIN */
export async function updateUser(id: string, data: any) {
  try {
    const res = await api.patch(`/api/admin/users/${id}`, data);
    return res.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal memperbarui user");
  }
}

/** DELETE /api/admin/users/:id — Hapus user */
export async function deleteUser(id: string) {
  try {
    const res = await api.delete(`/api/admin/users/${id}`);
    return res.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal menghapus user");
  }
}

/** GET /api/admin/cashiers — Ambil daftar kasir aktif */
export async function getCashiers() {
  try {
    const res = await api.get("/api/admin/cashiers");
    return res.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal mengambil daftar kasir");
  }
}
