import { prisma } from "@/lib/prisma";

export const TestimonialService = {
  async getAll(filters: { productId?: string; page?: number; limit?: number }) {
    const { productId, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    // Logika filter: Jika ada productId, cari yang spesifik. Jika tidak, ambil semua.
    const where: any = {
      isActive: true,
      ...(productId && { productId }),
    };

    const [testimonials, totalItems] = await Promise.all([
      prisma.testimonial.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
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
  async create(data: any) {
    return await prisma.testimonial.create({ data });
  },
};
