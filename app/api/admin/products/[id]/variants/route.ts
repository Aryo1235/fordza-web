import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadFileToS3 } from "@/actions/upload";
import { z } from "zod";

const variantSchema = z.object({
  color: z.string().min(1),
  colorCode: z.string().max(5).optional().nullable(), // Suffix unik, cth: "HTM", "CKL"
  basePrice: z.coerce.number().min(0),
  comparisonPrice: z.coerce.number().min(0).optional().nullable(),
  isActive: z.boolean().default(true),
  skus: z.array(z.object({
    size: z.string().min(1),
    stock: z.coerce.number().int().min(0).default(0),
    priceOverride: z.coerce.number().min(0).optional().nullable(),
    isActive: z.boolean().default(true),
  })).optional(),
});

// GET /api/admin/products/[id]/variants — List semua varian produk
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;

    const variants = await prisma.productVariant.findMany({
      where: { productId },
      include: {
        skus: { orderBy: { size: "asc" } },
        images: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, data: variants });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST /api/admin/products/[id]/variants — Buat varian baru
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;

    // Cek produk ada
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ success: false, message: "Produk tidak ditemukan" }, { status: 404 });
    }

    const body = await req.json();
    
    // Validasi input dasar
    const validation = variantSchema.extend({
      images: z.array(z.object({
        url: z.string(),
        key: z.string(),
      })).optional()
    }).safeParse(body);

    if (!validation.success) {
      console.error("POST Variant - Validation Failed:", validation.error.flatten().fieldErrors);
      return NextResponse.json(
        { success: false, errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Generate variantCode
    const suffix = data.colorCode
      ? data.colorCode.toUpperCase().slice(0, 5)
      : data.color
          .toUpperCase()
          .replace(/\s+/g, "")
          .replace(/[^A-Z0-9]/g, "")
          .slice(0, 3);
    const variantCode = `${product.productCode}-${suffix}`;

    // Buat varian + SKU dalam 1 transaksi
    const variant = await prisma.$transaction(async (tx) => {
      // Hitung diskon otomatis
      let discountPercent = null;
      if (data.comparisonPrice && data.comparisonPrice > data.basePrice) {
        discountPercent = ((data.comparisonPrice - data.basePrice) / data.comparisonPrice) * 100;
      }

      const created = await tx.productVariant.create({
        data: {
          productId,
          variantCode,
          color: data.color,
          basePrice: data.basePrice,
          comparisonPrice: data.comparisonPrice,
          discountPercent,
          isActive: data.isActive,
          images: {
            create: (data.images || []).map(img => ({
              url: img.url,
              key: img.key
            })),
          },
          skus: data.skus?.length
            ? {
                create: data.skus.map((sku) => ({
                  size: sku.size,
                  stock: sku.stock,
                  priceOverride: sku.priceOverride ?? null,
                  isActive: sku.isActive,
                })),
              }
            : undefined,
        },
        include: { skus: true, images: true },
      });

      // Rekalkulasi cached stock di Product induk
      const totalStock = await tx.productSku.aggregate({
        where: { variant: { productId } },
        _sum: { stock: true },
      });

      await tx.product.update({
        where: { id: productId },
        data: { stock: totalStock._sum.stock ?? 0 },
      });

      // ─── Logging Stok Awal Otomatis untuk Varian Baru ────────────────────────
      const operatorId = body.operatorId as string | null;
      let effectiveOperatorId: string | null = operatorId || null;
      if (!effectiveOperatorId) {
        const firstAdmin = await tx.admin.findFirst({ select: { id: true } });
        effectiveOperatorId = firstAdmin?.id || null;
      }

      const createdSkus = created.skus;
      if (effectiveOperatorId && createdSkus && createdSkus.length > 0) {
        const logsData = createdSkus.map((sku) => ({
          skuId: sku.id,
          delta: sku.stock,
          currentStock: sku.stock,
          size: sku.size,
          color: created.color,
          type: "RESTOCK" as const,
          notes: "Stok Awal Varian Baru (System Auto-Log)",
          operatorId: effectiveOperatorId,
        }));

        await tx.skuStockLog.createMany({
          data: logsData,
        });

        // Dual-Logging (Master Log)
        const totalDelta = logsData.reduce((sum, l) => sum + l.delta, 0);
        await tx.stockLog.create({
          data: {
            productId,
            delta: totalDelta,
            currentStock: totalStock._sum.stock ?? 0,
            type: "RESTOCK",
            notes: `Penambahan Varian Baru: ${created.color}`,
            operatorId: effectiveOperatorId,
          },
        });
      }

      return created;
    });

    return NextResponse.json(
      { success: true, message: "Varian berhasil dibuat", data: variant },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
