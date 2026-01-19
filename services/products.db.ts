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

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    if (categoryIds && categoryIds.length > 0) {
      where.categories = { some: { id: { in: categoryIds } } };
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

    // Eksekusi ambil data dan hitung total secara paralel
    const [products, totalItems] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { images: true, categories: true },
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
    return await prisma.product.create({
      data: {
        name: data.name,
        shortDescription: data.shortDescription,
        description: data.description,
        price: data.price, // Pastikan ini sudah tipe Number/Decimal
        productType: data.productType,
        // Menghubungkan ke kategori yang sudah ada di database
        categories: {
          connect: data.categoryIds?.map((id: string) => ({ id })) || [],
        },
        // Menyimpan daftar URL foto ke tabel ProductImage
        images: {
          create: data.images, // Array: [{url, key}, {url, key}]
        },
      },
      include: {
        images: true,
        categories: true,
      },
    });
  },

  async getById(id: string) {
    return await prisma.product.findUnique({
      where: { id },
      include: {
        images: true, // Mengambil galeri foto
        categories: true, // Mengambil kategori (Boots, Sneakers, dll)
        sizeTemplate: true, // Mengambil template ukuran (39, 40, dst)
        testimonials: {
          // Mengambil ulasan pelanggan
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
          take: 3,
        },
        _count: {
          select: {
            testimonials: { where: { isActive: true } }, // <--- HITUNG TOTAL TESTIMONI
          },
        },
      },
    });
  },

  async getRelated(productId: string, limit: number = 4) {
    // 1. Ambil data produk referensi
    const currentProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: { categories: true },
    });

    if (!currentProduct) return [];

    const categoryIds = currentProduct.categories.map((cat) => cat.id);

    // 2. QUERY UTAMA: Cari yang Gender SAMA + Minimal satu Kategori SAMA
    const primaryRelated = await prisma.product.findMany({
      where: {
        id: { not: productId },
        isActive: true,
        gender: currentProduct.gender,
        categories: {
          some: { id: { in: categoryIds } },
        },
      },
      include: { images: true, categories: true },
      orderBy: [
        { isBestseller: "desc" },
        { isPopular: "desc" },
        { createdAt: "desc" },
      ],
      take: limit,
    });

    // 3. LOGIKA FALLBACK: Jika hasil query utama kurang dari limit
    if (primaryRelated.length < limit) {
      const needed = limit - primaryRelated.length;
      const excludedIds = [productId, ...primaryRelated.map((p) => p.id)];

      // Cari produk lain dengan GENDER SAMA (abaikan kategori)
      const fallbackProducts = await prisma.product.findMany({
        where: {
          id: { notIn: excludedIds },
          isActive: true,
          gender: currentProduct.gender,
        },
        include: { images: true, categories: true },
        orderBy: [{ isBestseller: "desc" }, { createdAt: "desc" }],
        take: needed,
      });

      // Gabungkan hasil utama dengan hasil fallback
      return [...primaryRelated, ...fallbackProducts];
    }

    return primaryRelated;
  },
};
