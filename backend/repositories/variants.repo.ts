import { prisma } from "@/lib/prisma";

export const VariantRepository = {
  async searchAdmin(query: string, limit: number = 20) {
    const variants = await prisma.productVariant.findMany({
      where: {
        isActive: true,
        OR: [
          { color: { contains: query, mode: "insensitive" } },
          { variantCode: { contains: query, mode: "insensitive" } },
          { product: { name: { contains: query, mode: "insensitive" } } },
        ],
      },
      include: {
        product: {
          select: {
            name: true,
          },
        },
      },
      take: limit,
      orderBy: [
        { product: { name: "asc" } },
        { color: "asc" },
      ],
    });

    return variants.map((v) => ({
      id: v.id,
      name: `${v.product.name} - ${v.color}`,
      code: v.variantCode,
    }));
  },
};
