import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const skuSchema = z.object({
  size: z.string().min(1),
  stock: z.coerce.number().int().min(0).default(0),
  priceOverride: z.coerce.number().min(0).optional().nullable(),
  isActive: z.boolean().default(true),
});

// POST /api/admin/variants/[variantId]/skus — Tambah SKU (ukuran) ke varian
export async function POST(
  req: Request,
  { params }: { params: Promise<{ variantId: string }> }
) {
  try {
    const { variantId } = await params;

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });
    if (!variant) {
      return NextResponse.json({ success: false, message: "Varian tidak ditemukan" }, { status: 404 });
    }

    const body = await req.json();
    const validation = skuSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validation.data;

    const sku = await prisma.$transaction(async (tx) => {
      const created = await tx.productSku.create({
        data: {
          variantId,
          size: data.size,
          stock: data.stock,
          priceOverride: data.priceOverride ?? null,
          isActive: data.isActive,
        },
      });

      // Rekalkulasi cached stock di Product induk
      const totalStock = await tx.productSku.aggregate({
        where: { variant: { productId: variant.productId } },
        _sum: { stock: true },
      });
      await tx.product.update({
        where: { id: variant.productId },
        data: { stock: totalStock._sum.stock ?? 0 },
      });

      return created;
    });

    return NextResponse.json({ success: true, data: sku }, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, message: "Ukuran ini sudah ada di varian ini" },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
