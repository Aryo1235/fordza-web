import { prisma } from "@/lib/prisma";

export const CategoryRepository = {
  async getAll(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [categories, totalItems] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true, deletedAt: null },
        orderBy: [{ order: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          shortDescription: true,
          imageUrl: true,
          imageKey: true,
          order: true,
          isActive: true,
          _count: {
            select: { products: true },
          },
        },
        skip,
        take: limit,
      }),
      prisma.category.count({ where: { isActive: true, deletedAt: null } }),
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

    if (orderNum <= 0) {
      throw new Error("Urutan kategori harus lebih besar dari 0");
    }

    const existingOrder = await prisma.category.findFirst({
      where: { order: orderNum, isActive: true, deletedAt: null },
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
    return await prisma.category.findFirst({
      where: { id, deletedAt: null },
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
        where: { deletedAt: null },
        orderBy: [{ order: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          shortDescription: true,
          imageUrl: true,
          imageKey: true,
          order: true,
          isActive: true,
          _count: { select: { products: true } },
        },
        skip,
        take: limit,
      }),
      prisma.category.count({ where: { deletedAt: null } }),
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
      
      if (orderNum <= 0) {
        throw new Error("Urutan kategori harus lebih besar dari 0");
      }

      const existingOrder = await prisma.category.findFirst({
        where: { 
          order: orderNum, 
          isActive: true,
          deletedAt: null,
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
      data: { isActive: false, deletedAt: new Date() },
    });
  },
};
