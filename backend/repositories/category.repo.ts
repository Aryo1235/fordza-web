import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/error-handler";

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
            select: {
              products: {
                where: {
                  product: {
                    isActive: true,
                    deletedAt: null,
                  },
                },
              },
            },
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
      throw new AppError("Urutan kategori harus lebih besar dari 0", 400, "VALIDATION_ERROR", { field: "order" });
    }

    const existingOrder = await prisma.category.findFirst({
      where: { order: orderNum, isActive: true, deletedAt: null },
    });
    if (existingOrder) {
      throw new AppError(`Urutan ${orderNum} sudah digunakan oleh kategori '${existingOrder.name}'. Silakan pilih urutan lain.`, 409, "DUPLICATE_ENTRY", { field: "order" });
    }

    return await prisma.category.create({
      data: {
        name: data.name,
        shortDescription: data.shortDescription,
        imageUrl: data.imageUrl,
        imageKey: data.imageKey,
        order: parseInt(data.order) || 0,
        createdById: data.createdById,
        updatedById: data.updatedById,
      },
    });
  },

  async getById(id: string) {
    const category = await prisma.category.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: {
          select: {
            products: {
              where: {
                product: {
                  isActive: true,
                  deletedAt: null,
                },
              },
            },
          },
        },
      },
    });

    if (!category) return null;

    // Hitung total stok fisik dari produk-produk di kategori ini
    const productsStock = await prisma.productCategory.findMany({
      where: {
        categoryId: id,
        product: {
          isActive: true,
          deletedAt: null,
        },
      },
      select: {
        product: {
          select: { stock: true }
        }
      }
    });

    const totalStock = productsStock.reduce((acc, item) => acc + (item.product?.stock || 0), 0);

    return {
      ...category,
      totalStock
    };
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
          _count: {
            select: {
              products: {
                where: {
                  product: {
                    deletedAt: null,
                  },
                },
              },
            },
          },
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
    if (data.updatedById !== undefined) updateData.updatedById = data.updatedById;

    if (data.order !== undefined) {
      const orderNum = parseInt(data.order) || 0;
      
      if (orderNum <= 0) {
        throw new AppError("Urutan kategori harus lebih besar dari 0", 400, "VALIDATION_ERROR", { field: "order" });
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
        throw new AppError(`Urutan ${orderNum} sudah digunakan oleh kategori '${existingOrder.name}'. Silakan pilih urutan lain.`, 409, "DUPLICATE_ENTRY", { field: "order" });
      }
      updateData.order = orderNum;
    }

    return await prisma.category.update({
      where: { id },
      data: updateData,
    });
  },

  async delete(id: string) {
    // 1. Cek apakah ada produk yang masih terhubung dengan kategori ini
    const productCount = await prisma.productCategory.count({
      where: { categoryId: id },
    });

    // 2. Jika masih ada, tolak penghapusan (Pagar Betis Integritas Data)
    if (productCount > 0) {
      throw new AppError(
        `Kategori tidak bisa dihapus karena masih digunakan oleh ${productCount} produk. Harap lepas atau pindahkan produk tersebut terlebih dahulu.`,
        400,
        "RELATION_EXISTS"
      );
    }

    // 3. Jika aman, lakukan Soft Delete
    return await prisma.category.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
  },
};
