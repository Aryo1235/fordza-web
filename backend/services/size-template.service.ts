/**
 * SizeTemplate Service
 * ─────────────────────────────────────────────
 * LAYER 2 — BUSINESS LOGIC
 *
 * Contoh kasus bisnis:
 * Sebelum menghapus template ukuran, Service bisa mengecek
 * "apakah template ini dipakai oleh produk yang masih aktif?"
 * Jika iya → tolak penghapusan. Repository tidak tahu hal ini.
 */

import { SizeTemplateRepository } from "@/backend/repositories/size-template.repo";

export const SizeTemplateService = {
  async getAll() {
    return await SizeTemplateRepository.getAll();
  },

  async create(data: any) {
    // Jika besok ada validasi "nama template tidak boleh duplikat",
    // pengecekannya ditambahkan DI SINI sebelum memanggil Repo.
    return await SizeTemplateRepository.create(data);
  },

  async getById(id: string) {
    return await SizeTemplateRepository.getById(id);
  },

  async update(id: string, data: any) {
    return await SizeTemplateRepository.update(id, data);
  },

  async delete(id: string) {
    return await SizeTemplateRepository.delete(id);
  },
};
