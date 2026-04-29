import api from "@/lib/api";
import type { SizeTemplateCreateInput } from "./types";

export async function getAdminSizeTemplates() {
  const res = await api.get("/api/admin/size-templates");
  return res.data;
}

export async function createSizeTemplate(data: SizeTemplateCreateInput) {
  const res = await api.post("/api/admin/size-templates", data);
  return res.data;
}

export async function updateSizeTemplate(id: string, data: SizeTemplateCreateInput) {
  const res = await api.put(`/api/admin/size-templates/${id}`, data);
  return res.data;
}

export async function deleteSizeTemplate(id: string) {
  const res = await api.delete(`/api/admin/size-templates/${id}`);
  return res.data;
}
