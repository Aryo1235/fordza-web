/**
 * =============================================================
 * Recommendation Service — Orkestrasi KNN
 * =============================================================
 * 
 * Service layer yang menghubungkan database (Prisma) dengan
 * algoritma KNN dari lib/knn.ts.
 *
 * Alur kerja:
 * 1. Fetch produk target + semua produk aktif dari database
 * 2. Transformasi ke format ProductFeature 
 * 3. Jalankan encoding & normalisasi
 * 4. Hitung jarak dan cari K tetangga terdekat
 * 5. Format output siap pakai frontend
 */

import { prisma } from "@/lib/prisma";
import {
  type ProductFeature,
  extractUniqueDimensions,
  buildProductVectors,
  findKNearest,
} from "@/lib/knn";

export const RecommendationService = {
  /**
   * Mendapatkan rekomendasi produk serupa menggunakan KNN.
   * 
   * @param productId - ID produk yang sedang dilihat user
   * @param k         - Jumlah rekomendasi (default: 4)
   * @returns Object berisi targetProduct dan array recommendations
   */
  async getRecommendations(productId: string, k: number = 4) {
    // -------------------------------------------------------
    // STEP 1: Fetch semua produk aktif dari database
    // -------------------------------------------------------
    const allProducts = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        price: true,
        productType: true,
        gender: true,
        shortDescription: true,
        avgRating: true,
        totalReviews: true,
        // Ambil 1 gambar untuk thumbnail
        images: { take: 1, select: { id: true, url: true } },
        // Kategori produk (untuk encoding)
        categories: {
          select: {
            categoryId: true,
            category: {
              select: { id: true, name: true },
            },
          },
        },
        // Detail produk (untuk material)
        detail: {
          select: { material: true },
        },
      },
    });

    // Cari produk target
    const targetProduct = allProducts.find((p) => p.id === productId);
    if (!targetProduct) {
      return null; // Produk tidak ditemukan
    }

    // Jika jumlah produk kurang dari k+1, kembalikan semua (minus target)
    if (allProducts.length <= 1) {
      return {
        targetProduct: {
          id: targetProduct.id,
          name: targetProduct.name,
        },
        recommendations: [],
      };
    }

    // -------------------------------------------------------
    // STEP 2: Transformasi ke format ProductFeature
    // -------------------------------------------------------
    const features: ProductFeature[] = allProducts.map((product) => ({
      id: product.id,
      categoryIds: product.categories.map((c) => c.categoryId),
      material: product.detail?.material || "unknown", // Default jika tidak ada
      gender: product.gender || "unknown",
      productType: product.productType || "unknown",
      price: Number(product.price), // Decimal → number
    }));

    // -------------------------------------------------------
    // STEP 3 & 4: Dimensi Adaptif & Vektorisasi (One-Hot + Normalisasi)
    // -------------------------------------------------------
    const dimensions = extractUniqueDimensions(features);
    const vectors = buildProductVectors(features, dimensions);

    const kNearest = findKNearest(productId, vectors, k);

    // -------------------------------------------------------
    // STEP 5: Format output — gabungkan data DB + jarak
    // -------------------------------------------------------
    const recommendations = kNearest.map((neighbor) => {
      const product = allProducts.find((p) => p.id === neighbor.id)!;
      return {
        id: product.id,
        name: product.name,
        price: product.price,
        gender: product.gender,
        productType: product.productType,
        shortDescription: product.shortDescription,
        avgRating: product.avgRating,
        totalReviews: product.totalReviews,
        image: product.images[0]?.url || null,
        categories: product.categories.map((c) => c.category.name),
        distance: Math.round(neighbor.distance * 10000) / 10000, // 4 desimal
      };
    });

    return {
      targetProduct: {
        id: targetProduct.id,
        name: targetProduct.name,
      },
      recommendations,
    };
  },
};
