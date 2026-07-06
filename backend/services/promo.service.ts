/**
 * Promo Service
 * ─────────────────────────────────────────────
 * LAYER 2 — BUSINESS LOGIC & SECURITY
 * 
 * Sesuai pakem Fordza, semua validasi role dan transformasi 
 * data dilakukan di sini sebelum ke Repository.
 */

import { PromoRepository } from "@/backend/repositories/promo.repo";
import { AdminService } from "@/backend/services/admin.service";
import { Role } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/error-handler";

export const PromoService = {
  /**
   * Helper untuk memastikan hanya ADMIN yang bisa mengelola promo.
   */
  async verifyAdmin(userId: string | null) {
    if (!userId) {
      throw new AppError("Otentikasi diperlukan", 401, "UNAUTHORIZED");
    }

    const user = await AdminService.findById(userId);
    if (!user || user.role !== Role.ADMIN) {
      throw new AppError("Akses Ditolak: Hanya Admin yang dapat mengelola promo", 403, "FORBIDDEN");
    }
    return user;
  },

  async getAll() {
    const promos = await PromoRepository.getAll();
    // Transformasi Decimal ke Number agar aman diserialisasi ke JSON
    return promos.map(p => ({
      ...p,
      value: Number(p.value),
      minPurchase: Number(p.minPurchase || 0)
    }));
  },

  async getActive() {
    const promos = await PromoRepository.getActive();
    return promos.map(p => ({
      ...p,
      value: Number(p.value),
      minPurchase: Number(p.minPurchase || 0)
    }));
  },

  async validateOverlap(data: any, excludeId?: string) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    // Set endDate ke akhir hari (23:59:59.999) agar pengecekan overlap akurat
    endDate.setHours(23, 59, 59, 999);

    if (data.isActive === false) return;

    // Cari promo lain yang aktif, bertipe target sama, dan rentang tanggalnya bertabrakan
    const overlappingPromos = await prisma.promo.findMany({
      where: {
        id: excludeId ? { not: excludeId } : undefined,
        isActive: true,
        targetType: data.targetType,
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });

    if (overlappingPromos.length === 0) return;

    if (data.targetType === "GLOBAL") {
      throw new AppError(
        `Bentrok: Sudah ada promo GLOBAL aktif ("${overlappingPromos[0].name}") di periode tanggal yang dipilih.`,
        400,
        "BAD_REQUEST"
      );
    }

    // Untuk target non-global (CATEGORY, PRODUCT, VARIANT), cek jika ada ID target yang sama
    const newTargetIds = data.targetIds || [];
    for (const promo of overlappingPromos) {
      const commonIds = promo.targetIds.filter((id: string) => newTargetIds.includes(id));
      if (commonIds.length > 0) {
        throw new AppError(
          `Bentrok: Target promo ini bertabrakan dengan promo aktif "${promo.name}" pada periode tanggal yang dipilih.`,
          400,
          "BAD_REQUEST"
        );
      }
    }
  },

  async create(data: any, userId: string | null) {
    //  Security: Hanya Admin
    await this.verifyAdmin(userId);

    // Normalisasi input tanggal (endDate diset ke jam 23:59:59.999)
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    endDate.setHours(23, 59, 59, 999);

    const formattedData = {
      ...data,
      value: Number(data.value),
      minPurchase: Number(data.minPurchase || 0),
      startDate,
      endDate,
      createdById: userId, // Simpan ID pembuat
    };

    // Validasi bentrok tanggal & target
    await this.validateOverlap(formattedData);

    return await PromoRepository.create(formattedData);
  },

  async update(id: string, data: any, userId: string | null) {
    // Security: Hanya Admin
    await this.verifyAdmin(userId);

    // Ambil data promo saat ini untuk menggabungkan data parsial demi kebutuhan validasi
    const currentPromo = await PromoRepository.getById(id);
    if (!currentPromo) {
      throw new AppError("Promo tidak ditemukan", 404, "NOT_FOUND");
    }

    const startDate = data.startDate ? new Date(data.startDate) : currentPromo.startDate;
    const endDate = data.endDate ? new Date(data.endDate) : currentPromo.endDate;
    
    // Normalisasi endDate ke akhir hari jika diubah atau diperbarui
    endDate.setHours(23, 59, 59, 999);

    const mergedData = {
      targetType: data.targetType ?? currentPromo.targetType,
      targetIds: data.targetIds ?? currentPromo.targetIds,
      startDate,
      endDate,
      isActive: data.isActive !== undefined ? data.isActive : currentPromo.isActive,
    };

    await this.validateOverlap(mergedData, id);

    // Transformasi Data
    const updateData: any = { ...data };
    if (data.value !== undefined) updateData.value = Number(data.value);
    if (data.minPurchase !== undefined) updateData.minPurchase = Number(data.minPurchase);
    if (data.startDate) updateData.startDate = startDate;
    if (data.endDate) updateData.endDate = endDate;
    updateData.updatedById = userId; // Simpan ID pengubah

    return await PromoRepository.update(id, updateData);
  },

  async delete(id: string, userId: string | null) {
    //  Security: Hanya Admin
    await this.verifyAdmin(userId);

    return await PromoRepository.delete(id);
  },

  async getById(id: string) {
    const promo = await PromoRepository.getById(id);
    if (!promo) return null;

    // Resolve target details based on targetType and targetIds
    let targets: Array<{ id: string; name: string; code?: string }> = [];
    if (promo.targetType === "CATEGORY" && promo.targetIds.length > 0) {
      const categories = await prisma.category.findMany({
        where: { id: { in: promo.targetIds } },
        select: {
          id: true,
          name: true,
          _count: {
            select: { products: true }
          }
        }
      });
      targets = categories.map(c => ({
        id: c.id,
        name: c.name,
        code: `${c._count.products} Produk`
      }));
    } else if (promo.targetType === "PRODUCT" && promo.targetIds.length > 0) {
      const products = await prisma.product.findMany({
        where: { id: { in: promo.targetIds } },
        select: { id: true, name: true, productCode: true }
      });
      targets = products.map(p => ({ id: p.id, name: p.name, code: p.productCode }));
    } else if (promo.targetType === "VARIANT" && promo.targetIds.length > 0) {
      const variants = await prisma.productVariant.findMany({
        where: { id: { in: promo.targetIds } },
        select: { id: true, color: true, variantCode: true, product: { select: { name: true } } }
      });
      targets = variants.map(v => ({ id: v.id, name: `${v.product.name} (${v.color})`, code: v.variantCode }));
    }

    const { createdById, updatedById, ...rest } = promo;

    return {
      ...rest,
      value: Number(promo.value),
      minPurchase: Number(promo.minPurchase || 0),
      targets
    };
  },

  async getProductsForPromoSelection(search?: string) {
    return await PromoRepository.getProductsForPromoSelection(search);
  },

  async getCategoriesForPromoSelection() {
    return await PromoRepository.getCategoriesForPromoSelection();
  }
};
