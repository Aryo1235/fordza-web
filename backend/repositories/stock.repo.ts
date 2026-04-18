import { prisma } from "@/lib/prisma";

export const StockRepository = {
  // ─── Product-Level Stock Log (produk tanpa varian) ─────────────────────────

  async getLogs(filters: {
    page: number;
    limit: number;
    search?: string;
    type?: string;
    productId?: string;
  }) {
    const { page, limit, search, type, productId } = filters;
    const where: any = {};

    if (type) where.type = type;
    if (productId) where.productId = productId;

    if (search) {
      where.OR = [
        { product: { name: { contains: search, mode: "insensitive" } } },
        { product: { productCode: { contains: search, mode: "insensitive" } } },
        { notes: { contains: search, mode: "insensitive" } },
        {
          product: {
            variants: { some: { color: { contains: search, mode: "insensitive" } } },
          },
        },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.stockLog.findMany({
        where,
        include: {
          operator: { select: { name: true, username: true } },
          product: { select: { name: true, productCode: true } },
        },
        orderBy: [
          { createdAt: "desc" },
          { id: "desc" }
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.stockLog.count({ where }),
    ]);

    return { logs, total };
  },

  async getLogsExport(filters: {
    search?: string;
    type?: string;
    productId?: string;
  }) {
    const { search, type, productId } = filters;
    const where: any = {};

    if (type) where.type = type;
    if (productId) where.productId = productId;

    if (search) {
      where.OR = [
        { product: { name: { contains: search, mode: "insensitive" } } },
        { product: { productCode: { contains: search, mode: "insensitive" } } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    return await prisma.stockLog.findMany({
      where,
      include: {
        operator: { select: { name: true, username: true } },
        product: { select: { name: true, productCode: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  // Adjust stok produk tanpa varian (langsung ke Product.stock)
  async adjustStock(data: {
    productId: string;
    delta: number;
    type: "RESTOCK" | "ADJUSTMENT";
    notes?: string;
    operatorId?: string;
  }) {
    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id: data.productId },
        data: { stock: { increment: data.delta } },
      });

      const log = await tx.stockLog.create({
        data: {
          productId: data.productId,
          delta: data.delta,
          currentStock: product.stock,
          type: data.type,
          notes: data.notes,
          operatorId: data.operatorId,
        },
      });

      return { product, log };
    });
  },

  // ─── SKU-Level Stock Log (produk dengan varian) ─────────────────────────────

  async getSkuLogs(filters: {
    page: number;
    limit: number;
    search?: string;
    type?: string;
    skuId?: string;
    productId?: string;
  }) {
    const { page, limit, search, type, skuId, productId } = filters;
    const where: any = {};

    if (type) where.type = type;
    if (skuId) where.skuId = skuId;
    if (productId) where.sku = { variant: { productId } };

    if (search) {
      where.OR = [
        { sku: { variant: { product: { name: { contains: search, mode: "insensitive" } } } } },
        { sku: { variant: { product: { productCode: { contains: search, mode: "insensitive" } } } } },
        { sku: { variant: { color: { contains: search, mode: "insensitive" } } } },
        { sku: { size: { contains: search, mode: "insensitive" } } },
        { color: { contains: search, mode: "insensitive" } },
        { size: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.skuStockLog.findMany({
        where,
        include: {
          operator: { select: { name: true, username: true } },
          sku: {
            select: {
              size: true,
              variant: {
                select: {
                  color: true,
                  product: { select: { name: true, productCode: true } },
                },
              },
            },
          },
        },
        orderBy: [
          { createdAt: "desc" },
          { id: "desc" }
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.skuStockLog.count({ where }),
    ]);

    return { logs, total };
  },

  // Adjust stok SKU tunggal (untuk Stok Opname per ukuran)
  async adjustSkuStock(data: {
    skuId: string;
    newStock: number;
    type: "RESTOCK" | "ADJUSTMENT";
    notes?: string;
    operatorId?: string;
  }) {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.productSku.findUnique({
        where: { id: data.skuId },
        include: { variant: { select: { productId: true, color: true } } },
      });
      if (!existing) throw new Error("SKU tidak ditemukan");

      const delta = data.newStock - existing.stock;

      const updatedSku = await tx.productSku.update({
        where: { id: data.skuId },
        data: { stock: data.newStock },
      });

      const log = await tx.skuStockLog.create({
        data: {
          skuId: data.skuId,
          delta,
          currentStock: data.newStock,
          size: existing.size,
          color: existing.variant.color,
          type: data.type,
          notes: data.notes,
          operatorId: data.operatorId,
        },
      });

      // Rekalkulasi cached stock produk induk
      const totalStock = await tx.productSku.aggregate({
        where: { variant: { productId: existing.variant.productId } },
        _sum: { stock: true },
      });
      await tx.product.update({
        where: { id: existing.variant.productId },
        data: { stock: totalStock._sum.stock ?? 0 },
      });

      // Dual-Logging: Catat rangkuman di level Produk (Master Log)
      await tx.stockLog.create({
        data: {
          productId: existing.variant.productId,
          delta: delta,
          currentStock: totalStock._sum.stock ?? 0,
          type: data.type,
          notes: data.notes || `Penyesuaian Ukuran ${existing.size} (${existing.variant.color})`,
          operatorId: data.operatorId,
        },
      });

      return { sku: updatedSku, log };
    });
  },

  async getSkuLogsExport(filters: { search?: string; type?: string }) {
    const { search, type } = filters;
    const where: any = {};

    if (type) where.type = type;

    if (search) {
      where.OR = [
        { sku: { variant: { product: { name: { contains: search, mode: "insensitive" } } } } },
        { sku: { variant: { product: { productCode: { contains: search, mode: "insensitive" } } } } },
        { sku: { variant: { color: { contains: search, mode: "insensitive" } } } },
        { sku: { size: { contains: search, mode: "insensitive" } } },
        { color: { contains: search, mode: "insensitive" } },
        { size: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    return await prisma.skuStockLog.findMany({
      where,
      include: {
        operator: { select: { name: true, username: true } },
        sku: {
          select: {
            size: true,
            variant: {
              select: {
                color: true,
                product: { select: { name: true, productCode: true } },
              },
            },
          },
        },
      },
      orderBy: [
        { createdAt: "desc" },
        { id: "desc" }
      ],
    });
  },
};
