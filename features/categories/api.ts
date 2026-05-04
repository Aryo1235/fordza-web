// features/categories/api.ts
import api from "@/lib/api";

export async function getCategoriesAdmin(page = 1, limit = 10) {
  const res = await api.get("/api/admin/categories", {
    params: { page, limit },
  });
  return res.data;
}

export async function getPublicCategories(page = 1, limit = 12) {
  const res = await api.get("/api/public/categories", {
    params: { page, limit },
  });
  return res.data;
}

export async function getCategoryById(id: string) {
  const res = await api.get(`/api/admin/categories/${id}`);
  return res.data.data;
}

export async function createCategory(formData: FormData) {
  const res = await api.post("/api/admin/categories", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function updateCategory(id: string, formData: FormData) {
  const res = await api.put(`/api/admin/categories/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function deleteCategory(id: string) {
  const res = await api.delete(`/api/admin/categories/${id}`);
  return res.data;
}
