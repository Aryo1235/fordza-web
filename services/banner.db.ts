import { prisma } from "@/lib/prisma";

export const BannerService = {
  async getAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    // Ambil data dan total count secara paralel
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
    return await prisma.banner.create({
      data: {
        title: data.title,
        imageUrl: data.imageUrl,
        imageKey: data.imageKey,
        linkUrl: data.linkUrl,
      },
    });
  },

  async delete(id: string) {
    return await prisma.banner.delete({
      where: { id },
    });
  },
};
