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
      lowStockSkus,
      latestTestimonials,
      latestStockLogs,
    ] = await Promise.all([
      prisma.product.count({ where: { isActive: true, deletedAt: null } }),
      prisma.category.count({ where: { isActive: true, deletedAt: null } }),
      prisma.banner.count({ where: { isActive: true, deletedAt: null } }),
      prisma.testimonial.count({ where: { isActive: true } }),
      prisma.category.findMany({
        where: { isActive: true, deletedAt: null },
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              products: {
                where: {
                  product: {
                    isActive: true,
                    deletedAt: null,
                  },
                },
              },
            },
          },
        },
      }),
      prisma.productSku.findMany({
        where: {
          stock: { lte: 5 },
          isActive: true,
          deletedAt: null,
          variant: {
            isActive: true,
            deletedAt: null,
            product: {
              isActive: true,
              deletedAt: null,
            },
          },
        },
        take: 5,
        orderBy: { stock: "asc" },
        include: {
          variant: {
            include: {
              product: {
                select: { name: true, productCode: true },
              },
            },
          },
        },
      }),
      prisma.testimonial.findMany({
        where: { isActive: true },
        take: 3,
        orderBy: { createdAt: "desc" },
        include: {
          product: {
            select: { name: true },
          },
        },
      }),
      prisma.skuStockLog.findMany({
        take: 4,
        orderBy: { createdAt: "desc" },
        include: {
          operator: {
            select: { name: true },
          },
          sku: {
            include: {
              variant: {
                include: {
                  product: {
                    select: { name: true },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      totalProducts,
      totalCategories,
      totalBanners,
      totalTestimonials,
      categoryStats,
      lowStockSkus,
      latestTestimonials,
      latestStockLogs,
    };
  },
};
