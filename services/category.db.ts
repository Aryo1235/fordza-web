import { prisma } from "@/lib/prisma";

export const CategoryService = {
  async getAll(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [categories, totalItems] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
        skip,
        take: limit,
      }),
      prisma.category.count({ where: { isActive: true } }),
    ]);

    return {
      categories,
      meta: {
        totalItems,
        totalPage: Math.ceil(totalItems / limit),
        currentPage: page,
        limit,
      },
    };
  },

  async create(data: any) {
    return await prisma.category.create({
      data: {
        name: data.name,
        shortDescription: data.shortDescription,
        imageUrl: data.imageUrl,
        imageKey: data.imageKey,
        order: data.order || 0,
      },
    });
  },
};
