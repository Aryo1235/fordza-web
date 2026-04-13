/**
 * SizeTemplate Repository
 * ─────────────────────────────────────────────
 * LAYER 1 — DATA ACCESS ONLY
 *
 * Menangani kueri CRUD ke tabel "SizeTemplate".
 * Validasi (misal: apakah nama template sudah ada?)
 * menjadi tanggung jawab SizeTemplateService.
 */

import { prisma } from "@/lib/prisma";

export const SizeTemplateRepository = {
  async getAll() {
    return await prisma.sizeTemplate.findMany({
      orderBy: { name: "asc" },
    });
  },

  async create(data: any) {
    return await prisma.sizeTemplate.create({ data });
  },

  async getById(id: string) {
    return await prisma.sizeTemplate.findUnique({ where: { id } });
  },

  async update(id: string, data: any) {
    return await prisma.sizeTemplate.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.sizes !== undefined && { sizes: data.sizes }),
      },
    });
  },

  async delete(id: string) {
    return await prisma.sizeTemplate.delete({ where: { id } });
  },
};
