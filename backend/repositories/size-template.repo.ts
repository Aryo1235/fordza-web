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
      include: {
        productDetails: {
          select: { id: true, productId: true }
        }
      },
      orderBy: { name: "asc" },
    });
  },

  async create(data: any) {
    return await prisma.sizeTemplate.create({ data });
  },

  async getById(id: string, page?: number, limit?: number) {
    const hasPagination = page !== undefined && limit !== undefined;
    return await prisma.sizeTemplate.findUnique({
      where: { id },
      include: {
        productDetails: {
          ...(hasPagination && {
            skip: (page - 1) * limit,
            take: limit,
          }),
          include: {
            product: {
              select: {
                id: true,
                name: true,
                productCode: true,
                price: true,
                stock: true,
              }
            }
          }
        }
      }
    });
  },

  async countProducts(id: string) {
    return await prisma.productDetail.count({
      where: { sizeTemplateId: id }
    });
  },

  async update(id: string, data: any) {
    return await prisma.sizeTemplate.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.sizes !== undefined && { sizes: data.sizes }),
        ...(data.measurements !== undefined && { measurements: data.measurements }),
      },
    });
  },

  async delete(id: string) {
    return await prisma.sizeTemplate.delete({ where: { id } });
  },
};
