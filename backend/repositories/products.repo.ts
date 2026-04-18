import { prisma } from "@/lib/prisma";

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

    // Search Name
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    // Filter Pivot Category
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
          // Ambil info diskon varian termurah untuk "coretan harga" di produk card
          variants: {
            where: { isActive: true },
            select: { basePrice: true, discountPercent: true },
            orderBy: { basePrice: "asc" },
            take: 1,
          },
          // Hanya ambil 1 gambar pertama (untuk thumbnail card)
          images: { take: 1, select: { id: true, url: true } },
          // Hanya ambil nama kategori (tanpa imageUrl/imageKey)
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

    return {
      products: products.map((p: any) => ({
        ...p,
        price: p.price ? Number(p.price) : null,
        variants: p.variants.map((v: any) => ({
          ...v,
          basePrice: Number(v.basePrice),
          comparisonPrice: v.comparisonPrice ? Number(v.comparisonPrice) : null,
        })),
      })),
      meta: {
        totalItems,
        totalPage: Math.ceil(totalItems / limit),
        currentPage: page,
        limit,
      },
    };
  },

  async create(data: any) {
    console.log("=== 🚀 MULAI CREATE PRODUCT ===");
    console.log("1. Data mentah dari frontend:", JSON.stringify(data, null, 2));
    // 🛑 TAMBAHKAN VALIDASI KETAT DI SINI 🛑
    if (data.variants && data.variants.length > 0) {
      for (const [index, v] of data.variants.entries()) {
        const variantName = v.color || `ke-${index + 1}`;

        // Cek apakah array images tidak ada, kosong, atau isinya undefined
        const hasValidImage =
          v.images &&
          v.images.length > 0 &&
          v.images[0].url &&
          v.images[0].url.trim() !== "";

        if (!hasValidImage) {
          // Lemparkan error yang bisa dibaca oleh frontend
          throw new Error(
            `Gambar untuk varian warna "${variantName}" wajib diupload!`,
          );
        }
      }
    }
    try {
      return await prisma.$transaction(async (tx) => {
        let totalStock = 0;
        let minPrice: number | null = null;

        console.log("2. Memproses Varian...");
        const variantsData = (data.variants || []).map(
          (v: any, index: number) => {
            console.log(
              `-> Varian index ${index}:`,
              JSON.stringify({
                color: v.color,
                colorCode: v.colorCode,
                basePrice: v.basePrice,
              }),
            );

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

            // Mencegah NaN
            const basePrice = Number(v.basePrice) || 0;
            const comparisonPrice = v.comparisonPrice
              ? Number(v.comparisonPrice)
              : null;
            let discountPercent = 0;

            if (comparisonPrice && comparisonPrice > basePrice) {
              discountPercent =
                ((comparisonPrice - basePrice) / comparisonPrice) * 100;
            }

            if (minPrice === null || basePrice < minPrice) {
              minPrice = basePrice;
            }

            // Fallback string untuk mencegah TypeError toUpperCase()
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
                create: v.images.map((img: { url: string; key: string }) => ({
                  url: img.url,
                  key: img.key,
                })),
              },
            };
          },
        );

        console.log(
          "3. Data varian berhasil diproses. Bersiap insert ke tabel Product...",
        );
        console.log("- Total Stock dihitung:", totalStock);
        console.log("- Min Price dihitung:", minPrice);

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
              create:
                data.categoryIds?.map((id: string) => ({
                  category: { connect: { id } },
                })) || [],
            },
            images: {
              create: data.images,
            },
            variants: {
              create: variantsData,
            },
          },
          include: {
            images: true,
            categories: { include: { category: true } },
            detail: true,
          },
        });

        console.log("4. Produk utama berhasil dibuat dengan ID:", product.id);
        console.log("5. Memproses pencatatan log stok awal...");

        let effectiveOperatorId = data.operatorId;
        if (!effectiveOperatorId) {
          const firstAdmin = await tx.admin.findFirst({ select: { id: true } });
          effectiveOperatorId = firstAdmin?.id;
          console.log(
            "- Fallback Operator ID (First Admin):",
            effectiveOperatorId,
          );
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

            await tx.skuStockLog.createMany({
              data: logsData,
            });

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
            console.log("6. Log stok awal berhasil dicatat.");
          }
        }

        console.log("=== ✅ CREATE PRODUCT SUKSES ===");
        return product;
      });
    } catch (error: any) {
      console.error("=== ❌ ERROR DI CREATE PRODUCT ===");
      console.error("Pesan Error Asli:", error.message);
      if (error.code) console.error("Kode Error Prisma:", error.code);
      if (error.meta) console.error("Meta Data Error:", error.meta);

      // Melempar error kembali agar API Route merespons dengan status 500 yang sesuai
      throw new Error(`Gagal menyimpan produk: ${error.message}`);
    }
  },

  async getById(id: string) {
    return await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        productCode: true,
        name: true,
        shortDescription: true,
        price: true, // Cached harga terendah dari varian
        stock: true, // Cached total stok semua SKU
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
            closureType: true,
            origin: true,
            sizeTemplate: {
              select: { id: true, name: true, type: true, sizes: true },
            },
          },
        },
        // Varian warna + SKU ukuran (untuk VariantManager & POS)
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
        testimonials: {
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
          take: 3,
          select: {
            id: true,
            customerName: true,
            rating: true,
            content: true,
            createdAt: true,
          },
        },
      },
    });
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
        where: {
          id: { notIn: excludedIds },
          isActive: true,
          gender: currentProduct.gender,
        },
        include: { images: true, categories: { include: { category: true } } },
        orderBy: [{ isBestseller: "desc" }, { createdAt: "desc" }],
        take: needed,
      });

      return [...primaryRelated, ...fallbackProducts];
    }
    return primaryRelated;
  },

  // --- Admin: List semua produk (termasuk inactive) ---
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
          images: { take: 1, select: { id: true, url: true } },
          categories: {
            select: {
              category: { select: { id: true, name: true } },
            },
          },
          detail: {
            select: { material: true, outsole: true },
          },
          variants: {
            where: { isActive: true },
            select: {
              id: true,
              color: true,
              basePrice: true,
              comparisonPrice: true,
              discountPercent: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products: products.map((p: any) => ({
        ...p,
        price: p.price ? Number(p.price) : null,
        variants: p.variants.map((v: any) => ({
          ...v,
          basePrice: Number(v.basePrice),
          comparisonPrice: v.comparisonPrice ? Number(v.comparisonPrice) : null,
        })),
      })),
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
        images: { take: 1, select: { id: true, url: true } },
        categories: {
          select: {
            category: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  // --- Update Produk ---
  async update(id: string, data: any, operatorId?: string) {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.product.findUnique({ where: { id } });
      if (!existing) throw new Error("Produk tidak ditemukan");

      // 1. Update data produk utama (field yang bisa diubah dari form induk)
      // price & stock TIDAK termasuk — dikelola otomatis via varian
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
      for (const f of topLevelFields) {
        if (data[f] !== undefined) updateData[f] = data[f];
      }

      const product = await tx.product.update({
        where: { id },
        data: updateData,
      });

      // 2. Update detail (upsert — buat jika belum ada)
      const detailFields = [
        "description",
        "material",
        "outsole",
        "closureType",
        "origin",
        "notes",
        "sizeTemplateId",
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
            detailUpdate[f] =
              f === "sizeTemplateId" ? data[f] || null : data[f];
            detailCreate[f] =
              f === "sizeTemplateId" ? data[f] || null : data[f];
          }
        }
        await tx.productDetail.upsert({
          where: { productId: id },
          update: detailUpdate,
          create: detailCreate,
        });
      }

      // 3. Update kategori
      if (data.categoryIds && data.categoryIds.length > 0) {
        await tx.productCategory.deleteMany({ where: { productId: id } });
        await tx.productCategory.createMany({
          data: data.categoryIds.map((categoryId: string) => ({
            productId: id,
            categoryId,
          })),
        });
      }

      // 4. Tambah gambar baru
      if (data.images && data.images.length > 0) {
        await tx.productImage.createMany({
          data: data.images.map((img: { url: string; key: string }) => ({
            productId: id,
            url: img.url,
            key: img.key,
          })),
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

  // --- Soft Delete ---
  async delete(id: string) {
    return await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  },

  // --- Update Rating (dipanggil oleh TestimonialService setelah review dibuat/dihapus) ---
  async updateRating(
    id: string,
    data: { avgRating: number; totalReviews: number },
  ) {
    return await prisma.product.update({
      where: { id },
      data,
    });
  },

  // --- Kasir: produk aktif + varian + SKU (untuk layar POS) ---
  async getForKasir(filters: { search: string; page: number; limit: number }) {
    const { search, page, limit } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
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
          price: true, // Cached min price (untuk display card)
          stock: true, // Cached total stok
          gender: true,
          productType: true,
          images: { select: { url: true }, take: 1 },
          categories: {
            select: { category: { select: { name: true } } },
            take: 1,
          },
          // Varian + SKU: dibutuhkan oleh VariantPickerModal di POS
          variants: {
            where: { isActive: true },
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              color: true,
              basePrice: true,
              comparisonPrice: true,
              discountPercent: true,
              images: { select: { url: true }, take: 1 },
              skus: {
                where: { isActive: true },
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
        // Harga display: jika ada varian, ambil dari varian termurah
        const displayPrice = hasVariants
          ? Math.min(...p.variants.map((v) => Number(v.basePrice)))
          : Number(p.price ?? 0);

        return {
          id: p.id,
          productCode: p.productCode,
          name: p.name,
          price: displayPrice,
          stock: p.stock,
          gender: p.gender,
          productType: p.productType,
          imageUrl: p.images[0]?.url ?? null,
          category: p.categories[0]?.category.name ?? null,
          hasVariants,
          variants: p.variants.map((v) => ({
            id: v.id,
            color: v.color,
            basePrice: Number(v.basePrice),
            discountPercent: v.discountPercent,
            images: v.images,
            skus: v.skus.map((s) => ({
              id: s.id,
              size: s.size,
              stock: s.stock,
              priceOverride: s.priceOverride ? Number(s.priceOverride) : null,
            })),
          })),
        };
      }),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  },

  // bulkUpdateStock: untuk Stok Opname (update stok per SKU)
  // Catatan: method ini masih update level product (untuk produk tanpa varian).
  // Untuk produk dengan varian, gunakan /api/admin/skus/[skuId] (PATCH).
  async bulkUpdateStock(
    items: { id: string; stock: number }[],
    operatorId?: string,
  ) {
    return await prisma.$transaction(async (tx) => {
      const results = [];
      for (const item of items) {
        const existing = await tx.product.findUnique({
          where: { id: item.id },
        });
        if (!existing) continue;

        const delta = item.stock - existing.stock;
        const updated = await tx.product.update({
          where: { id: item.id },
          data: { stock: item.stock },
        });

        if (delta !== 0) {
          await tx.stockLog.create({
            data: {
              productId: item.id,
              delta,
              currentStock: item.stock,
              type: delta > 0 ? "RESTOCK" : "ADJUSTMENT",
              notes:
                delta > 0
                  ? "Barang masuk (Bulk)"
                  : "Penyesuaian stok manual (Stok Opname)",
              operatorId: operatorId || null,
            },
          });
        }
        results.push(updated);
      }
      return results;
    });
  },
};
