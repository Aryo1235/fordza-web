import { prisma } from "@/lib/prisma";
import { PromoRepository } from "./promo.repo";

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
    const where: any = { isActive: true };

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
            where: { isActive: true },
            select: { 
              id: true, 
              basePrice: true, 
              comparisonPrice: true, 
              discountPercent: true,
              skus: {
                where: { isActive: true },
                select: { id: true, priceOverride: true }
              }
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
          const gimmickPrice = v.comparisonPrice ? Number(v.comparisonPrice) : null;
          const highestPrice = gimmickPrice && gimmickPrice > basePrice ? gimmickPrice : basePrice;

          let bestPromo: any = activePromos.find(promo => promo.targetType === "VARIANT" && promo.targetIds.includes(v.id));
          if (!bestPromo) {
            bestPromo = activePromos.find(promo => promo.targetType === "PRODUCT" && promo.targetIds.includes(p.id));
          }
          if (!bestPromo) {
            const pCategoryIds = p.categories.map((c: any) => c.categoryId);
            bestPromo = activePromos.find(promo => promo.targetType === "CATEGORY" && promo.targetIds.some(id => pCategoryIds.includes(id)));
          }
          if (!bestPromo) bestPromo = activePromos.find(promo => promo.targetType === "GLOBAL");

          let additionalDiscount = 0;
          let isConditional = false;

          if (bestPromo) {
            if (Number(bestPromo.minPurchase || 0) > 0) {
              isConditional = true;
            } else {
              if (bestPromo.type === "PERCENTAGE") additionalDiscount = (basePrice * Number(bestPromo.value)) / 100;
              else additionalDiscount = Number(bestPromo.value);
            }
          }

          const finalPrice = basePrice - Math.min(additionalDiscount, basePrice);
          let totalDiscountPercent = 0;
          
          let minFinalPrice = finalPrice;

          // Cek SKU untuk mencari harga termurah sesungguhnya
          if (v.skus && v.skus.length > 0) {
            v.skus.forEach((sku: any) => {
              const skuBasePrice = sku.priceOverride ? Number(sku.priceOverride) : basePrice;
              let skuDiscount = additionalDiscount;
              // recalculate discount if percentage based and basePrice shifted
              if (bestPromo && bestPromo.type === "PERCENTAGE") {
                skuDiscount = (skuBasePrice * Number(bestPromo.value)) / 100;
              }
              const skuFinalPrice = skuBasePrice - Math.min(skuDiscount, skuBasePrice);
              if (skuFinalPrice < minFinalPrice) {
                minFinalPrice = skuFinalPrice;
              }
            });
          }

          if (highestPrice > minFinalPrice) {
            totalDiscountPercent = Math.floor(((highestPrice - minFinalPrice) / highestPrice) * 100);
          }

          return {
            ...v,
            basePrice,
            comparisonPrice: gimmickPrice,
            highestPrice,
            finalPrice: minFinalPrice,
            totalDiscountPercent,
            promoName: bestPromo?.name || null,
            promoMinPurchase: bestPromo?.minPurchase ? Number(bestPromo.minPurchase) : 0,
            isPromoConditional: isConditional,
            skus: v.skus.map((sku: any) => ({
              ...sku,
              priceOverride: sku.priceOverride ? Number(sku.priceOverride) : null
            }))
          };
        });

        // Cari varian termurah untuk dijadikan harga display di katalog
        const cheapestVariant = variants.length > 0 
           ? [...variants].sort((a, b) => a.finalPrice - b.finalPrice)[0]
           : null;

        return {
          ...p,
          price: p.price ? Number(p.price) : null,
          variants,
          finalPrice: cheapestVariant ? cheapestVariant.finalPrice : Number(p.price),
          highestPrice: cheapestVariant ? cheapestVariant.highestPrice : Number(p.price),
          totalDiscountPercent: cheapestVariant ? cheapestVariant.totalDiscountPercent : 0,
          promoName: cheapestVariant?.promoName || null
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
          const comparisonPrice = v.comparisonPrice ? Number(v.comparisonPrice) : null;
          let discountPercent = 0;
          if (comparisonPrice && comparisonPrice > basePrice) {
            discountPercent = ((comparisonPrice - basePrice) / comparisonPrice) * 100;
          }

          if (minPrice === null || basePrice < minPrice) minPrice = basePrice;

          const safeColor = typeof v.color === "string" && v.color.trim() !== "" ? v.color : "DEFAULT";
          const suffix = v.colorCode ? v.colorCode.toUpperCase().slice(0, 5) : safeColor.toUpperCase().replace(/\s+/g, "").replace(/[^A-Z0-9]/g, "").slice(0, 3);
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
              create: v.images.map((img: { url: string; key: string }) => ({
                url: img.url,
                key: img.key,
              })),
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
            detail: {
              create: {
                description: data.description || "",
                material: data.material || null,
                outsole: data.outsole || null,
                closureType: data.closureType || null,
                origin: data.origin || null,
                notes: data.notes || null,
                sizeTemplateId: data.sizeTemplateId || null,
              },
            },
            categories: {
              create: data.categoryIds?.map((id: string) => ({ category: { connect: { id } } })) || [],
            },
            images: { create: data.images },
            variants: { create: variantsData },
          },
          include: { images: true, categories: { include: { category: true } }, detail: true },
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
      throw new Error(`Gagal menyimpan produk: ${error.message}`);
    }
  },

  async getById(id: string) {
    const product: any = await prisma.product.findUnique({
      where: { id },
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
        categories: { select: { category: { select: { id: true, name: true, imageUrl: true } } } },
        detail: {
            select: {
                description: true,
                notes: true,
                material: true,
                outsole: true,
                closureType: true,
                origin: true,
                sizeTemplateId: true,
                sizeTemplate: { select: { id: true, name: true, type: true, sizes: true } },
            },
        },
        variants: {
          where: { isActive: true },
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
              where: { isActive: true },
              orderBy: { size: "asc" },
              select: { id: true, size: true, stock: true, priceOverride: true, isActive: true, variantId: true },
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
        const highestPrice = gimmickPrice && gimmickPrice > basePrice ? gimmickPrice : basePrice;

        let bestPromo: any = activePromos.find(promo => promo.targetType === "VARIANT" && promo.targetIds.includes(v.id));
        if (!bestPromo) {
            bestPromo = activePromos.find(promo => promo.targetType === "PRODUCT" && promo.targetIds.includes(product.id));
        }
        if (!bestPromo) {
            const pCategoryIds = product.categories.map((c: any) => c.category.id);
            bestPromo = activePromos.find(promo => promo.targetType === "CATEGORY" && promo.targetIds.some(id => pCategoryIds.includes(id)));
        }
        if (!bestPromo) bestPromo = activePromos.find(promo => promo.targetType === "GLOBAL");

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
            const skuBasePrice = sku.priceOverride ? Number(sku.priceOverride) : basePrice;
            // Jika ada promo, potong harga SKU (Bigsize) dengan persentase promo varian
            const skuFinalPrice = skuBasePrice * (1 - (promoDiscountPercent / 100));
            return {
                ...sku,
                priceOverride: sku.priceOverride ? Number(sku.priceOverride) : null,
                finalPrice: Math.round(skuFinalPrice)
            };
        });

        let totalDiscountPercent = 0;
        if (highestPrice > finalPrice) {
            totalDiscountPercent = Math.floor(((highestPrice - finalPrice) / highestPrice) * 100);
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
            promoMinPurchase: bestPromo?.minPurchase ? Number(bestPromo.minPurchase) : 0,
            isPromoConditional: isConditional,
            skus
        };
    });

        // Tentukan info harga utama produk (berdasarkan varian termurah)
        const cheapestVariant = variants.length > 0 
           ? [...variants].sort((a, b) => a.finalPrice - b.finalPrice)[0]
           : null;

        return {
            ...product,
            variants,
            finalPrice: cheapestVariant ? cheapestVariant.finalPrice : Number(product.price),
            highestPrice: cheapestVariant ? cheapestVariant.highestPrice : Number(product.price),
            totalDiscountPercent: cheapestVariant ? cheapestVariant.totalDiscountPercent : 0,
            promoName: cheapestVariant?.promoName || null
        };
  },

  async getRelated(productId: string, limit: number = 4) {
    const currentProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: { categories: true },
    });
    if (!currentProduct) return [];
    const categoryIds = currentProduct.categories.map((p) => p.categoryId);
    const primaryRelated = await prisma.product.findMany({
      where: {
        id: { not: productId },
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
        where: { id: { notIn: excludedIds }, isActive: true, gender: currentProduct.gender },
        include: { images: true, categories: { include: { category: true } } },
        orderBy: [{ isBestseller: "desc" }, { createdAt: "desc" }],
        take: needed,
      });
      return [...primaryRelated, ...fallbackProducts];
    }
    return primaryRelated;
  },

  async getAllAdmin(filters: any) {
    const { search, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { productCode: { contains: search, mode: "insensitive" } },
      ];
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
          gender: true,
          isPopular: true,
          isBestseller: true,
          isNew: true,
          isActive: true,
          avgRating: true,
          totalReviews: true,
          createdAt: true,
          updatedAt: true,
          categories: { select: { category: { select: { id: true, name: true } } } },
          detail: { select: { material: true, outsole: true } },
          variants: {
            where: { isActive: true },
            select: {
              id: true,
              color: true,
              variantCode: true,
              basePrice: true,
              comparisonPrice: true,
              discountPercent: true,
              skus: { 
                where: { isActive: true }, 
                select: { id: true, size: true, stock: true, priceOverride: true }, 
                orderBy: { size: "asc" } 
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
          const gimmickPrice = v.comparisonPrice ? Number(v.comparisonPrice) : null;
          const highestPrice = gimmickPrice && gimmickPrice > basePrice ? gimmickPrice : basePrice;

          let bestPromo: any = activePromos.find(promo => promo.targetType === "VARIANT" && promo.targetIds.includes(v.id));
          if (!bestPromo) {
            bestPromo = activePromos.find(promo => promo.targetType === "PRODUCT" && promo.targetIds.includes(p.id));
          }
          if (!bestPromo) {
            const pCategoryIds = p.categories.map((c: any) => c.categoryId);
            bestPromo = activePromos.find(promo => promo.targetType === "CATEGORY" && promo.targetIds.some(id => pCategoryIds.includes(id)));
          }
          if (!bestPromo) bestPromo = activePromos.find(promo => promo.targetType === "GLOBAL");

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

          const finalPrice = basePrice - Math.min(additionalDiscount, basePrice);

          // --- LOGIKA BARU UNTUK KASIR: Terapkan promo ke SKU (Bigsize) ---
          const skus = v.skus.map((sku: any) => {
              const skuBasePrice = sku.priceOverride ? Number(sku.priceOverride) : basePrice;
              const skuFinalPrice = skuBasePrice * (1 - (promoDiscountPercent / 100));
              return {
                  ...sku,
                  finalPrice: Math.round(skuFinalPrice)
              };
          });

          let totalDiscountPercent = 0;
          if (highestPrice > finalPrice) {
            totalDiscountPercent = Math.floor(((highestPrice - finalPrice) / highestPrice) * 100);
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
              priceOverride: sku.priceOverride ? Number(sku.priceOverride) : null,
              finalPrice: Math.round((sku.priceOverride ? Number(sku.priceOverride) : basePrice) * (1 - (promoDiscountPercent / 100)))
            }))
          };
        });

        // Tentukan info harga terendah produk untuk di tabel
        const cheapestVariant = variants.length > 0 
           ? [...variants].sort((a, b) => a.finalPrice - b.finalPrice)[0]
           : null;

        return {
          ...p,
          price: p.price ? Number(p.price) : null,
          variants,
          finalPrice: cheapestVariant ? cheapestVariant.finalPrice : Number(p.price),
          highestPrice: cheapestVariant ? cheapestVariant.highestPrice : Number(p.price),
          totalDiscountPercent: cheapestVariant ? cheapestVariant.totalDiscountPercent : 0,
          promoName: cheapestVariant?.promoName || null
        };
      }),
      meta: { totalItems, totalPage: Math.ceil(totalItems / limit), currentPage: page, limit },
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
        categories: { select: { category: { select: { id: true, name: true } } } },
        variants: {
          select: {
            id: true,
            color: true,
            variantCode: true,
            skus: { select: { id: true, size: true, stock: true }, orderBy: { size: "asc" } },
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

      // --- 1. UPDATE FIELD LEVEL PRODUK (termasuk gender) ---
      const updateData: any = {};
      const topLevelFields = [
        "productCode", "name", "shortDescription", "productType",
        "gender",  // ← PENTING: gender harus ada di sini
        "isPopular", "isBestseller", "isNew", "isActive",
      ];
      for (const f of topLevelFields) if (data[f] !== undefined) updateData[f] = data[f];
      await tx.product.update({ where: { id }, data: updateData });

      // --- 2. UPDATE DETAIL PRODUK ---
      const detailFields = ["description", "material", "outsole", "closureType", "origin", "notes", "sizeTemplateId"];
      const hasDetailChange = detailFields.some((f) => data[f] !== undefined);
      if (hasDetailChange) {
        const detailUpdate: any = {};
        const detailCreate: any = { productId: id, description: data.description || "" };
        for (const f of detailFields) {
          if (data[f] !== undefined) {
            const val = f === "sizeTemplateId" ? data[f] || null : data[f];
            detailUpdate[f] = val;
            detailCreate[f] = val;
          }
        }
        await tx.productDetail.upsert({ where: { productId: id }, update: detailUpdate, create: detailCreate });
      }

      // --- 3. UPDATE KATEGORI ---
      if (data.categoryIds && data.categoryIds.length > 0) {
        await tx.productCategory.deleteMany({ where: { productId: id } });
        await tx.productCategory.createMany({ data: data.categoryIds.map((categoryId: string) => ({ productId: id, categoryId })) });
      }

      // --- 4. TAMBAH GAMBAR PRODUK BARU ---
      if (data.images && data.images.length > 0) {
        await tx.productImage.createMany({
          data: data.images.map((img: { url: string; key: string }) => ({ productId: id, url: img.url, key: img.key })),
        });
      }

      // --- 5. SINKRONISASI STOK & HARGA (BAGIAN BARU) ---
      // Ambil semua SKU aktif setelah semua perubahan di atas selesai
      const allActiveSkus = await tx.productSku.findMany({
        where: { variant: { productId: id }, isActive: true },
        include: { variant: { select: { color: true } } },
      });

      const newTotalStock = allActiveSkus.reduce((sum, sku) => sum + sku.stock, 0);
      const previousTotalStock = existing.stock ?? 0;
      const stockDelta = newTotalStock - previousTotalStock;

      // Ambil harga terendah dari semua varian aktif untuk update kolom `price` di Product
      const allActiveVariants = await tx.productVariant.findMany({
        where: { productId: id, isActive: true },
        select: { basePrice: true },
        orderBy: { basePrice: "asc" },
      });
      const newMinPrice = allActiveVariants.length > 0 ? Number(allActiveVariants[0].basePrice) : null;

      // Update Product.stock dan Product.price (cached fields) sekaligus
      await tx.product.update({
        where: { id },
        data: {
          stock: newTotalStock,
          price: newMinPrice,
        },
      });

      // --- 6. BUAT LOG STOK JIKA ADA PERUBAHAN (Auto-Log untuk History) ---
      // operatorId berasal dari parameter fungsi (dikirim via header x-user-id di API route)
      if (stockDelta !== 0) {
        // Ambil operator pertama jika tidak diisi (fallback)
        let effectiveOperatorId: string | null = operatorId ?? null;
        if (!effectiveOperatorId) {
          const firstAdmin = await tx.admin.findFirst({ select: { id: true } });
          effectiveOperatorId = firstAdmin?.id ?? null;
        }

        // Buat SkuStockLog untuk setiap SKU yang stoknya berubah
        // Karena update produk (bukan opname), kita catat ADJUSTMENT sebagai sinyal
        // bahwa ada varian/SKU baru yang ditambahkan atau harga berubah.
        // NOTE: Stok per-SKU tidak berubah saat edit produk biasa, hanya struktur.
        // Log ini berfungsi sebagai "marker" bahwa produk diperbarui.
        await tx.stockLog.create({
          data: {
            productId: id,
            delta: stockDelta,
            currentStock: newTotalStock,
            type: "ADJUSTMENT",
            notes: `Rekap Stok setelah Update Produk oleh Admin (delta: ${stockDelta > 0 ? "+" : ""}${stockDelta})`,
            operatorId: effectiveOperatorId,
          },
        });
      }

      // Kembalikan produk terbaru dengan semua relasi
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


  async delete(id: string) {
    return await prisma.product.update({ where: { id }, data: { isActive: false } });
  },

  async updateRating(id: string, data: { avgRating: number; totalReviews: number }) {
    return await prisma.product.update({ where: { id }, data });
  },

  async getForKasir(filters: { search: string; page: number; limit: number }) {
    const { search, page, limit } = filters;
    const skip = (page - 1) * limit;

    const activePromos = await PromoRepository.getActive();

    const calculatePromo = (product: any, variantId: string, basePrice: number) => {
      let bestPromo: any = null;
      // 1. VARIANT (Prioritas Tertinggi)
      bestPromo = activePromos.find(p => p.targetType === "VARIANT" && p.targetIds.includes(variantId));

      // 2. PRODUCT
      if (!bestPromo) {
        bestPromo = activePromos.find(p => p.targetType === "PRODUCT" && p.targetIds.includes(product.id));
      }

      // 3. CATEGORY
      if (!bestPromo) {
        const pCategoryIds = product.categories.map((c: any) => c.categoryId);
        bestPromo = activePromos.find(p => p.targetType === "CATEGORY" && p.targetIds.some(id => pCategoryIds.includes(id)));
      }

      // 4. GLOBAL
      if (!bestPromo) bestPromo = activePromos.find(p => p.targetType === "GLOBAL");
      if (!bestPromo) return { amount: 0, percent: 0, name: null };

      let amount = 0;
      let percent = 0;
      if (bestPromo.type === "PERCENTAGE") {
        percent = Number(bestPromo.value);
        amount = (basePrice * percent) / 100;
      } else {
        amount = Number(bestPromo.value);
        percent = (amount / basePrice) * 100;
      }

      return { amount: Math.min(amount, basePrice), percent, name: bestPromo.name };
    };

    const where: any = {
      isActive: true,
      OR: search ? [
        { name: { contains: search, mode: "insensitive" } },
        { productCode: { contains: search, mode: "insensitive" } },
        { categories: { some: { category: { name: { contains: search, mode: "insensitive" } } } } },
      ] : undefined,
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where, skip, take: limit,
        select: {
          id: true, productCode: true, name: true, price: true, stock: true, gender: true, productType: true,
          images: { select: { url: true }, take: 1 },
          categories: { select: { categoryId: true }, take: 10 },
          variants: {
            where: { isActive: true }, orderBy: { createdAt: "asc" },
            select: {
              id: true, variantCode: true, color: true, basePrice: true, comparisonPrice: true, discountPercent: true,
              images: { select: { url: true }, take: 1 },
              skus: { where: { isActive: true }, orderBy: { size: "asc" }, select: { id: true, size: true, stock: true, priceOverride: true } },
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
          id: p.id, productCode: p.productCode, name: p.name,
          price: hasVariants ? Math.min(...p.variants.map((v) => Number(v.basePrice))) : Number(p.price ?? 0),
          stock: p.stock, gender: p.gender, productType: p.productType, imageUrl: p.images[0]?.url ?? null, hasVariants,
          variants: p.variants.map((v: any) => {
            const basePrice = Number(v.basePrice);
            const { amount, percent, name } = calculatePromo(p, v.id, basePrice);
            
            // --- LOGIKA CERDAS: Hitung finalPrice untuk tiap SKU ---
            const skus = v.skus.map((s: any) => {
                const skuBasePrice = s.priceOverride ? Number(s.priceOverride) : basePrice;
                const skuFinalPrice = skuBasePrice * (1 - (percent / 100));
                return {
                    ...s,
                    finalPrice: Math.round(skuFinalPrice)
                };
            });

            return {
              id: v.id, variantCode: v.variantCode, color: v.color, basePrice,
              comparisonPrice: v.comparisonPrice ? Number(v.comparisonPrice) : null,
              additionalDiscount: amount, 
              promoName: name, 
              promoDiscountPercent: percent, // Tambahkan persentase untuk frontend
              finalPrice: basePrice - amount,
              discountPercent: v.discountPercent, 
              images: v.images,
              skus
            };
          }),
        };
      }),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  },

  async bulkUpdateStock(items: { id: string; stock: number }[], operatorId?: string) {
    return await prisma.$transaction(async (tx) => {
      const results = [];
      for (const item of items) {
        const sku = await tx.productSku.findUnique({
          where: { id: item.id },
          include: { variant: { select: { productId: true, color: true } } },
        });
        if (sku) {
          const delta = item.stock - sku.stock;
          if (delta === 0) continue;
          const updated = await tx.productSku.update({ where: { id: item.id }, data: { stock: item.stock } });
          const totalStock = await tx.productSku.aggregate({ where: { variant: { productId: sku.variant.productId } }, _sum: { stock: true } });
          const newTotal = totalStock._sum.stock ?? 0;
          await tx.product.update({ where: { id: sku.variant.productId }, data: { stock: newTotal } });
          await tx.skuStockLog.create({
            data: { skuId: sku.id, delta, currentStock: item.stock, size: sku.size, color: sku.variant.color, type: "ADJUSTMENT", notes: "Stok Opname Massal", operatorId: operatorId || null },
          });
          await tx.stockLog.create({
            data: { productId: sku.variant.productId, delta, currentStock: newTotal, type: "ADJUSTMENT", notes: `Opname SKU ${sku.variant.color} - Ukuran ${sku.size}`, operatorId: operatorId || null },
          });
          results.push(updated);
        } else {
          const product = await tx.product.findUnique({ where: { id: item.id } });
          if (!product) continue;
          const delta = item.stock - product.stock;
          if (delta === 0) continue;
          const updated = await tx.product.update({ where: { id: item.id }, data: { stock: item.stock } });
          await tx.stockLog.create({
            data: { productId: item.id, delta, currentStock: item.stock, type: "ADJUSTMENT", notes: "Stok Opname Massal (Produk Langsung)", operatorId: operatorId || null },
          });
          results.push(updated);
        }
      }
      return results;
    });
  },
};
