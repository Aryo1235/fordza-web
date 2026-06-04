import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/error-handler";

export const StockOpnameRepository = {
  async getForOpname(filters: { search?: string; page?: number; limit?: number }) {
    const { search, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { productCode: { contains: search, mode: "insensitive" } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          productCode: true,
          name: true,
          stock: true,
          variants: {
            where: {
              isActive: true,
              deletedAt: null,
            },
            select: {
              id: true,
              color: true,
              variantCode: true,
              skus: {
                where: {
                  isActive: true,
                  deletedAt: null,
                },
                select: {
                  id: true,
                  size: true,
                  stock: true,
                },
                orderBy: {
                  size: "asc",
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      meta: {
        totalItems: total,
        totalPage: Math.ceil(total / limit),
        currentPage: page,
        limit,
      },
    };
  },

  async getForOpnameExport(filters: { search?: string }) {
    const { search } = filters;
    const where: any = {
      isActive: true,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { productCode: { contains: search, mode: "insensitive" } },
      ];
    }

    return await prisma.product.findMany({
      where,
      select: {
        id: true,
        productCode: true,
        name: true,
        stock: true,
        categories: {
          select: { category: { select: { id: true, name: true } } },
        },
        variants: {
          where: {
            isActive: true,
            deletedAt: null,
          },
          select: {
            id: true,
            color: true,
            variantCode: true,
            skus: {
              where: {
                isActive: true,
                deletedAt: null,
              },
              select: {
                id: true,
                size: true,
                stock: true,
              },
              orderBy: {
                size: "asc",
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async bulkUpdateStock(
    items: { id: string; stock: number }[],
    operatorId?: string,
  ) {
    return await prisma.$transaction(async (tx) => {
      const results = [];
      for (const item of items) {
        const sku = await tx.productSku.findFirst({
          where: {
            id: item.id,
            isActive: true,
            deletedAt: null,
          },
          include: { variant: { select: { productId: true, color: true } } },
        });
        if (sku) {
          const delta = item.stock - sku.stock;
          if (delta === 0) continue;
          const updated = await tx.productSku.update({
            where: { id: item.id },
            data: { stock: item.stock },
          });
          const totalStock = await tx.productSku.aggregate({
            where: {
              isActive: true,
              deletedAt: null,
              variant: {
                productId: sku.variant.productId,
                isActive: true,
                deletedAt: null,
              },
            },
            _sum: { stock: true },
          });
          const newTotal = totalStock._sum.stock ?? 0;
          await tx.product.update({
            where: { id: sku.variant.productId },
            data: { stock: newTotal },
          });
          await tx.skuStockLog.create({
            data: {
              skuId: sku.id,
              delta,
              currentStock: item.stock,
              size: sku.size,
              color: sku.variant.color,
              type: "ADJUSTMENT",
              notes: "Stok Opname Massal",
              operatorId: operatorId || null,
            },
          });
          await tx.stockLog.create({
            data: {
              productId: sku.variant.productId,
              delta,
              currentStock: newTotal,
              type: "ADJUSTMENT",
              notes: `Opname SKU ${sku.variant.color} - Ukuran ${sku.size}`,
              operatorId: operatorId || null,
            },
          });
          results.push(updated);
        } else {
          const product = await tx.product.findUnique({
            where: { id: item.id },
          });
          if (!product) {
            throw new AppError(`Data SKU/Produk dengan ID '${item.id}' tidak ditemukan di database.`, 404, "NOT_FOUND");
          }
          const delta = item.stock - product.stock;
          if (delta === 0) continue;
          const updated = await tx.product.update({
            where: { id: item.id },
            data: { stock: item.stock },
          });
          await tx.stockLog.create({
            data: {
              productId: item.id,
              delta,
              currentStock: item.stock,
              type: "ADJUSTMENT",
              notes: "Stok Opname Massal (Produk Langsung)",
              operatorId: operatorId || null,
            },
          });
          results.push(updated);
        }
      }
      return results;
    });
  }
};
