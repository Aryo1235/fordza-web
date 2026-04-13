/**
 * Dashboard Repository
 * ─────────────────────────────────────────────
 * LAYER 1 — DATA ACCESS ONLY
 *
 * Mengambil statistik mentah dari berbagai tabel database.
 * Format/penyusunan data untuk tampilan dashboard
 * menjadi tanggung jawab DashboardService.
 */

import { prisma } from "@/lib/prisma";

export const DashboardRepository = {
  async getRawStats() {
    const [
      totalProducts,
      totalCategories,
      totalBanners,
      totalTestimonials,
      categoryStats,
    ] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.category.count({ where: { isActive: true } }),
      prisma.banner.count({ where: { isActive: true } }),
      prisma.testimonial.count({ where: { isActive: true } }),
      prisma.category.findMany({
        where: { isActive: true },
        select: {
          name: true,
          _count: { select: { products: true } },
        },
      }),
    ]);

    return {
      totalProducts,
      totalCategories,
      totalBanners,
      totalTestimonials,
      categoryStats,
    };
  },
};
