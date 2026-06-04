import api from "@/lib/api";
import type { SizeTemplateCreateInput } from "./types";

export async function getAdminSizeTemplates() {
  try {
    const res = await api.get("/api/admin/size-templates");
    return res.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal mengambil daftar template ukuran");
  }
}

export async function createSizeTemplate(data: SizeTemplateCreateInput) {
  try {
    const res = await api.post("/api/admin/size-templates", data);
    return res.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal membuat template ukuran");
  }
}

export async function updateSizeTemplate(id: string, data: SizeTemplateCreateInput) {
  try {
    const res = await api.put(`/api/admin/size-templates/${id}`, data);
    return res.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal memperbarui template ukuran");
  }
}

export async function deleteSizeTemplate(id: string) {
  try {
    const res = await api.delete(`/api/admin/size-templates/${id}`);
    return res.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal menghapus template ukuran");
  }
}
