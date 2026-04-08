import { prisma } from "@/lib/prisma";

export const ProductService = {
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
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
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
      // LANGSUNG TEMBAK KE DATABASE (Tanpa Cek Dulu)
      return await prisma.product.create({
        data: {
          name: data.name,
          shortDescription: data.shortDescription,
          price: data.price,
          stock: data.stock ?? 0,
          productType: data.productType,
          gender: data.gender,
          isPopular: data.isPopular,
          isBestseller: data.isBestseller,
          isNew: data.isNew,
          detail: {
            create: {
              description: data.description,
              material: data.material,
              closureType: data.closureType,
              outsole: data.outsole,
              origin: data.origin,
              notes: data.notes,
              careInstructions: data.careInstructions,
              sizeTemplateId: data.sizeTemplateId || null, // <--- Ini pemicu errornya
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
        },
        include: {
          images: true,
          categories: { include: { category: true } },
          detail: true,
        },
      });
    } catch (error: any) {
      // 🛡️ TANGKAP ERROR KHUSUS PRISMA DISINI

      // Error P2003: Foreign Key Constraint Failed
      // Artinya: ID yang mau disambungkan tidak ada di tabel aslinya
      if (error.code === "P2003") {
        // Cek bagian mana yang gagal (dari pesan error yang Anda paste)
        const errorMessage = error.message || "";

        if (errorMessage.includes("size_template_id")) {
          throw new Error("Size Template ID tidak ditemukan / salah.");
        }

        if (errorMessage.includes("category")) {
          throw new Error("Salah satu Category ID tidak ditemukan.");
        }
      }

      // Error P2025: Record to connect not found (Biasanya buat connect Kategori)
      if (error.code === "P2025") {
        throw new Error("Category ID tidak valid (Record not found).");
      }

      // Jika error lain, lempar apa adanya biar Route yang handle 500
      throw error;
    }
  },

  async getById(id: string) {
    return await prisma.product.findUnique({
      where: { id },
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
        // Gambar: hanya id + url (tanpa key S3 & productId)
        images: {
          select: { id: true, url: true },
        },
        // Kategori: hanya id + nama (tanpa pivot data & imageKey)
        categories: {
          select: {
            category: {
              select: { id: true, name: true, imageUrl: true },
            },
          },
        },
        // Detail: tanpa id & productId
        detail: {
          select: {
            description: true,
            notes: true,
            careInstructions: true,
            material: true,
            closureType: true,
            outsole: true,
            origin: true,
            // Size template: hanya info yang berguna
            sizeTemplate: {
              select: { id: true, name: true, type: true, sizes: true },
            },
          },
        },
        // Testimoni: hanya data yang ditampilkan
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
      where.name = { contains: search, mode: "insensitive" };
    }

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
          updatedAt: true,
          images: { take: 1, select: { id: true, url: true } },
          categories: {
            select: {
              category: { select: { id: true, name: true } },
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
      products,
      meta: {
        totalItems,
        totalPage: Math.ceil(totalItems / limit),
        currentPage: page,
        limit,
      },
    };
  },

  // --- Update Produk ---
  async update(id: string, data: any) {
    return await prisma.$transaction(async (tx) => {
      // 1. Update data produk utama
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.shortDescription !== undefined) updateData.shortDescription = data.shortDescription;
      if (data.price !== undefined) updateData.price = data.price;
      if (data.stock !== undefined) updateData.stock = data.stock;
      if (data.productType !== undefined) updateData.productType = data.productType;
      if (data.gender !== undefined) updateData.gender = data.gender;
      if (data.isPopular !== undefined) updateData.isPopular = data.isPopular;
      if (data.isBestseller !== undefined) updateData.isBestseller = data.isBestseller;
      if (data.isNew !== undefined) updateData.isNew = data.isNew;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      const product = await tx.product.update({
        where: { id },
        data: updateData,
      });

      // 2. Update detail (jika ada)
      if (data.description !== undefined || data.material !== undefined || data.sizeTemplateId !== undefined) {
        await tx.productDetail.upsert({
          where: { productId: id },
          update: {
            ...(data.description !== undefined && { description: data.description }),
            ...(data.material !== undefined && { material: data.material }),
            ...(data.closureType !== undefined && { closureType: data.closureType }),
            ...(data.outsole !== undefined && { outsole: data.outsole }),
            ...(data.origin !== undefined && { origin: data.origin }),
            ...(data.notes !== undefined && { notes: data.notes }),
            ...(data.careInstructions !== undefined && { careInstructions: data.careInstructions }),
            ...(data.sizeTemplateId !== undefined && { sizeTemplateId: data.sizeTemplateId || null }),
          },
          create: {
            productId: id,
            description: data.description || "",
            material: data.material,
            closureType: data.closureType,
            outsole: data.outsole,
            origin: data.origin,
            notes: data.notes,
            careInstructions: data.careInstructions,
            sizeTemplateId: data.sizeTemplateId || null,
          },
        });
      }

      // 3. Update kategori (jika ada)
      if (data.categoryIds && data.categoryIds.length > 0) {
        await tx.productCategory.deleteMany({ where: { productId: id } });
        await tx.productCategory.createMany({
          data: data.categoryIds.map((categoryId: string) => ({
            productId: id,
            categoryId,
          })),
        });
      }

      // 4. Tambah gambar baru (jika ada)
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
};
