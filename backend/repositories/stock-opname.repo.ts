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
      if (!items || items.length === 0) return [];

      let effectiveOperatorId = operatorId || null;
      if (!effectiveOperatorId) {
        const firstAdmin = await tx.admin.findFirst({ select: { id: true } });
        effectiveOperatorId = firstAdmin?.id || null;
      }

      const itemIds = items.map((i) => i.id);

      // 1. Batch pre-fetch semua SKU yang cocok dalam 1 query
      const existingSkus = await tx.productSku.findMany({
        where: {
          id: { in: itemIds },
          isActive: true,
          deletedAt: null,
        },
        include: { variant: { select: { productId: true, color: true } } },
      });
      const skuMap = new Map(existingSkus.map((s) => [s.id, s]));

      // 2. Cari sisa ID yang mungkin merupakan ID Produk langsung
      const remainingProductIds = itemIds.filter((id) => !skuMap.has(id));
      let productMap = new Map<string, any>();
      if (remainingProductIds.length > 0) {
        const existingProducts = await tx.product.findMany({
          where: { id: { in: remainingProductIds } },
        });
        productMap = new Map(existingProducts.map((p) => [p.id, p]));
      }

      const results = [];
      const skuStockLogsToCreate: any[] = [];
      const masterStockLogsToCreate: any[] = [];
      const affectedProductIds = new Set<string>();
      const skuUpdatesPending: { item: { id: string; stock: number }; sku: any; delta: number }[] = [];

      // 3. Proses item SKU & Produk di memori
      for (const item of items) {
        const sku = skuMap.get(item.id);
        if (sku) {
          const delta = item.stock - sku.stock;
          if (delta === 0) continue;

          skuUpdatesPending.push({ item, sku, delta });
          affectedProductIds.add(sku.variant.productId);
        } else {
          const product = productMap.get(item.id);
          if (!product) {
            throw new AppError(`Data SKU/Produk dengan ID '${item.id}' tidak ditemukan di database.`, 404, "NOT_FOUND");
          }

          const delta = item.stock - product.stock;
          if (delta === 0) continue;

          const updatedProduct = await tx.product.update({
            where: { id: item.id },
            data: { stock: item.stock },
          });

          masterStockLogsToCreate.push({
            productId: item.id,
            delta,
            currentStock: item.stock,
            type: "ADJUSTMENT",
            notes: "Stok Opname Massal (Produk Langsung)",
            operatorId: effectiveOperatorId,
          });

          results.push(updatedProduct);
        }
      }

      // 4. Update SKU dan catat log SKU
      for (const { item, sku, delta } of skuUpdatesPending) {
        const updatedSku = await tx.productSku.update({
          where: { id: item.id },
          data: { stock: item.stock },
        });

        skuStockLogsToCreate.push({
          skuId: sku.id,
          delta,
          currentStock: item.stock,
          size: sku.size,
          color: sku.variant.color,
          type: "ADJUSTMENT",
          notes: "Stok Opname Massal",
          operatorId: effectiveOperatorId,
        });

        results.push(updatedSku);
      }

      // 5. Rekalkulasi total stok produk induk hanya 1x per produk unik
      const productNewTotals = new Map<string, number>();
      for (const productId of affectedProductIds) {
        const totalStock = await tx.productSku.aggregate({
          where: {
            isActive: true,
            deletedAt: null,
            variant: {
              productId,
              isActive: true,
              deletedAt: null,
            },
          },
          _sum: { stock: true },
        });
        const newTotal = totalStock._sum.stock ?? 0;
        productNewTotals.set(productId, newTotal);

        await tx.product.update({
          where: { id: productId },
          data: { stock: newTotal },
        });
      }

      // 6. Buat Master StockLog untuk SKU yang berubah
      for (const { sku, delta } of skuUpdatesPending) {
        const newTotal = productNewTotals.get(sku.variant.productId) ?? 0;
        masterStockLogsToCreate.push({
          productId: sku.variant.productId,
          delta,
          currentStock: newTotal,
          type: "ADJUSTMENT",
          notes: `Opname SKU ${sku.variant.color} - Ukuran ${sku.size}`,
          operatorId: effectiveOperatorId,
        });
      }

      // 7. Batch insert semua log dalam 2 query
      if (skuStockLogsToCreate.length > 0) {
        await tx.skuStockLog.createMany({ data: skuStockLogsToCreate as any });
      }
      if (masterStockLogsToCreate.length > 0) {
        await tx.stockLog.createMany({ data: masterStockLogsToCreate as any });
      }

      return results;
    }, { timeout: 20000, maxWait: 10000 });
  }
};
