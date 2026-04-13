/**
 * Banner Repository
 * ─────────────────────────────────────────────
 * LAYER 1 — DATA ACCESS ONLY
 *
 * Tugasnya murni: berbicara dengan tabel "Banner"
 * di PostgreSQL via Prisma. TIDAK ada logic bisnis di sini.
 * Contoh: tidak ada validasi "apakah gambar sudah ada?" → itu urusan Service.
 */

import { prisma } from "@/lib/prisma";

export const BannerRepository = {
  async getAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [banners, totalItems] = await Promise.all([
      prisma.banner.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.banner.count(),
    ]);

    return {
      banners,
      meta: {
        totalItems,
        totalPage: Math.ceil(totalItems / limit),
        currentPage: page,
        limit,
      },
    };
  },

  async create(data: {
    title?: string;
    imageUrl: string;
    imageKey: string;
    linkUrl?: string;
  }) {
    return await prisma.banner.create({ data });
  },

  async getById(id: string) {
    return await prisma.banner.findUnique({ where: { id } });
  },

  async update(id: string, data: any) {
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.linkUrl !== undefined) updateData.linkUrl = data.linkUrl;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.imageKey !== undefined) updateData.imageKey = data.imageKey;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return await prisma.banner.update({ where: { id }, data: updateData });
  },

  async delete(id: string) {
    return await prisma.banner.delete({ where: { id } });
  },
};
