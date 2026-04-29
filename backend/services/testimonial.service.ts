/**
 * Testimonial Service
 * ─────────────────────────────────────────────
 * LAYER 2 — BUSINESS LOGIC
 *
 * INI adalah contoh PALING SEMPURNA perbedaan Service vs Repository
 * yang ada di proyek Fordza Anda:
 *
 * Saat review DIBUAT atau DIHAPUS, rating rata-rata produk HARUS dihitung ulang.
 * Logika orkestasi ini (create → hitung stats → update produk) ada di SINI.
 *
 * Repository hanya bisa melakukan 1 hal dalam 1 waktu.
 * Service yang menggabungkan beberapa aksi Repository menjadi 1 alur bisnis.
 */

import { TestimonialRepository } from "@/backend/repositories/testimonial.repo";
import { ProductRepository } from "@/backend/repositories/products.repo";
import { Prisma } from "@/app/generated/prisma/client";
export const TestimonialService = {
  async getAll(filters: {
    productId?: string;
    rating?: number;
    page?: number;
    limit?: number;
  }) {
    return await TestimonialRepository.getAll(filters);
  },

  async getAllAdmin(filters: {
    productId?: string;
    rating?: number;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    return await TestimonialRepository.getAllAdmin(filters);
  },

  // 🧠 LOGIKA BISNIS: Create + hitung ulang rating
  async create(data: Prisma.TestimonialCreateInput) {
    try {
      // LANGKAH 1: Suruh Repo buat review baru
      const newReview = await TestimonialRepository.create(data);

      // LANGKAH 2: Service menghitung ulang statistik rating
      // (ini business logic, bukan tugas Repo)
      const productId = data.product.connect?.id;
      if (productId) {
        const stats =
          await TestimonialRepository.calculateRatingStats(productId);
        await ProductRepository.updateRating(productId, {
          avgRating: stats._avg.rating || 0,
          totalReviews: stats._count.rating || 0,
        });
      }

      return newReview;
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new Error(
          "Product ID tidak valid. Produk tidak ditemukan di database.",
        );
      }
      throw error;
    }
  },

  // 🧠 LOGIKA BISNIS: Update testimoni + hitung ulang rating
  async update(id: string, data: any) {
    // LANGKAH 1: Cek dulu testimoni ada
    const testimonial = await TestimonialRepository.findById(id);
    if (!testimonial) throw new Error("Testimoni tidak ditemukan");

    // LANGKAH 2: Update
    const updated = await TestimonialRepository.update(id, data);

    // LANGKAH 3: Hitung ulang rating (hanya jika isActive berubah atau rating berubah)
    const stats = await TestimonialRepository.calculateRatingStats(
      testimonial.productId,
    );
    await ProductRepository.updateRating(testimonial.productId, {
      avgRating: stats._avg.rating || 0,
      totalReviews: stats._count.rating || 0,
    });

    return updated;
  },

  // 🧠 LOGIKA BISNIS: Hapus testimoni + hitung ulang rating
  async delete(id: string) {
    // LANGKAH 1: Cek dulu testimoni ada (dan simpan productId-nya)
    const testimonial = await TestimonialRepository.findById(id);
    if (!testimonial) throw new Error("Testimoni tidak ditemukan");

    // LANGKAH 2: Hapus dari database
    await TestimonialRepository.delete(id);

    // LANGKAH 3: Setelah dihapus, hitung ulang rating produk terkait
    const stats = await TestimonialRepository.calculateRatingStats(
      testimonial.productId,
    );
    await ProductRepository.updateRating(testimonial.productId, {
      avgRating: stats._avg.rating || 0,
      totalReviews: stats._count.rating || 0,
    });

    return { deleted: true };
  },

  async getStats(productId?: string) {
    return await TestimonialRepository.getStats(productId);
  },
};
