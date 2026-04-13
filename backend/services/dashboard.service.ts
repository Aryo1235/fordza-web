/**
 * Dashboard Service
 * ─────────────────────────────────────────────
 * LAYER 2 — BUSINESS LOGIC
 *
 * INILAH contoh paling jelas perbedaan Service vs Repository:
 *
 * Repository (DashboardRepository.getRawStats) → hanya ambil angka mentah dari DB.
 * Service (DashboardService.getStats) → mengolah angka mentah itu
 * menjadi format "chartData" yang siap langsung ditampilkan di UI Admin.
 *
 * Transformasi data (map, filter, format) = tanggung jawab Service.
 */

import { DashboardRepository } from "@/backend/repositories/dashboard.repo";

export const DashboardService = {
  async getStats() {
    // Minta data mentah dari Repository
    const raw = await DashboardRepository.getRawStats();

    // 🧠 LOGIKA BISNIS: Transformasi data mentah → format siap tampil di chart
    const chartData = raw.categoryStats.map((c) => ({
      name: c.name,
      total: c._count.products,
    }));

    return {
      totalProducts: raw.totalProducts,
      totalCategories: raw.totalCategories,
      totalBanners: raw.totalBanners,
      totalTestimonials: raw.totalTestimonials,
      chartData, // ← hasil olahan Service, bukan dari Repo mentah
    };
  },
};
