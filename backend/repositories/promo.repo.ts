/**
 * Promo Repository
 * ─────────────────────────────────────────────
 * LAYER 1 — DATA ACCESS ONLY (DAL)
 * 
 * Murni hanya kueri Prisma. Tidak ada logic bisnis atau 
 * transformasi data di sini.
 */

import { prisma } from "@/lib/prisma";

export const PromoRepository = {
  async getAll() {
    return await prisma.promo.findMany({
      orderBy: { createdAt: "desc" },
    });
  },

  async getActive() {
    const now = new Date();
    return await prisma.promo.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async create(data: any) {
    return await prisma.promo.create({
      data,
    });
  },

  async update(id: string, data: any) {
    return await prisma.promo.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    return await prisma.promo.delete({
      where: { id },
    });
  },

  async getById(id: string) {
    return await prisma.promo.findUnique({
      where: { id },
    });
  },
};
