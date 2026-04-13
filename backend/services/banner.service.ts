/**
 * Banner Service
 * ─────────────────────────────────────────────
 * LAYER 2 — BUSINESS LOGIC
 *
 * Contoh kasus bisnis:
 * Sebelum menghapus banner, Service bisa validasi
 * "apakah banner ini sedang aktif di halaman utama?"
 * dan menolaknya. Repository tidak tahu urusan ini.
 */

import { BannerRepository } from "@/backend/repositories/banner.repo";

export const BannerService = {
  async getAll(page: number = 1, limit: number = 10) {
    return await BannerRepository.getAll(page, limit);
  },

  async create(data: {
    title?: string;
    imageUrl: string;
    imageKey: string;
    linkUrl?: string;
  }) {
    // Jika besok ada aturan bisnis "Maksimal 5 banner aktif",
    // logika pengecekan jumlah banner akan ditambahkan di SINI, bukan di Repo.
    return await BannerRepository.create(data);
  },

  async getById(id: string) {
    return await BannerRepository.getById(id);
  },

  async update(id: string, data: any) {
    return await BannerRepository.update(id, data);
  },

  async delete(id: string) {
    return await BannerRepository.delete(id);
  },
};
