import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSkuSchema = z.object({
  stock: z.coerce.number().int().min(0).optional(),
  priceOverride: z.coerce.number().min(0).optional().nullable(),
  isActive: z.boolean().optional(),
});

// PATCH /api/admin/skus/[skuId] — Update stok atau harga override 1 SKU
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ skuId: string }> }
) {
  try {
    const { skuId } = await params;
    const body = await req.json();

    const validation = updateSkuSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const sku = await prisma.$transaction(async (tx) => {
      const existing = await tx.productSku.findUnique({
        where: { id: skuId },
        include: { variant: { select: { productId: true, color: true } } },
      });
      if (!existing) throw new Error("SKU tidak ditemukan");

      const delta = validation.data.stock !== undefined ? (validation.data.stock - existing.stock) : 0;

      const updated = await tx.productSku.update({
        where: { id: skuId },
        data: validation.data,
        include: { variant: { select: { productId: true } } },
      });

      // Rekalkulasi cached stock
      const totalStock = await tx.productSku.aggregate({
        where: { variant: { productId: updated.variant.productId } },
        _sum: { stock: true },
      });
      
      const newTotalStock = totalStock._sum.stock ?? 0;
      await tx.product.update({
        where: { id: updated.variant.productId },
        data: { stock: newTotalStock },
      });

      // ─── Logging Penyesuaian Manual ──────────────────────────────────────────
      if (delta !== 0) {
        let effectiveOperatorId = (req as any).adminId; // Depends on auth middleware
        if (!effectiveOperatorId) {
          const firstAdmin = await tx.admin.findFirst({ select: { id: true } });
          effectiveOperatorId = firstAdmin?.id;
        }

        await tx.skuStockLog.create({
          data: {
            skuId: updated.id,
            delta,
            currentStock: updated.stock,
            size: updated.size,
            color: existing.variant.color,
            type: delta > 0 ? "RESTOCK" : "ADJUSTMENT",
            notes: "Penyesuaian Stok Manual (Admin)",
            operatorId: effectiveOperatorId,
          },
        });

        // Dual Logging
        await tx.stockLog.create({
          data: {
            productId: updated.variant.productId,
            delta,
            currentStock: newTotalStock,
            type: delta > 0 ? "RESTOCK" : "ADJUSTMENT",
            notes: `Adjustment Ukuran ${updated.size} (${existing.variant.color})`,
            operatorId: effectiveOperatorId,
          },
        });
      }

      return updated;
    });

    return NextResponse.json({ success: true, data: sku });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/skus/[skuId] — Hapus 1 SKU
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ skuId: string }> }
) {
  try {
    const { skuId } = await params;

    await prisma.$transaction(async (tx) => {
      const sku = await tx.productSku.findUnique({
        where: { id: skuId },
        include: { variant: { select: { productId: true } } },
      });
      if (!sku) throw new Error("SKU tidak ditemukan");

      await tx.productSku.delete({ where: { id: skuId } });

      const totalStock = await tx.productSku.aggregate({
        where: { variant: { productId: sku.variant.productId } },
        _sum: { stock: true },
      });
      await tx.product.update({
        where: { id: sku.variant.productId },
        data: { stock: totalStock._sum.stock ?? 0 },
      });
    });

    return NextResponse.json({ success: true, message: "SKU berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
