import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

    const where = {
      isActive: true,
      stock: { gt: 0 },
      OR: search
        ? [
            { name: { contains: search, mode: "insensitive" as const } },
            { categories: { some: { category: { name: { contains: search, mode: "insensitive" as const } } } } },
          ]
        : undefined,
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          price: true,
          stock: true,
          gender: true,
          productType: true,
          images: {
            select: { url: true },
            take: 1,
          },
          categories: {
            select: {
              category: { select: { name: true } },
            },
            take: 1,
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.product.count({ where }),
    ]);

    const formatted = products.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      stock: p.stock,
      gender: p.gender,
      productType: p.productType,
      imageUrl: p.images[0]?.url ?? null,
      category: p.categories[0]?.category.name ?? null,
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("GET /api/kasir/products error:", error.message);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil produk" },
      { status: 500 },
    );
  }
}
