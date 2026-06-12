import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadFileToS3 } from "@/actions/upload";
import { z } from "zod";
import { handleError, AppError } from "@/lib/error-handler";
import { logger } from "@/lib/logger";
import { headers } from "next/headers";

const variantSchema = z.object({
  color: z.string().min(1),
  colorCode: z.string().max(5).optional().nullable(), // Suffix unik, cth: "HTM", "CKL"
  basePrice: z.coerce.number().min(0),
  comparisonPrice: z.coerce.number().min(0).optional().nullable(),
  isActive: z.boolean().default(true),
  skus: z
    .array(
      z.object({
        size: z.string().min(1),
        stock: z.coerce.number().int().min(0).default(0),
        priceOverride: z.coerce.number().min(0).optional().nullable(),
        isActive: z.boolean().default(true),
      }),
    )
    .optional(),
});

import { PromoRepository } from "@/backend/repositories/promo.repo";

// GET /api/admin/products/[id]/variants — List semua varian produk
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: productId } = await params;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true }
    });

    if (!product) {
      throw new AppError("Produk tidak ditemukan", 404, "NOT_FOUND");
    }

    const variants = await prisma.productVariant.findMany({
      where: {
        productId,
        deletedAt: null,
      },
      include: {
        skus: {
          where: { deletedAt: null },
          orderBy: { size: "asc" },
        },
        images: true,
        product: {
          include: {
            categories: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const activePromos = await PromoRepository.getActive();

    // Mapping dg logika agregasi
    const enrichedVariants = variants.map((v: any) => {
      const basePrice = Number(v.basePrice);
      const gimmickPrice = v.comparisonPrice ? Number(v.comparisonPrice) : null;
      const highestPrice =
        gimmickPrice && gimmickPrice > basePrice ? gimmickPrice : basePrice;

      let bestPromo: any = activePromos.find(
        (promo) =>
          promo.targetType === "VARIANT" && promo.targetIds.includes(v.id),
      );
      if (!bestPromo) {
        bestPromo = activePromos.find(
          (promo) =>
            promo.targetType === "PRODUCT" &&
            promo.targetIds.includes(productId),
        );
      }
      if (!bestPromo) {
        const pCategoryIds = v.product.categories.map((c: any) => c.categoryId);
        bestPromo = activePromos.find(
          (promo) =>
            promo.targetType === "CATEGORY" &&
            promo.targetIds.some((id) => pCategoryIds.includes(id)),
        );
      }
      if (!bestPromo)
        bestPromo = activePromos.find((promo) => promo.targetType === "GLOBAL");

      let additionalDiscount = 0;
      let isConditional = false;

      if (bestPromo) {
        if (Number(bestPromo.minPurchase || 0) > 0) {
          isConditional = true;
        } else {
          if (bestPromo.type === "PERCENTAGE")
            additionalDiscount = (basePrice * Number(bestPromo.value)) / 100;
          else additionalDiscount = Number(bestPromo.value);
        }
      }

      const finalPrice = basePrice - Math.min(additionalDiscount, basePrice);
      let totalDiscountPercent = 0;
      if (highestPrice > finalPrice) {
        totalDiscountPercent = Math.floor(
          ((highestPrice - finalPrice) / highestPrice) * 100,
        );
      }

      return {
        ...v,
        basePrice,
        comparisonPrice: gimmickPrice,
        highestPrice,
        finalPrice,
        totalDiscountPercent,
        promoName: bestPromo?.name || null,
        isPromoConditional: isConditional,
      };
    });

    const headerList = await headers();
    const traceId = headerList.get("x-request-id") || "unknown";

    return NextResponse.json({ success: true, data: enrichedVariants, traceId });
  } catch (error: any) {
    return await handleError(error);
  }
}

// POST /api/admin/products/[id]/variants — Buat varian baru
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: productId } = await params;

    // Cek produk ada
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new AppError("Produk tidak ditemukan", 404, "NOT_FOUND");
    }

    const body = await req.json();

    // Validasi input dasar
    const validation = variantSchema
      .extend({
        images: z
          .array(
            z.object({
              url: z.string(),
              key: z.string(),
            }),
          )
          .optional(),
        skus: z
          .array(
            z.object({
              size: z.string(),
              stock: z.coerce.number().int().min(0),
              priceOverride: z.coerce.number().optional().nullable(),
              isActive: z.boolean().optional(),
            })
          )
          .optional(),
      })
      .safeParse(body);

    if (!validation.success) {
      throw validation.error;
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

    const existingVariant = await prisma.productVariant.findFirst({
      where: {
        variantCode,
      },
      select: {
        id: true,
        color: true,
        deletedAt: true,
        isActive: true,
      },
    });

    if (existingVariant) {
      throw new AppError(`Kode varian "${variantCode}" sudah dipakai. Silakan ganti nama warna atau kode custom agar unik.`, 409, "CONFLICT");
    }

    // Buat varian + SKU dalam 1 transaksi
    const variant = await prisma.$transaction(async (tx) => {
      // Hitung diskon otomatis
      let discountPercent = null;
      if (data.comparisonPrice && data.comparisonPrice > data.basePrice) {
        discountPercent =
          ((data.comparisonPrice - data.basePrice) / data.comparisonPrice) *
          100;
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
            create: (data.images || []).map((img) => ({
              url: img.url,
              key: img.key,
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

    const headerList = await headers();
    const traceId = headerList.get("x-request-id") || "unknown";

    return NextResponse.json(
      { success: true, message: "Varian berhasil dibuat", data: variant, traceId },
      { status: 201 },
    );
  } catch (error: any) {
    return await handleError(error);
  }
}
