import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const TestimonialService = {
  // 1. GET ALL (Dengan Type Safety & Include Product Name)
  async getAll(filters: { productId?: string; rating?: number; page?: number; limit?: number }) {
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
        // Best Practice: Include nama produk supaya admin tau review ini untuk barang apa
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

  // GET ALL ADMIN (Tanpa filter isActive)
  async getAllAdmin(filters: { productId?: string; rating?: number; page?: number; limit?: number; search?: string }) {
    const { productId, rating, page = 1, limit = 10, search } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.TestimonialWhereInput = {
      ...(productId && { productId }),
      ...(rating && { rating }),
      ...(search && {
        OR: [
          { customerName: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } }
        ]
      })
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

  // 2. CREATE (Dengan Transaksi & Auto-Update Rating)
  async create(data: Prisma.TestimonialCreateInput) {
    try {
      // Kita bungkus transaction dalam Try-Catch
      return await prisma.$transaction(async (tx) => {
        // 1. Coba Simpan Review
        // JIKA ID SALAH, DI SINI AKAN ERROR (Code: P2025)
        const newReview = await tx.testimonial.create({
          data,
        });

        // 2. Hitung Statistik
        const stats = await tx.testimonial.aggregate({
          where: {
            productId: data.product.connect?.id,
            isActive: true,
          },
          _avg: { rating: true },
          _count: { rating: true },
        });

        // 3. Update Produk
        if (data.product.connect?.id) {
          await tx.product.update({
            where: { id: data.product.connect.id },
            data: {
              avgRating: stats._avg.rating || 0,
              totalReviews: stats._count.rating || 0,
            },
          });
        }

        return newReview;
      });
    } catch (error: any) {
      // 🛑 TANGKAP ERROR KHUSUS PRISMA DI SINI

      // P2025 = Record to connect not found (Foreign Key Error)
      if (error.code === "P2025") {
        throw new Error(
          "Product ID tidak valid. Produk tidak ditemukan di database.",
        );
      }

      // Jika error lain, lempar apa adanya
      throw error;
    }
  },

  // Update testimoni
  async update(id: string, data: any) {
    const testimonial = await prisma.testimonial.findUnique({ where: { id } });
    if (!testimonial) throw new Error("Testimoni tidak ditemukan");

    const updated = await prisma.testimonial.update({
      where: { id },
      data: {
        ...(data.customerName !== undefined && { customerName: data.customerName }),
        ...(data.rating !== undefined && { rating: data.rating }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    // Recalculate rating produk
    const stats = await prisma.testimonial.aggregate({
      where: { productId: testimonial.productId, isActive: true },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.product.update({
      where: { id: testimonial.productId },
      data: {
        avgRating: stats._avg.rating || 0,
        totalReviews: stats._count.rating || 0,
      },
    });

    return updated;
  },

  // Delete testimoni (hard delete + recalculate)
  async delete(id: string) {
    const testimonial = await prisma.testimonial.findUnique({ where: { id } });
    if (!testimonial) throw new Error("Testimoni tidak ditemukan");

    await prisma.testimonial.delete({ where: { id } });

    // Recalculate rating produk
    const stats = await prisma.testimonial.aggregate({
      where: { productId: testimonial.productId, isActive: true },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.product.update({
      where: { id: testimonial.productId },
      data: {
        avgRating: stats._avg.rating || 0,
        totalReviews: stats._count.rating || 0,
      },
    });

    return { deleted: true };
  },
};
