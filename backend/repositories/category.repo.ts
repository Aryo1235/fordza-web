import { prisma } from "@/lib/prisma";

export const CategoryRepository = {
  async getAll(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [categories, totalItems] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: [{ order: "asc" }, { name: "asc" }],
        include: {
          // HITUNG PRODUK (Melalui tabel pivot ProductCategory)
          _count: {
            select: { products: true },
          },
        },
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
    const orderNum = parseInt(data.order) || 0;

    const existingOrder = await prisma.category.findFirst({
      where: { order: orderNum, isActive: true },
    });
    if (existingOrder) {
      throw new Error(`Urutan ${orderNum} sudah digunakan oleh kategori '${existingOrder.name}'. Silakan pilih urutan lain.`);
    }

    return await prisma.category.create({
      data: {
        name: data.name,
        shortDescription: data.shortDescription,
        imageUrl: data.imageUrl,
        imageKey: data.imageKey,
        order: parseInt(data.order) || 0,
      },
    });
  },

  async getById(id: string) {
    return await prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true } },
      },
    });
  },

  // Admin: termasuk inactive
  async getAllAdmin(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [categories, totalItems] = await Promise.all([
      prisma.category.findMany({
        orderBy: [{ order: "asc" }, { name: "asc" }],
        include: {
          _count: { select: { products: true } },
        },
        skip,
        take: limit,
      }),
      prisma.category.count(),
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

  async update(id: string, data: any) {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.shortDescription !== undefined) updateData.shortDescription = data.shortDescription;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.imageKey !== undefined) updateData.imageKey = data.imageKey;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    if (data.order !== undefined) {
      const orderNum = parseInt(data.order) || 0;
      const existingOrder = await prisma.category.findFirst({
        where: { 
          order: orderNum, 
          isActive: true,
          id: { not: id }
        },
      });
      if (existingOrder) {
        throw new Error(`Urutan ${orderNum} sudah digunakan oleh kategori '${existingOrder.name}'. Silakan pilih urutan lain.`);
      }
      updateData.order = orderNum;
    }

    return await prisma.category.update({
      where: { id },
      data: updateData,
    });
  },

  async delete(id: string) {
    return await prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
  },
};
