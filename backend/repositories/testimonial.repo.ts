/**
 * Testimonial Repository
 * ─────────────────────────────────────────────
 * LAYER 1 — DATA ACCESS ONLY
 *
 * Menangani kueri CRUD ke tabel "Testimonial".
 *
 * PENTING — Kasus nyata perbedaan Repo vs Service:
 * Saat review dihapus, rating produk harus dihitung ulang.
 * TAPI, logika "hitung ulang rating" bukan tugasnya Repository.
 * Repository hanya menyimpan/menghapus 1 baris data.
 * Tugas mengorkestrasi "hapus → hitung → update" ada di TestimonialService.
 */

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const TestimonialRepository = {
  async getAll(filters: {
    productId?: string;
    rating?: number;
    page?: number;
    limit?: number;
  }) {
    const { productId, rating, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.TestimonialWhereInput = {
      isActive: true,
      ...(productId && { productId }),
      ...(rating && { rating }),
    };

    const [testimonials, totalItems] = await Promise.all([
      prisma.testimonial.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          product: {
            select: { name: true, images: { take: 1, select: { url: true } } },
          },
        },
      }),
      prisma.testimonial.count({ where }),
    ]);

    return {
      testimonials,
      meta: {
        totalItems,
        totalPage: Math.ceil(totalItems / limit),
        currentPage: page,
        limit,
      },
    };
  },

  async getAllAdmin(filters: {
    productId?: string;
    rating?: number;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const { productId, rating, page = 1, limit = 10, search } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.TestimonialWhereInput = {
      ...(productId && { productId }),
      ...(rating && { rating }),
      ...(search && {
        OR: [
          { customerName: { contains: search, mode: "insensitive" } },
          { content: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [testimonials, totalItems] = await Promise.all([
      prisma.testimonial.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          product: {
            select: { name: true, images: { take: 1, select: { url: true } } },
          },
        },
      }),
      prisma.testimonial.count({ where }),
    ]);

    return {
      testimonials,
      meta: {
        totalItems,
        totalPage: Math.ceil(totalItems / limit),
        currentPage: page,
        limit,
      },
    };
  },

  // Hanya buat 1 baris testimonial. Recalculate rating → urusan Service.
  async create(data: Prisma.TestimonialCreateInput) {
    return await prisma.testimonial.create({ data });
  },

  async findById(id: string) {
    return await prisma.testimonial.findUnique({ where: { id } });
  },

  async update(id: string, data: any) {
    return await prisma.testimonial.update({
      where: { id },
      data: {
        ...(data.customerName !== undefined && { customerName: data.customerName }),
        ...(data.rating !== undefined && { rating: data.rating }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  },

  // Hanya hapus 1 baris. Recalculate rating → urusan Service.
  async delete(id: string) {
    return await prisma.testimonial.delete({ where: { id } });
  },

  // Dipakai Service untuk menghitung ulang rata-rata rating produk
  async calculateRatingStats(productId: string) {
    return await prisma.testimonial.aggregate({
      where: { productId, isActive: true },
      _avg: { rating: true },
      _count: { rating: true },
    });
  },
};
