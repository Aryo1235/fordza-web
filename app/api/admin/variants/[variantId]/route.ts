import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { handleError, AppError } from "@/lib/error-handler";
import { logger } from "@/lib/logger";
import { headers } from "next/headers";

const updateVariantSchema = z.object({
  color: z.string().min(1).optional(),
  colorCode: z.string().max(5).optional().nullable(),
  basePrice: z.coerce.number().min(0).optional(),
  comparisonPrice: z.coerce.number().min(0).optional().nullable(),
  isActive: z.boolean().optional(),
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
      }),
    )
    .optional(),
}).strict();

// PATCH /api/admin/variants/[variantId] — Update data varian
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ variantId: string }> },
) {
  try {
    const { variantId } = await params;
    const body = await req.json();

    const validation = updateVariantSchema.safeParse(body);
    if (!validation.success) {
      throw validation.error;
    }

    const updatedVariant = await prisma.$transaction(async (tx) => {
      const oldVariant = await tx.productVariant.findUnique({
        where: { id: variantId },
        select: {
          id: true,
          color: true,
          variantCode: true,
          productId: true,
          isActive: true,
          basePrice: true,
          comparisonPrice: true,
          product: { select: { productCode: true } },
        },
      });
      if (!oldVariant) throw new AppError("Varian tidak ditemukan", 404, "NOT_FOUND");

      const updateData: any = { ...validation.data };
      delete updateData.skus;
      delete updateData.images;   // Handle images separately
      delete updateData.colorCode; // colorCode bukan kolom DB, hanya dipakai untuk generate variantCode

      // Handle Images Update (Replacement)
      if (validation.data.images) {
        // Hapus gambar lama varian ini
        await tx.productVariantImage.deleteMany({
          where: { variantId: variantId },
        });

        // Simpan gambar baru
        if (validation.data.images.length > 0) {
          await tx.productVariantImage.createMany({
            data: validation.data.images.map((img) => ({
              variantId: variantId,
              url: img.url,
              key: img.key,
            })),
          });
        }
      }

      // Jika ada perubahan color atau colorCode, regenerasi variantCode
      if (validation.data.color || validation.data.colorCode) {
        const color = validation.data.color || oldVariant.color;
        const colorCode = validation.data.colorCode;
        const suffix =
          colorCode && colorCode.trim()
            ? colorCode.toUpperCase().slice(0, 5)
            : color
                .toUpperCase()
                .replace(/\s+/g, "")
                .replace(/[^A-Z0-9]/g, "")
                .slice(0, 3);
        const newCode = `${oldVariant.product.productCode}-${suffix}`;

        const duplicateVariant = await tx.productVariant.findFirst({
          where: {
            variantCode: newCode,
            NOT: { id: variantId },
          },
          select: { id: true },
        });

        if (duplicateVariant) {
          throw new AppError(`Kode varian "${newCode}" sudah dipakai. Silakan ganti nama warna atau kode custom agar unik.`, 409, "CONFLICT");
        }

        updateData.variantCode = newCode;
      }

      // Hitung ulang diskon jika ada perubahan harga
      const finalBasePrice =
        validation.data.basePrice ?? Number(oldVariant.basePrice);
      const finalComparisonPrice =
        validation.data.comparisonPrice !== undefined
          ? validation.data.comparisonPrice
            ? Number(validation.data.comparisonPrice)
            : null
          : oldVariant.comparisonPrice
            ? Number(oldVariant.comparisonPrice)
            : null;

      if (finalComparisonPrice && finalComparisonPrice > finalBasePrice) {
        updateData.discountPercent =
          ((finalComparisonPrice - finalBasePrice) / finalComparisonPrice) *
          100;
      } else {
        updateData.discountPercent = null;
      }

      await tx.productVariant.update({
        where: { id: variantId },
        data: updateData,
      });

      // Jika status varian berubah via toggle, sinkronkan status SKU + buat log detail SKU
      if (
        validation.data.isActive !== undefined &&
        validation.data.isActive !== oldVariant.isActive
      ) {
        const operatorId =
          req.headers.get("x-user-id") ??
          (await tx.admin.findFirst({ select: { id: true } }))?.id ??
          null;

        const skuSnapshots = await tx.productSku.findMany({
          where: { variantId, deletedAt: null },
          select: {
            id: true,
            size: true,
            stock: true,
            isActive: true,
          },
        });

        await tx.productSku.updateMany({
          where: { variantId, deletedAt: null },
          data: {
            isActive: validation.data.isActive,
          },
        });

        const skuStatusLogs = skuSnapshots
          .map((sku) => {
            // Logika baru: delta dihitung berdasarkan ketersediaan (sellable)
            const previousEffectiveStock =
              oldVariant.isActive && sku.isActive ? sku.stock : 0;
            const nextEffectiveStock = validation.data.isActive && sku.isActive ? sku.stock : 0;
            const delta = nextEffectiveStock - previousEffectiveStock;

            return {
              skuId: sku.id,
              delta,
              currentStock: nextEffectiveStock,
              size: sku.size,
              color: validation.data.color ?? oldVariant.color,
              type: delta >= 0 ? "RESTOCK" : "ADJUSTMENT",
              notes: validation.data.isActive
                ? `Varian "${oldVariant.color}" Diaktifkan Kembali`
                : `Varian "${oldVariant.color}" Dinonaktifkan`,
              operatorId,
            };
          })
          .filter((log) => log.delta !== 0);

        if (skuStatusLogs.length > 0) {
          await tx.skuStockLog.createMany({ data: skuStatusLogs as any });
        }
      }

      // Handle SKUs Bulk Update (Upsert) + Auto Stock Logging
      if (validation.data.skus) {
        const operatorId =
          req.headers.get("x-user-id") ??
          (await tx.admin.findFirst({ select: { id: true } }))?.id ??
          null;

        for (const skuData of validation.data.skus) {
          // Cari stok lama SEBELUM diupdate (untuk menghitung delta)
          const existingSku = await tx.productSku.findUnique({
            where: { variantId_size: { variantId, size: skuData.size } },
            select: { id: true, stock: true },
          });

          const upsertedSku = await tx.productSku.upsert({
            where: { variantId_size: { variantId, size: skuData.size } },
            create: {
              variantId,
              size: skuData.size,
              stock: skuData.stock,
              priceOverride: skuData.priceOverride ?? null,
              isActive: skuData.isActive ?? true,
            },
            update: {
              stock: skuData.stock,
              priceOverride: skuData.priceOverride ?? null,
              isActive: skuData.isActive ?? true,
            },
          });

          // Hitung delta stok (stok baru - stok lama)
          const oldStock = existingSku?.stock ?? 0;
          const delta = skuData.stock - oldStock;

          // Buat log HANYA jika stok berubah
          if (delta !== 0) {
            await tx.skuStockLog.create({
              data: {
                skuId: upsertedSku.id,
                delta,
                currentStock: skuData.stock,
                size: skuData.size,
                color: validation.data.color ?? oldVariant.color,
                type: delta > 0 ? "RESTOCK" : "ADJUSTMENT",
                notes: "Perubahan Stok via Edit Varian (Admin)",
                operatorId,
              },
            });
          }
        }
      }

      const productId = oldVariant.productId;

      // Rekalkulasi Harga Terendah (berdasarkan harga setelah diskon)
      const allVariants = await tx.productVariant.findMany({
        where: { productId, isActive: true, deletedAt: null },
        select: { basePrice: true, discountPercent: true },
      });

      let minPrice: number | null = null;
      allVariants.forEach((variant) => {
        const bp = Number(variant.basePrice);
        if (minPrice === null || bp < minPrice) {
          minPrice = bp;
        }
      });

      // Rekalkulasi Total Stok (Hanya jika produk induk aktif)
      const parentProduct = await tx.product.findUnique({
        where: { id: productId },
        select: { isActive: true }
      });

      let newTotalStock = 0;
      if (parentProduct?.isActive) {
        const totalStockAgg = await tx.productSku.aggregate({
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
        newTotalStock = totalStockAgg._sum.stock ?? 0;
      }

      // Ambil stok lama produk untuk menghitung delta master log
      const productBefore = await tx.product.findUnique({
        where: { id: productId },
        select: { stock: true },
      });
      const masterDelta = newTotalStock - (productBefore?.stock ?? 0);

      await tx.product.update({
        where: { id: productId },
        data: { price: minPrice, stock: newTotalStock },
      });

      // Buat Master StockLog jika total stok produk berubah
      if (masterDelta !== 0) {
        const effectiveColor = validation.data.color ?? oldVariant.color;
        const isToggleAction =
          validation.data.isActive !== undefined &&
          validation.data.isActive !== oldVariant.isActive;
        const masterLogNotes = isToggleAction
          ? validation.data.isActive
            ? `Aktifkan kembali Varian "${effectiveColor}" (Master Log)`
            : `Nonaktifkan Varian "${effectiveColor}" (Master Log)`
          : `Perubahan Stok via Edit Varian ${effectiveColor} (Master Log)`;

        const operatorId =
          req.headers.get("x-user-id") ??
          (await tx.admin.findFirst({ select: { id: true } }))?.id ??
          null;
        await tx.stockLog.create({
          data: {
            productId,
            delta: masterDelta,
            currentStock: newTotalStock,
            type: masterDelta > 0 ? "RESTOCK" : "ADJUSTMENT",
            notes: masterLogNotes,
            operatorId,
          },
        });
      }

      return await tx.productVariant.findUnique({
        where: { id: variantId },
        include: { skus: true, images: true },
      });
    });

    const operatorId = req.headers.get("x-user-id") || undefined;
    const headerList = await headers();
    const traceId = headerList.get("x-request-id") || "unknown";

    logger.info({ traceId, variantId, productId: updatedVariant?.productId, operatorId }, "Variant updated successfully");

    return NextResponse.json({ success: true, data: updatedVariant, traceId });
  } catch (error: any) {
    return await handleError(error);
  }
}

// DELETE /api/admin/variants/[variantId] — Soft delete varian dan SKU terkait
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ variantId: string }> },
) {
  try {
    const { variantId } = await params;

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: {
        id: true,
        color: true,
        variantCode: true,
        productId: true,
        isActive: true,
        deletedAt: true,
        skus: {
          select: {
            id: true,
            size: true,
            stock: true,
            isActive: true,
          },
        },
      },
    });
    if (!variant) {
      throw new AppError("Varian tidak ditemukan", 404, "NOT_FOUND");
    }

    if (!variant.isActive && variant.deletedAt) {
      return NextResponse.json({
        success: true,
        message: "Varian sudah tidak aktif",
      });
    }

    const productId = variant.productId;
    const variantStock = variant.isActive
      ? variant.skus.reduce((sum, sku) => {
          if (!sku.isActive) return sum;
          return sum + sku.stock;
        }, 0)
      : 0;

    await prisma.$transaction(async (tx) => {
      const now = new Date();

      await tx.productVariant.update({
        where: { id: variantId },
        data: {
          isActive: false,
          deletedAt: now,
        },
      });

      await tx.productSku.updateMany({
        where: { variantId, deletedAt: null },
        data: {
          isActive: false,
          deletedAt: now,
        },
      });

      const remainingVariants = await tx.productVariant.findMany({
        where: { 
            productId, 
            isActive: true, 
            deletedAt: null,
            product: { isActive: true } // Hanya hitung jika produk induk aktif
        },
        select: {
          basePrice: true,
          skus: {
            where: { isActive: true, deletedAt: null },
            select: { stock: true },
          },
        },
      });

      const newTotalStock = remainingVariants.reduce(
        (variantSum, activeVariant) =>
          variantSum +
          activeVariant.skus.reduce((skuSum, sku) => skuSum + sku.stock, 0),
        0,
      );

      let newMinPrice: number | null = null;
      for (const activeVariant of remainingVariants) {
        const priceValue = Number(activeVariant.basePrice);
        if (newMinPrice === null || priceValue < newMinPrice) {
          newMinPrice = priceValue;
        }
      }

      await tx.product.update({
        where: { id: productId },
        data: {
          stock: newTotalStock,
          price: newMinPrice,
        },
      });

      const operatorId =
        req.headers.get("x-user-id") ??
        (await tx.admin.findFirst({ select: { id: true } }))?.id ??
        null;

      const skuLogsOnDelete = variant.skus
        .map((sku) => {
          const previousEffectiveStock =
            variant.isActive && sku.isActive ? sku.stock : 0;
          const nextEffectiveStock = 0;
          const delta = nextEffectiveStock - previousEffectiveStock;

          if (delta === 0) return null;

          return {
            skuId: sku.id,
            delta,
            currentStock: nextEffectiveStock,
            size: sku.size,
            color: variant.color,
            type: "ADJUSTMENT" as const,
            notes: `Hapus Varian "${variant.color}" (${variant.variantCode})`,
            operatorId,
          };
        })
        .filter((log): log is NonNullable<typeof log> => log !== null);

      if (skuLogsOnDelete.length > 0) {
        await tx.skuStockLog.createMany({ data: skuLogsOnDelete });
      }

      if (variantStock !== 0) {
        await tx.stockLog.create({
          data: {
            productId,
            delta: -variantStock,
            currentStock: newTotalStock,
            type: "ADJUSTMENT",
            notes: `Hapus Varian "${variant.color}" (${variant.variantCode})`,
            operatorId,
          },
        });
      }
    });

    const operatorId = req.headers.get("x-user-id") || undefined;
    const headerList = await headers();
    const traceId = headerList.get("x-request-id") || "unknown";

    logger.info({ traceId, variantId, productId, operatorId }, "Variant soft-deleted successfully");

    return NextResponse.json({
      success: true,
      message: "Varian berhasil dihapus",
      traceId,
    });
  } catch (error: any) {
    return await handleError(error);
  }
}
