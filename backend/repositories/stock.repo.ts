import { prisma } from "@/lib/prisma";

export const StockRepository = {
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
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.stockLog.findMany({
        where,
        include: {
          operator: {
            select: {
              name: true,
              username: true,
            },
          },
          product: {
            select: {
              name: true,
              productCode: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
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
        operator: {
          select: {
            name: true,
            username: true,
          },
        },
        product: {
          select: {
            name: true,
            productCode: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

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
};
