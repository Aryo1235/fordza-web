// features/categories/api.ts
import api from "@/lib/api";

export async function getCategoriesAdmin(page = 1, limit = 10) {
  try {
    const res = await api.get("/api/admin/categories", {
      params: { page, limit },
    });
    return res.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal mengambil daftar kategori");
  }
}

export async function getPublicCategories(page = 1, limit = 12) {
  try {
    const res = await api.get("/api/public/categories", {
      params: { page, limit },
    });
    return res.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal mengambil daftar kategori publik");
  }
}

export async function getCategoryById(id: string) {
  try {
    const res = await api.get(`/api/admin/categories/${id}`);
    return res.data.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal mengambil detail kategori");
  }
}

export async function createCategory(formData: FormData) {
  try {
    const res = await api.post("/api/admin/categories", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (error: any) {
    const err = new Error(error?.response?.data?.message || "Gagal membuat kategori");
    (err as any).response = error?.response;
    throw err;
  }
}

export async function updateCategory(id: string, formData: FormData) {
  try {
    const res = await api.put(`/api/admin/categories/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (error: any) {
    const err = new Error(error?.response?.data?.message || "Gagal memperbarui kategori");
    (err as any).response = error?.response;
    throw err;
  }
}

export async function deleteCategory(id: string) {
  try {
    const res = await api.delete(`/api/admin/categories/${id}`);
    return res.data;
  } catch (error: any) {
    const err = new Error(error?.response?.data?.message || "Gagal menghapus kategori");
    (err as any).response = error?.response;
    throw err;
  }
}

/** GET /api/admin/promo/categories — Get categories for promo selection */
export async function getCategoriesForPromo() {
  try {
    const res = await api.get("/api/admin/promo/categories");
    return res.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal mengambil daftar kategori untuk promo");
  }
}
