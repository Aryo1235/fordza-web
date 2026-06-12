import { prisma } from "@/lib/prisma";
import { PromoRepository } from "./promo.repo";
import { AppError } from "@/lib/error-handler";

/**
 * Pilih varian representatif untuk ditampilkan di kartu katalog.
 * Logika: ambil finalPrice terendah. Jika ada beberapa varian dengan
 * finalPrice yang sama, prioritaskan yang punya highestPrice (comparisonPrice) tertinggi
 * agar harga coret yang paling relevan yang tampil di catalog card.
 */
function pickRepresentativeVariant(variants: any[]): any | null {
  if (!variants || variants.length === 0) return null;
  const minFinalPrice = Math.min(...variants.map((v) => v.finalPrice));
  const cheapestCandidates = variants.filter((v) => v.finalPrice === minFinalPrice);
  // Dari kandidat termurah, pilih yang punya highestPrice tertinggi
  // (berarti ada comparisonPrice yang lebih besar)
  return cheapestCandidates.reduce((best, v) =>
    v.highestPrice > best.highestPrice ? v : best
  );
}

export const ProductRepository = {
  async getAll(filters: any) {
    const {
      search,
      categoryIds,
      gender,
      isPopular,
      isBestseller,
      isNew,
      minPrice,
      maxPrice,
      sortBy,
      page = 1,
      limit = 10,
    } = filters;

    const skip = (page - 1) * limit;
    const where: any = {
      isActive: true,
      deletedAt: null,
      variants: {
        some: {
          isActive: true,
          deletedAt: null,
          skus: {
            some: {
              isActive: true,
              deletedAt: null
            }
          }
        }
      }
    };

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    if (categoryIds && categoryIds.length > 0) {
      where.categories = {
        some: {
          categoryId: { in: categoryIds },
        },
      };
    }

    if (gender) where.gender = gender;
    if (isPopular) where.isPopular = true;
    if (isBestseller) where.isBestseller = true;
    if (isNew) where.isNew = true;

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = { gte: minPrice || 0, lte: maxPrice || 999999999 };
    }

    let orderBy: any = { createdAt: "desc" };
    if (sortBy === "cheapest") orderBy = { price: "asc" };
    if (sortBy === "expensive") orderBy = { price: "desc" };

    const [products, totalItems] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          shortDescription: true,
          price: true,
          productType: true,
          gender: true,
          isPopular: true,
          isBestseller: true,
          isNew: true,
          isActive: true,
          avgRating: true,
          totalReviews: true,
          createdAt: true,
          variants: {
            where: { isActive: true, deletedAt: null },
            select: {
              id: true,
              basePrice: true,
              comparisonPrice: true,
              discountPercent: true,
              skus: {
                where: { isActive: true, deletedAt: null },
                select: { id: true, priceOverride: true },
              },
            },
          },
          images: { take: 1, select: { id: true, url: true } },
          categories: {
            select: {
              category: {
                select: { id: true, name: true },
              },
            },
          },
          detail: {
            select: { material: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    const activePromos = await PromoRepository.getActive();

    return {
      products: products.map((p: any) => {
        const variants = p.variants.map((v: any) => {
          const basePrice = Number(v.basePrice);
          const gimmickPrice = v.comparisonPrice
            ? Number(v.comparisonPrice)
            : null;
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
                promo.targetIds.includes(p.id),
            );
          }
          if (!bestPromo) {
            const pCategoryIds = p.categories.map((c: any) => c.categoryId);
            bestPromo = activePromos.find(
              (promo) =>
                promo.targetType === "CATEGORY" &&
                promo.targetIds.some((id) => pCategoryIds.includes(id)),
            );
          }
          if (!bestPromo)
            bestPromo = activePromos.find(
              (promo) => promo.targetType === "GLOBAL",
            );

          let additionalDiscount = 0;
          let isConditional = false;

          if (bestPromo) {
            console.log(`🎁 [ProductRepo] Variant "${v.color}":`, {
              promoName: bestPromo.name,
              minPurchase: bestPromo.minPurchase,
              type: bestPromo.type,
              value: bestPromo.value,
            });

            if (Number(bestPromo.minPurchase || 0) > 0) {
              // ✅ FIX: Promo conditional, jangan apply discount di product list
              isConditional = true;
              console.log(`✅ [ProductRepo] Promo CONDITIONAL - discount TIDAK apply di product list`);
              // additionalDiscount tetap 0, akan di-apply saat checkout
            } else {
              // Promo non-conditional, langsung apply
              if (bestPromo.type === "PERCENTAGE")
                additionalDiscount =
                  (basePrice * Number(bestPromo.value)) / 100;
              else additionalDiscount = Number(bestPromo.value);
              console.log(`✅ [ProductRepo] Promo NON-CONDITIONAL - discount apply: ${additionalDiscount}`);
            }
          }

          // ✅ FIX: finalPrice hanya apply discount jika non-conditional
          const finalPrice = isConditional
            ? basePrice
            : basePrice - Math.min(additionalDiscount, basePrice);

          console.log(`💰 [ProductRepo] Variant "${v.color}":`, {
            basePrice,
            isConditional,
            additionalDiscount,
            finalPrice,
          });

          let totalDiscountPercent = 0;

          let minFinalPrice = finalPrice;

          // Cek SKU untuk mencari harga termurah sesungguhnya
          if (v.skus && v.skus.length > 0) {
            v.skus.forEach((sku: any) => {
              const skuBasePrice = sku.priceOverride
                ? Number(sku.priceOverride)
                : basePrice;
              let skuDiscount = 0;

              // ✅ FIX: Hanya hitung discount jika promo non-conditional
              if (!isConditional && bestPromo) {
                if (bestPromo.type === "PERCENTAGE") {
                  skuDiscount = (skuBasePrice * Number(bestPromo.value)) / 100;
                } else {
                  skuDiscount = Number(bestPromo.value);
                }
              }

              const skuFinalPrice =
                skuBasePrice - Math.min(skuDiscount, skuBasePrice);
              if (skuFinalPrice < minFinalPrice) {
                minFinalPrice = skuFinalPrice;
              }
            });
          }

          if (highestPrice > minFinalPrice) {
            totalDiscountPercent = Math.round(
              ((highestPrice - minFinalPrice) / highestPrice) * 100,
            );
          }

          return {
            ...v,
            basePrice,
            comparisonPrice: gimmickPrice,
            highestPrice,
            finalPrice: minFinalPrice,
            totalDiscountPercent,
            promoName: bestPromo?.name || null,
            promoMinPurchase: bestPromo?.minPurchase
              ? Number(bestPromo.minPurchase)
              : null, // ✅ FIX: Return null instead of 0
            isPromoConditional: isConditional,
            skus: v.skus.map((sku: any) => ({
              ...sku,
              priceOverride: sku.priceOverride
                ? Number(sku.priceOverride)
                : null,
            })),
          };
        });

        // Cari varian representatif: finalPrice terendah, lalu prioritaskan
        // yang punya highestPrice (comparisonPrice) terbesar jika ada seri harga yang sama
        const cheapestVariant = pickRepresentativeVariant(variants);

        return {
          ...p,
          price: p.price ? Number(p.price) : null,
          variants,
          finalPrice: cheapestVariant
            ? cheapestVariant.finalPrice
            : Number(p.price),
          highestPrice: cheapestVariant
            ? cheapestVariant.highestPrice
            : Number(p.price),
          totalDiscountPercent: cheapestVariant
            ? cheapestVariant.totalDiscountPercent
            : 0,
          promoName: cheapestVariant?.promoName || null,
        };
      }),
      meta: {
        totalItems,
        totalPage: Math.ceil(totalItems / limit),
        currentPage: page,
        limit,
      },
    };
  },

  async create(data: any) {
    try {
      return await prisma.$transaction(async (tx) => {
        let totalStock = 0;
        let minPrice: number | null = null;

        const variantsData = (data.variants || []).map((v: any) => {
          let variantStock = 0;
          const skusData = (v.skus || []).map((s: any) => {
            variantStock += Number(s.stock) || 0;
            return {
              size: s.size,
              stock: Number(s.stock) || 0,
              priceOverride: s.priceOverride ? Number(s.priceOverride) : null,
              isActive: s.isActive ?? true,
            };
          });
          totalStock += variantStock;

          const basePrice = Number(v.basePrice) || 0;
          const comparisonPrice = v.comparisonPrice
            ? Number(v.comparisonPrice)
            : null;
          let discountPercent = 0;
          if (comparisonPrice && comparisonPrice > basePrice) {
            discountPercent =
              ((comparisonPrice - basePrice) / comparisonPrice) * 100;
          }

          if (minPrice === null || basePrice < minPrice) minPrice = basePrice;

          const safeColor =
            typeof v.color === "string" && v.color.trim() !== ""
              ? v.color
              : "DEFAULT";
          const suffix = v.colorCode
            ? v.colorCode.toUpperCase().slice(0, 5)
            : safeColor
              .toUpperCase()
              .replace(/\s+/g, "")
              .replace(/[^A-Z0-9]/g, "")
              .slice(0, 3);
          const variantCode = `${data.productCode}-${suffix}`;

          return {
            variantCode,
            color: v.color,
            basePrice,
            comparisonPrice,
            discountPercent: discountPercent > 0 ? discountPercent : null,
            isActive: true,
            skus: { create: skusData },
            images: {
              create: (v.images || []).map(
                (img: { url: string; key: string }) => ({
                  url: img.url,
                  key: img.key,
                }),
              ),
            },
          };
        });

        const product = await tx.product.create({
          data: {
            id: data.id,
            productCode: data.productCode,
            name: data.name,
            shortDescription: data.shortDescription,
            price: minPrice,
            stock: totalStock,
            productType: data.productType,
            gender: data.gender,
            isPopular: data.isPopular,
            isBestseller: data.isBestseller,
            isNew: data.isNew,
            isActive: data.isActive ?? true,
            createdById: data.operatorId,
            updatedById: data.operatorId,
            detail: {
              create: {
                description: data.description || "",
                material: data.material || null,
                outsole: data.outsole || null,
                insole: data.insole || null,
                closureType: data.closureType || null,
                origin: data.origin || null,
                notes: data.notes || null,
                sizeTemplateId: data.sizeTemplateId || null,
                // Ukuran kustom terisolasi per-produk
                customSizes: data.customSizes || [],
                customMeasurements: data.customMeasurements || undefined,
              },
            },
            categories: {
              create: (data.categoryIds || []).map((id: string) => ({
                category: { connect: { id } },
              })),
            },
            images: {
              create: (data.images || []).map(
                (img: { url: string; key: string }) => ({
                  url: img.url,
                  key: img.key,
                }),
              ),
            },
            variants: { create: variantsData },
          },
          include: {
            images: true,
            categories: { include: { category: true } },
            detail: true,
          },
        });

        let effectiveOperatorId = data.operatorId;
        if (!effectiveOperatorId) {
          const firstAdmin = await tx.admin.findFirst({ select: { id: true } });
          effectiveOperatorId = firstAdmin?.id;
        }

        if (effectiveOperatorId && product.id) {
          const createdSkus = await tx.productSku.findMany({
            where: { variant: { productId: product.id } },
            include: { variant: true },
          });

          if (createdSkus.length > 0) {
            const logsData = createdSkus.map((sku) => ({
              skuId: sku.id,
              delta: sku.stock,
              currentStock: sku.stock,
              size: sku.size,
              color: sku.variant.color,
              type: "RESTOCK" as const,
              notes: "Stok Awal Produk (System Auto-Log)",
              operatorId: effectiveOperatorId,
            }));

            await tx.skuStockLog.createMany({ data: logsData });
            const totalDelta = logsData.reduce((sum, l) => sum + l.delta, 0);
            await tx.stockLog.create({
              data: {
                productId: product.id,
                delta: totalDelta,
                currentStock: product.stock,
                type: "RESTOCK",
                notes: "Restock Awal Produk (Master Log)",
                operatorId: effectiveOperatorId,
              },
            });
          }
        }
        return product;
      });
    } catch (error: any) {
      throw error;
    }
  },

  async getById(id: string) {
    const product: any = await prisma.product.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        productCode: true,
        name: true,
        shortDescription: true,
        price: true,
        stock: true,
        productType: true,
        gender: true,
        isPopular: true,
        isBestseller: true,
        isNew: true,
        isActive: true,
        avgRating: true,
        totalReviews: true,
        createdAt: true,
        images: { select: { id: true, url: true, key: true } },
        categories: {
          select: {
            category: { select: { id: true, name: true, imageUrl: true } },
          },
        },
        detail: {
          select: {
            description: true,
            notes: true,
            material: true,
            outsole: true,
            insole: true,
            closureType: true,
            origin: true,
            sizeTemplateId: true,
            customSizes: true,
            customMeasurements: true,
            sizeTemplate: {
              select: { id: true, name: true, type: true, sizes: true, measurements: true },
            },
          },
        },
        variants: {
          where: { isActive: true, deletedAt: null },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            variantCode: true,
            color: true,
            basePrice: true,
            comparisonPrice: true,
            discountPercent: true,
            isActive: true,
            images: { select: { id: true, url: true } },
            skus: {
              where: { isActive: true, deletedAt: null },
              orderBy: { size: "asc" },
              select: {
                id: true,
                size: true,
                stock: true,
                priceOverride: true,
                isActive: true,
                variantId: true,
              },
            },
          },
        },
      },
    });

    if (!product) return null;

    const activePromos = await PromoRepository.getActive();

    // Map variant dengan logika promo agregasi
    const variants = product.variants.map((v: any) => {
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
            promo.targetIds.includes(product.id),
        );
      }
      if (!bestPromo) {
        const pCategoryIds = product.categories.map((c: any) => c.category.id);
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
      let promoDiscountPercent = 0; // Simpan persentase diskon promo murni

      if (bestPromo) {
        if (Number(bestPromo.minPurchase || 0) > 0) {
          isConditional = true;
        } else {
          if (bestPromo.type === "PERCENTAGE") {
            promoDiscountPercent = Number(bestPromo.value);
            additionalDiscount = (basePrice * promoDiscountPercent) / 100;
          } else {
            additionalDiscount = Number(bestPromo.value);
            // Hitung ekuivalen persentase untuk promo nominal (opsional tapi berguna)
            promoDiscountPercent = (additionalDiscount / basePrice) * 100;
          }
        }
      }

      const finalPrice = basePrice - Math.min(additionalDiscount, basePrice);

      // --- LOGIKA BARU: Terapkan promo ke setiap SKU (Bigsize) ---
      const skus = v.skus.map((sku: any) => {
        const skuBasePrice = sku.priceOverride
          ? Number(sku.priceOverride)
          : basePrice;
        // Jika ada promo, potong harga SKU (Bigsize) dengan persentase promo varian
        const skuFinalPrice = skuBasePrice * (1 - promoDiscountPercent / 100);
        return {
          ...sku,
          priceOverride: sku.priceOverride ? Number(sku.priceOverride) : null,
          finalPrice: Math.round(skuFinalPrice),
        };
      });

      let totalDiscountPercent = 0;
      if (highestPrice > finalPrice) {
        totalDiscountPercent = Math.round(
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
        promoDiscountPercent, // Kirim persentase promo murni ke frontend
        promoName: bestPromo?.name || null,
        promoMinPurchase: bestPromo?.minPurchase
          ? Number(bestPromo.minPurchase)
          : 0,
        isPromoConditional: isConditional,
        skus,
      };
    });

    // Tentukan info harga utama produk (berdasarkan varian representatif)
    const cheapestVariant = pickRepresentativeVariant(variants);

    return {
      ...product,
      variants,
      finalPrice: cheapestVariant
        ? cheapestVariant.finalPrice
        : Number(product.price),
      highestPrice: cheapestVariant
        ? cheapestVariant.highestPrice
        : Number(product.price),
      totalDiscountPercent: cheapestVariant
        ? cheapestVariant.totalDiscountPercent
        : 0,
      promoName: cheapestVariant?.promoName || null,
    };
  },

  async getRelated(productId: string, limit: number = 4) {
    const currentProduct = await prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
      include: { categories: true },
    });
    if (!currentProduct) return [];
    const categoryIds = currentProduct.categories.map((p) => p.categoryId);
    const primaryRelated = await prisma.product.findMany({
      where: {
        id: { not: productId },
        deletedAt: null,
        isActive: true,
        gender: currentProduct.gender,
        categories: { some: { categoryId: { in: categoryIds } } },
      },
      include: { images: true, categories: { include: { category: true } } },
      orderBy: [{ isBestseller: "desc" }, { createdAt: "desc" }],
      take: limit,
    });
    if (primaryRelated.length < limit) {
      const needed = limit - primaryRelated.length;
      const excludedIds = [productId, ...primaryRelated.map((p) => p.id)];
      const fallbackProducts = await prisma.product.findMany({
        where: {
          id: { notIn: excludedIds },
          isActive: true,
          gender: currentProduct.gender,
          deletedAt: null,
        },
        include: { images: true, categories: { include: { category: true } } },
        orderBy: [{ isBestseller: "desc" }, { createdAt: "desc" }],
        take: needed,
      });
      return [...primaryRelated, ...fallbackProducts];
    }
    return primaryRelated;
  },

  async getAllAdmin(filters: any) {
    const { search, categoryId, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;
    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { productCode: { contains: search, mode: "insensitive" } },
      ];
    }
    if (categoryId) {
      where.categories = {
        some: {
          categoryId: categoryId,
        },
      };
    }
    const [products, totalItems] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          productCode: true,
          name: true,
          shortDescription: true,
          price: true,
          stock: true,
          productType: true,

          isPopular: true,
          isBestseller: true,
          isNew: true,
          isActive: true,

          createdAt: true,
          updatedAt: true,
          categories: {
            select: { category: { select: { id: true, name: true } } },
          },
          detail: { select: { material: true, outsole: true, insole: true } },
          variants: {
            where: { isActive: true, deletedAt: null },
            select: {
              id: true,
              color: true,
              variantCode: true,
              basePrice: true,
              comparisonPrice: true,
              discountPercent: true,
              skus: {
                where: { isActive: true, deletedAt: null },
                select: {
                  id: true,
                  size: true,
                  stock: true,
                  priceOverride: true,
                },
                orderBy: { size: "asc" },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);
    const activePromos = await PromoRepository.getActive();

    return {
      products: products.map((p: any) => {
        const variants = p.variants.map((v: any) => {
          const basePrice = Number(v.basePrice);
          const gimmickPrice = v.comparisonPrice
            ? Number(v.comparisonPrice)
            : null;
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
                promo.targetIds.includes(p.id),
            );
          }
          if (!bestPromo) {
            const pCategoryIds = p.categories.map((c: any) => c.categoryId);
            bestPromo = activePromos.find(
              (promo) =>
                promo.targetType === "CATEGORY" &&
                promo.targetIds.some((id) => pCategoryIds.includes(id)),
            );
          }
          if (!bestPromo)
            bestPromo = activePromos.find(
              (promo) => promo.targetType === "GLOBAL",
            );

          let additionalDiscount = 0;
          let isConditional = false;
          let promoDiscountPercent = 0;

          if (bestPromo) {
            if (Number(bestPromo.minPurchase || 0) > 0) {
              isConditional = true;
            } else {
              if (bestPromo.type === "PERCENTAGE") {
                promoDiscountPercent = Number(bestPromo.value);
                additionalDiscount = (basePrice * promoDiscountPercent) / 100;
              } else {
                additionalDiscount = Number(bestPromo.value);
                promoDiscountPercent = (additionalDiscount / basePrice) * 100;
              }
            }
          }

          const finalPrice =
            basePrice - Math.min(additionalDiscount, basePrice);

          // --- LOGIKA BARU UNTUK KASIR: Terapkan promo ke SKU (Bigsize) ---
          const skus = v.skus.map((sku: any) => {
            const skuBasePrice = sku.priceOverride
              ? Number(sku.priceOverride)
              : basePrice;
            const skuFinalPrice =
              skuBasePrice * (1 - promoDiscountPercent / 100);
            return {
              ...sku,
              finalPrice: Math.round(skuFinalPrice),
            };
          });

          let totalDiscountPercent = 0;
          if (highestPrice > finalPrice) {
            totalDiscountPercent = Math.round(
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
            promoDiscountPercent,
            promoName: bestPromo?.name || null,
            isPromoConditional: isConditional,
            skus: v.skus.map((sku: any) => ({
              ...sku,
              priceOverride: sku.priceOverride
                ? Number(sku.priceOverride)
                : null,
              finalPrice: Math.round(
                (sku.priceOverride ? Number(sku.priceOverride) : basePrice) *
                (1 - promoDiscountPercent / 100),
              ),
            })),
          };
        });

        // Tentukan info harga terendah produk untuk di tabel
        const cheapestVariant =
          variants.length > 0
            ? [...variants].sort((a, b) => a.finalPrice - b.finalPrice)[0]
            : null;

        return {
          id: p.id,
          productCode: p.productCode,
          name: p.name,
          productType: p.productType,
          categories: p.categories,
          detail: p.detail,
          stock: p.stock,
          isActive: p.isActive,
          price: p.price ? Number(p.price) : null,
          variantCount: variants.length,
          finalPrice: cheapestVariant
            ? cheapestVariant.finalPrice
            : Number(p.price),
          promoName: cheapestVariant?.promoName || null,
          // Sertakan variants+skus untuk kebutuhan halaman Stock Opname
          variants: variants.map((v: any) => ({
            id: v.id,
            color: v.color,
            variantCode: v.variantCode,
            basePrice: v.basePrice,
            skus: (v.skus || []).map((sku: any) => ({
              id: sku.id,
              size: sku.size,
              stock: sku.stock,
              priceOverride: sku.priceOverride ?? null,
            })),
          })),
        };
      }),
      meta: {
        totalItems,
        totalPage: Math.ceil(totalItems / limit),
        currentPage: page,
        limit,
      },
    };
  },

  async getAllAdminExport(filters: any) {
    const { search } = filters;
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { productCode: { contains: search, mode: "insensitive" } },
      ];
    }
    return await prisma.product.findMany({
      where,
      select: {
        id: true,
        productCode: true,
        name: true,
        shortDescription: true,
        price: true,
        stock: true,
        productType: true,
        gender: true,
        isPopular: true,
        isBestseller: true,
        isNew: true,
        isActive: true,
        avgRating: true,
        totalReviews: true,
        createdAt: true,
        updatedAt: true,
        categories: {
          select: { category: { select: { id: true, name: true } } },
        },
        variants: {
          select: {
            id: true,
            color: true,
            variantCode: true,
            skus: {
              select: { id: true, size: true, stock: true },
              orderBy: { size: "asc" },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async update(id: string, data: any, operatorId?: string) {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.product.findUnique({ where: { id } });
      if (!existing) throw new Error("Produk tidak ditemukan");

      // --- 1. UPDATE FIELD LEVEL PRODUK ---
      const updateData: any = {};
      const topLevelFields = [
        "productCode",
        "name",
        "shortDescription",
        "productType",
        "gender",
        "isPopular",
        "isBestseller",
        "isNew",
        "isActive",
      ];
      for (const f of topLevelFields)
        if (data[f] !== undefined) updateData[f] = data[f];

      // LOGIKA BARU: Jika menonaktifkan produk, matikan juga semua varian & SKU di bawahnya (Eksplisit)
      const isDeactivating = data.isActive === false && existing.isActive === true;
      const isReactivating = data.isActive === true && existing.isActive === false;

      if (operatorId) {
        updateData.updatedById = operatorId;
      }

      await tx.product.update({ where: { id }, data: updateData });

      if (isDeactivating) {
        // Matikan semua varian & SKU
        await tx.productVariant.updateMany({
          where: { productId: id, deletedAt: null },
          data: { isActive: false },
        });
        await tx.productSku.updateMany({
          where: { variant: { productId: id }, deletedAt: null },
          data: { isActive: false },
        });
      }

      // --- 2. UPDATE DETAIL PRODUK ---
      const detailFields = [
        "description",
        "material",
        "outsole",
        "insole",
        "closureType",
        "origin",
        "notes",
        "sizeTemplateId",
        "customSizes",
        "customMeasurements",
      ];
      const hasDetailChange = detailFields.some((f) => data[f] !== undefined);
      if (hasDetailChange) {
        const detailUpdate: any = {};
        const detailCreate: any = {
          productId: id,
          description: data.description || "",
        };
        for (const f of detailFields) {
          if (data[f] !== undefined) {
            const val = f === "sizeTemplateId" ? data[f] || null : data[f];
            detailUpdate[f] = val;
            detailCreate[f] = val;
          }
        }
        await tx.productDetail.upsert({
          where: { productId: id },
          update: detailUpdate,
          create: detailCreate,
        });
      }

      // --- 3. UPDATE KATEGORI ---
      if (data.categoryIds && data.categoryIds.length > 0) {
        await tx.productCategory.deleteMany({ where: { productId: id } });
        await tx.productCategory.createMany({
          data: data.categoryIds.map((categoryId: string) => ({
            productId: id,
            categoryId,
          })),
        });
      }

      // --- 4. TAMBAH GAMBAR PRODUK BARU ---
      if (data.images && data.images.length > 0) {
        await tx.productImage.createMany({
          data: data.images.map((img: { url: string; key: string }) => ({
            productId: id,
            url: img.url,
            key: img.key,
          })),
        });
      }

      // --- 5. SINKRONISASI STOK & HARGA (LOGIKA SELLABLE) ---
      // Ambil status isActive terbaru (dari input atau existing)
      const currentIsActive = data.isActive !== undefined ? data.isActive : existing.isActive;

      let newTotalStock = 0;
      let allActiveSkus: any[] = [];

      // Stok hanya dihitung jika produk AKTIF
      if (currentIsActive) {
        allActiveSkus = await tx.productSku.findMany({
          where: {
            isActive: true,
            deletedAt: null,
            variant: {
              productId: id,
              isActive: true,
              deletedAt: null,
            },
          },
          include: { variant: { select: { color: true } } },
        });
        newTotalStock = allActiveSkus.reduce((sum, sku) => sum + sku.stock, 0);
      }

      const previousTotalStock = existing.stock ?? 0;
      const stockDelta = newTotalStock - previousTotalStock;

      // Harga terendah (hanya dari varian aktif)
      const allActiveVariants = await tx.productVariant.findMany({
        where: { productId: id, isActive: true, deletedAt: null },
        select: { basePrice: true },
        orderBy: { basePrice: "asc" },
      });
      const newMinPrice = allActiveVariants.length > 0 ? Number(allActiveVariants[0].basePrice) : null;

      await tx.product.update({
        where: { id },
        data: {
          stock: newTotalStock,
          price: newMinPrice,
        },
      });

      // --- 6. LOGGING AUDIT (CATATAN KHUSUS) ---
      let effectiveOperatorId: string | null = operatorId ?? null;
      if (!effectiveOperatorId) {
        const firstAdmin = await tx.admin.findFirst({ select: { id: true } });
        effectiveOperatorId = firstAdmin?.id ?? null;
      }

      if (isDeactivating) {
        // Log penonaktifan massal untuk semua SKU yang sebelumnya aktif
        const skusToLog = await tx.productSku.findMany({
          where: { variant: { productId: id }, deletedAt: null },
          include: { variant: { select: { color: true } } },
        });

        const skuLogs = skusToLog.map((sku) => ({
          skuId: sku.id,
          delta: -sku.stock,
          currentStock: 0,
          size: sku.size,
          color: sku.variant.color,
          type: "ADJUSTMENT" as const,
          notes: "Produk Dinonaktifkan (Cascading)",
          operatorId: effectiveOperatorId,
        })).filter(l => l.delta !== 0);

        if (skuLogs.length > 0) await tx.skuStockLog.createMany({ data: skuLogs });

        await tx.stockLog.create({
          data: {
            productId: id,
            delta: -previousTotalStock,
            currentStock: 0,
            type: "ADJUSTMENT",
            notes: "Produk Dinonaktifkan oleh Admin",
            operatorId: effectiveOperatorId,
          },
        });
      } else if (stockDelta !== 0) {
        // Log perubahan stok biasa (adjustment/restock)
        await tx.stockLog.create({
          data: {
            productId: id,
            delta: stockDelta,
            currentStock: newTotalStock,
            type: stockDelta > 0 ? "RESTOCK" : "ADJUSTMENT",
            notes: `Rekap Stok setelah Update Produk (delta: ${stockDelta > 0 ? "+" : ""}${stockDelta})`,
            operatorId: effectiveOperatorId,
          },
        });
      }

      return await tx.product.findUnique({
        where: { id },
        include: {
          images: true,
          categories: { include: { category: true } },
          detail: { include: { sizeTemplate: true } },
          variants: { include: { skus: true, images: true } },
        },
      });
    });
  },

  async delete(id: string, operatorId?: string) {
    const now = new Date();
    return await prisma.$transaction(async (tx) => {
      // 0. Ambil info stok lama untuk log
      const existing = await tx.product.findUnique({ where: { id }, select: { stock: true } });
      const previousStock = existing?.stock ?? 0;

      // 1. Ambil semua ID varian untuk produk ini
      const variants = await tx.productVariant.findMany({
        where: { productId: id },
        select: { id: true, color: true },
      });
      const variantIds = variants.map((v) => v.id);

      if (variantIds.length > 0) {
        // 2. Ambil SKU aktif untuk log sebelum dimatikan
        const skusToLog = await tx.productSku.findMany({
          where: { variantId: { in: variantIds }, isActive: true, deletedAt: null },
        });

        let effectiveOperatorId = operatorId || null;
        if (!effectiveOperatorId) {
          const firstAdmin = await tx.admin.findFirst({ select: { id: true } });
          effectiveOperatorId = firstAdmin?.id ?? null;
        }

        const skuLogs = skusToLog.map(sku => ({
          skuId: sku.id,
          delta: -sku.stock,
          currentStock: 0,
          size: sku.size,
          color: variants.find(v => v.id === sku.variantId)?.color || "Unknown",
          type: "ADJUSTMENT" as const,
          notes: "Produk Dihapus (Soft Delete)",
          operatorId: effectiveOperatorId,
        }));

        if (skuLogs.length > 0) await tx.skuStockLog.createMany({ data: skuLogs });

        // 3. Soft delete semua SKU & Varian
        await tx.productSku.updateMany({
          where: { variantId: { in: variantIds } },
          data: { isActive: false, deletedAt: now },
        });

        await tx.productVariant.updateMany({
          where: { productId: id },
          data: { isActive: false, deletedAt: now },
        });

        if (previousStock > 0) {
          await tx.stockLog.create({
            data: {
              productId: id,
              delta: -previousStock,
              currentStock: 0,
              type: "ADJUSTMENT",
              notes: "Produk Dihapus (Soft Delete)",
              operatorId: effectiveOperatorId,
            },
          });
        }
      }

      // 4. Soft delete produk utama + Reset sellable stock ke 0
      return await tx.product.update({
        where: { id },
        data: { isActive: false, deletedAt: now, stock: 0 },
      });
    });
  },

  async updateRating(
    id: string,
    data: { avgRating: number; totalReviews: number },
  ) {
    return await prisma.product.update({ where: { id }, data });
  },

  async getForKasir(filters: { search: string; page: number; limit: number }) {
    const { search, page, limit } = filters;
    const skip = (page - 1) * limit;

    const activePromos = await PromoRepository.getActive();

    const calculatePromo = (
      product: any,
      variantId: string,
      basePrice: number,
    ) => {
      let bestPromo: any = null;
      // 1. VARIANT (Prioritas Tertinggi)
      bestPromo = activePromos.find(
        (p) => p.targetType === "VARIANT" && p.targetIds.includes(variantId),
      );

      // 2. PRODUCT
      if (!bestPromo) {
        bestPromo = activePromos.find(
          (p) => p.targetType === "PRODUCT" && p.targetIds.includes(product.id),
        );
      }

      // 3. CATEGORY
      if (!bestPromo) {
        const pCategoryIds = product.categories.map((c: any) => c.categoryId);
        bestPromo = activePromos.find(
          (p) =>
            p.targetType === "CATEGORY" &&
            p.targetIds.some((id) => pCategoryIds.includes(id)),
        );
      }

      // 4. GLOBAL
      if (!bestPromo)
        bestPromo = activePromos.find((p) => p.targetType === "GLOBAL");

      if (!bestPromo) return { amount: 0, percent: 0, name: null, minPurchase: null, isConditional: false };

      // Cek apakah promo conditional (minPurchase > 0)
      const minPurchase = Number(bestPromo.minPurchase || 0);
      const isConditional = minPurchase > 0;

      let amount = 0;
      let percent = 0;
      if (bestPromo.type === "PERCENTAGE") {
        percent = Number(bestPromo.value);
        amount = (basePrice * percent) / 100;
      } else {
        amount = Number(bestPromo.value);
        percent = (amount / basePrice) * 100;
      }

      console.log(`🎁 [getForKasir] calculatePromo:`, {
        promoName: bestPromo.name,
        minPurchase,
        isConditional,
        basePrice,
        amount,
        percent,
      });

      return {
        amount: Math.min(amount, basePrice),
        percent,
        name: bestPromo.name,
        minPurchase: minPurchase > 0 ? minPurchase : null,
        isConditional,
      };
    };

    const where: any = {
      isActive: true,
      deletedAt: null,
      OR: search
        ? [
          { name: { contains: search, mode: "insensitive" } },
          { productCode: { contains: search, mode: "insensitive" } },
          {
            categories: {
              some: {
                category: { name: { contains: search, mode: "insensitive" } },
              },
            },
          },
        ]
        : undefined,
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          productCode: true,
          name: true,
          price: true,
          stock: true,
          gender: true,
          productType: true,
          images: { select: { url: true }, take: 1 },
          categories: { select: { categoryId: true }, take: 10 },
          variants: {
            where: { isActive: true, deletedAt: null },
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              variantCode: true,
              color: true,
              basePrice: true,
              comparisonPrice: true,
              discountPercent: true,
              images: { select: { url: true }, take: 1 },
              skus: {
                where: { isActive: true, deletedAt: null },
                orderBy: { size: "asc" },
                select: {
                  id: true,
                  size: true,
                  stock: true,
                  priceOverride: true,
                },
              },
            },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products: products.map((p) => {
        const hasVariants = p.variants.length > 0;
        return {
          id: p.id,
          productCode: p.productCode,
          name: p.name,
          price: hasVariants
            ? Math.min(...p.variants.map((v) => Number(v.basePrice)))
            : Number(p.price ?? 0),
          stock: p.stock,
          gender: p.gender,
          productType: p.productType,
          imageUrl: p.images[0]?.url ?? null,
          hasVariants,
          variants: p.variants.map((v: any) => {
            const basePrice = Number(v.basePrice);
            const { amount, percent, name, minPurchase, isConditional } = calculatePromo(
              p,
              v.id,
              basePrice,
            );

            // --- LOGIKA CERDAS: Hitung finalPrice untuk tiap SKU ---
            const skus = v.skus.map((s: any) => {
              const skuBasePrice = s.priceOverride
                ? Number(s.priceOverride)
                : basePrice;
              // Jika conditional, finalPrice di catalog = skuBasePrice (jangan dipotong)
              const skuFinalPrice = isConditional
                ? skuBasePrice
                : skuBasePrice * (1 - percent / 100);
              return {
                ...s,
                finalPrice: Math.round(skuFinalPrice),
              };
            });

            // Jika conditional, finalPrice di catalog = basePrice (jangan dipotong)
            const finalPrice = isConditional ? basePrice : (basePrice - amount);

            return {
              id: v.id,
              variantCode: v.variantCode,
              color: v.color,
              basePrice,
              comparisonPrice: v.comparisonPrice
                ? Number(v.comparisonPrice)
                : null,
              additionalDiscount: amount, // Selalu berisi nilai diskon potensial!
              promoName: name,
              promoMinPurchase: minPurchase, // ✅ Tambah minPurchase
              promoDiscountPercent: percent, // Tambahkan persentase untuk frontend
              finalPrice,
              discountPercent: v.discountPercent,
              images: v.images,
              skus,
            };
          }),
        };
      }),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  },

  /**
   * Endpoint ringan khusus "Cek Stok Cepat" di dialog POS.
   * Hanya mengembalikan field minimal yang dibutuhkan: id, productCode, name, category, stock.
   * Tidak meng-query variants, skus, promo, images, gender, productType sama sekali.
   */
  async getForStockCheck(filters: { search: string; page: number; limit: number }) {
    const { search, page, limit } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
      deletedAt: null,
      OR: search
        ? [
            { name: { contains: search, mode: "insensitive" } },
            { productCode: { contains: search, mode: "insensitive" } },
          ]
        : undefined,
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          productCode: true,
          name: true,
          stock: true,
          categories: {
            take: 1,
            select: {
              category: { select: { name: true } },
            },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products: products.map((p) => ({
        id: p.id,
        productCode: p.productCode,
        name: p.name,
        stock: p.stock,
        category: p.categories[0]?.category.name ?? null,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async bulkImport(products: any[], operatorId?: string) {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[],
    };

    // Pre-fetch all categories and templates for fast lookup
    const [allCategories, allTemplates] = await Promise.all([
      prisma.category.findMany({ select: { id: true, name: true } }),
      prisma.sizeTemplate.findMany({ select: { id: true, name: true } }),
    ]);

    for (const productData of products) {
      try {
        // --- SMART LOOKUP CATEGORIES ---
        const resolvedCategoryIds = [];
        if (productData.categoryIds && Array.isArray(productData.categoryIds)) {
          for (const inputId of productData.categoryIds) {
            const trimmed = inputId.trim();
            // Cek apakah ini ID yang valid
            const exists = allCategories.find((c) => c.id === trimmed);
            if (exists) {
              resolvedCategoryIds.push(exists.id);
            } else {
              // Jika bukan ID, cari berdasarkan nama (case-insensitive)
              const byName = allCategories.find(
                (c) => c.name.toLowerCase() === trimmed.toLowerCase(),
              );
              if (byName) resolvedCategoryIds.push(byName.id);
            }
          }
        }

        // --- SMART LOOKUP SIZE TEMPLATE ---
        let resolvedTemplateId = productData.sizeTemplateId;
        if (resolvedTemplateId) {
          const trimmed = resolvedTemplateId.trim();
          const exists = allTemplates.find((t) => t.id === trimmed);
          if (!exists) {
            const byName = allTemplates.find(
              (t) => t.name.toLowerCase() === trimmed.toLowerCase(),
            );
            if (byName) resolvedTemplateId = byName.id;
          }
        }

        await this.create({
          ...productData,
          categoryIds: resolvedCategoryIds,
          sizeTemplateId: resolvedTemplateId,
          isActive: false,
          operatorId,
        });
        results.success++;
      } catch (error: any) {
        results.failed++;

        let friendlyMessage = "Gagal memproses data produk";

        if (error.code === "P2002") {
          friendlyMessage = "Kode Produk ini sudah ada di database (Duplicate)";
        } else if (error.code === "P2003") {
          // Check if it's template or category
          if (error.message && error.message.includes("size_template")) {
            friendlyMessage = "Size Template tidak ditemukan di sistem";
          } else if (error.message && error.message.includes("category")) {
            friendlyMessage = "Kategori tidak ditemukan di sistem";
          } else {
            friendlyMessage = "Data referensi tidak valid atau tidak ditemukan";
          }
        } else if (error.message) {
          // Extract just the last part of Prisma error if possible, or give generic
          friendlyMessage = "Data tidak valid atau terjadi kesalahan server";
        }

        results.errors.push({
          productCode: productData.productCode,
          message: friendlyMessage,
        });
      }
    }

    return results;
  },
};
