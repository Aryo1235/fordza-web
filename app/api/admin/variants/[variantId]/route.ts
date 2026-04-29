import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateVariantSchema = z.object({
  color: z.string().min(1).optional(),
  colorCode: z.string().max(5).optional().nullable(),
  basePrice: z.coerce.number().min(0).optional(),
  comparisonPrice: z.coerce.number().min(0).optional().nullable(),
  isActive: z.boolean().optional(),
  images: z.array(z.object({
    url: z.string(),
    key: z.string(),
  })).optional(),
  skus: z.array(z.object({
    size: z.string(),
    stock: z.coerce.number().int().min(0),
    priceOverride: z.coerce.number().optional().nullable(),
    isActive: z.boolean().optional(),
  })).optional(),
});

// PATCH /api/admin/variants/[variantId] — Update data varian
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ variantId: string }> }
) {
  try {
    const { variantId } = await params;
    const body = await req.json();

    const validation = updateVariantSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updatedVariant = await prisma.$transaction(async (tx) => {
      const oldVariant = await tx.productVariant.findUnique({
        where: { id: variantId },
        select: { 
          color: true, 
          variantCode: true, 
          productId: true, 
          basePrice: true, 
          comparisonPrice: true,
          product: { select: { productCode: true } } 
        }
      });
      if (!oldVariant) throw new Error("Varian tidak ditemukan");

      const updateData: any = { ...validation.data };
      delete updateData.skus;
      delete updateData.images; // Handle images separately

      // Handle Images Update (Replacement)
      if (validation.data.images) {
        // Hapus gambar lama varian ini
        await tx.productVariantImage.deleteMany({
          where: { variantId: variantId }
        });
        
        // Simpan gambar baru
        if (validation.data.images.length > 0) {
          await tx.productVariantImage.createMany({
            data: validation.data.images.map(img => ({
              variantId: variantId,
              url: img.url,
              key: img.key
            }))
          });
        }
      }

      // Jika ada perubahan color atau colorCode, regenerasi variantCode
      if (validation.data.color || validation.data.colorCode) {
        const color = validation.data.color || oldVariant.color;
        const colorCode = validation.data.colorCode;
        const suffix = colorCode && colorCode.trim()
          ? colorCode.toUpperCase().slice(0, 5)
          : color.toUpperCase().replace(/\s+/g, "").replace(/[^A-Z0-9]/g, "").slice(0, 3);
        const newCode = `${oldVariant.product.productCode}-${suffix}`;
        updateData.variantCode = newCode;
      }

      // Hitung ulang diskon jika ada perubahan harga
      const finalBasePrice = validation.data.basePrice ?? Number(oldVariant.basePrice);
      const finalComparisonPrice = validation.data.comparisonPrice !== undefined 
        ? (validation.data.comparisonPrice ? Number(validation.data.comparisonPrice) : null)
        : (oldVariant.comparisonPrice ? Number(oldVariant.comparisonPrice) : null);

      if (finalComparisonPrice && finalComparisonPrice > finalBasePrice) {
        updateData.discountPercent = ((finalComparisonPrice - finalBasePrice) / finalComparisonPrice) * 100;
      } else {
        updateData.discountPercent = null;
      }

      await tx.productVariant.update({
        where: { id: variantId },
        data: updateData,
      });

      // Handle SKUs Bulk Update (Upsert) + Auto Stock Logging
      if (validation.data.skus) {
        const operatorId = req.headers.get("x-user-id") ?? 
          (await tx.admin.findFirst({ select: { id: true } }))?.id ?? null;
        
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
        where: { productId, isActive: true },
        select: { basePrice: true, discountPercent: true },
      });

      let minPrice: number | null = null;
      allVariants.forEach((variant) => {
        const bp = Number(variant.basePrice);
        if (minPrice === null || bp < minPrice) {
          minPrice = bp;
        }
      });

      // Rekalkulasi Total Stok
      const totalStockAgg = await tx.productSku.aggregate({
        where: { variant: { productId } },
        _sum: { stock: true },
      });
      const newTotalStock = totalStockAgg._sum.stock ?? 0;

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
        const operatorId = req.headers.get("x-user-id") ??
          (await tx.admin.findFirst({ select: { id: true } }))?.id ?? null;
        await tx.stockLog.create({
          data: {
            productId,
            delta: masterDelta,
            currentStock: newTotalStock,
            type: masterDelta > 0 ? "RESTOCK" : "ADJUSTMENT",
            notes: `Perubahan Stok via Edit Varian ${oldVariant.color} (Master Log)`,
            operatorId,
          },
        });
      }

      return await tx.productVariant.findUnique({
        where: { id: variantId },
        include: { skus: true, images: true },
      });

    });

    return NextResponse.json({ success: true, data: updatedVariant });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/variants/[variantId] — Hapus varian (dan semua SKU-nya via cascade)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ variantId: string }> }
) {
  try {
    const { variantId } = await params;

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });
    if (!variant) {
      return NextResponse.json({ success: false, message: "Varian tidak ditemukan" }, { status: 404 });
    }

    const productId = variant.productId;

    await prisma.$transaction(async (tx) => {
      // Ambil total stok varian SEBELUM dihapus (untuk log)
      const variantWithSkus = await tx.productVariant.findUnique({
        where: { id: variantId },
        include: { skus: { select: { stock: true } } },
      });
      const stockSebelumHapus = variantWithSkus?.skus.reduce((sum, s) => sum + s.stock, 0) ?? 0;
      const productStockBefore = (await tx.product.findUnique({ where: { id: productId }, select: { stock: true } }))?.stock ?? 0;

      await tx.productVariant.delete({ where: { id: variantId } });

      // Rekalkulasi cached stock
      const totalStock = await tx.productSku.aggregate({
        where: { variant: { productId } },
        _sum: { stock: true },
      });
      const newTotalStock = totalStock._sum.stock ?? 0;
      await tx.product.update({
        where: { id: productId },
        data: { stock: newTotalStock },
      });

      // ─── Log penghapusan Varian (stok hilang) ────────────────────────────────
      if (stockSebelumHapus > 0) {
        const operatorId = req.headers.get("x-user-id") ??
          (await tx.admin.findFirst({ select: { id: true } }))?.id ?? null;

        await tx.stockLog.create({
          data: {
            productId,
            delta: -stockSebelumHapus,
            currentStock: newTotalStock,
            type: "ADJUSTMENT",
            notes: `Hapus Varian "${variant.color}" (${variant.variantCode}) — ${stockSebelumHapus} unit stok dihapus`,
            operatorId,
          },
        });
      }
    });

    return NextResponse.json({ success: true, message: "Varian berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
