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
        isPopular: true,
        isBestseller: true,
        isNew: true,
        productType: true,
        gender: true,
        shortDescription: true,
        avgRating: true,
        totalReviews: true,
        images: { take: 1, select: { id: true, url: true } },
        categories: {
          select: {
            categoryId: true,
            category: { select: { id: true, name: true } },
          },
        },
        detail: { select: { material: true } },
        // Ambil material & basePrice varian aktif (untuk hitung harga terendah + material override)
          variants: {
            where: { isActive: true },
            select: { 
              id: true,
              basePrice: true,
              comparisonPrice: true,
              discountPercent: true,
              isActive: true,
              skus: {
                where: { isActive: true },
                select: {
                  id: true,
                  priceOverride: true,
                  isActive: true
                }
              }
            },
            take: 5,
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
    const features: ProductFeature[] = allProducts.map((product) => {
      // Harga fitur KNN: pakai cached price jika ada, fallback ke varian termurah
      const variantMinPrice = product.variants.length > 0
        ? Math.min(...product.variants.map((v) => Number(v.basePrice)))
        : 0;
      const priceForFeature = product.price ? Number(product.price) : variantMinPrice;

      const materialForFeature = product.detail?.material || "unknown";

      return {
        id: product.id,
        categoryIds: product.categories.map((c) => c.categoryId),
        material: materialForFeature,
        gender: product.gender || "unknown",
        productType: product.productType || "unknown",
        price: priceForFeature,
      };
    });

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
        isPopular: product.isPopular,
        isBestseller: product.isBestseller,
        isNew: product.isNew,
        gender: product.gender,
        productType: product.productType,
        shortDescription: product.shortDescription,
        avgRating: product.avgRating,
        totalReviews: product.totalReviews,
        image: product.images[0]?.url || null,
        categories: product.categories.map((c) => c.category.name),
        variants: product.variants,
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
