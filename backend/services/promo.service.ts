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

export const PromoService = {
  /**
   * Helper untuk memastikan hanya ADMIN yang bisa mengelola promo.
   */
  async verifyAdmin(userId: string | null) {
    if (!userId) throw new Error("Otentikasi diperlukan");
    
    const user = await AdminService.findById(userId);
    if (!user || user.role !== Role.ADMIN) {
      throw new Error("Akses Ditolak: Hanya Admin yang dapat mengelola promo");
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

  async create(data: any, userId: string | null) {
    // ✅ Security: Hanya Admin
    await this.verifyAdmin(userId);

    // ✅ Transformasi Data
    const formattedData = {
      ...data,
      value: Number(data.value),
      minPurchase: Number(data.minPurchase || 0),
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    };

    return await PromoRepository.create(formattedData);
  },

  async update(id: string, data: any, userId: string | null) {
    // ✅ Security: Hanya Admin
    await this.verifyAdmin(userId);

    // ✅ Transformasi Data
    const updateData: any = { ...data };
    if (data.value !== undefined) updateData.value = Number(data.value);
    if (data.minPurchase !== undefined) updateData.minPurchase = Number(data.minPurchase);
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);

    return await PromoRepository.update(id, updateData);
  },

  async delete(id: string, userId: string | null) {
    // ✅ Security: Hanya Admin
    await this.verifyAdmin(userId);

    return await PromoRepository.delete(id);
  },

  async getById(id: string) {
    const promo = await PromoRepository.getById(id);
    if (!promo) return null;

    return {
      ...promo,
      value: Number(promo.value),
      minPurchase: Number(promo.minPurchase || 0)
    };
  }
};
