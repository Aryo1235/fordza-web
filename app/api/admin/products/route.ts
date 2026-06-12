import { NextResponse } from "next/server"; // trigger recompilation
import { productSchema } from "@/features/products/schemas";
import { ProductService } from "@/backend/services/products.service";
import { uploadFileToS3, deleteFileFromS3 } from "@/actions/upload";
import { handleError } from "@/lib/error-handler";
import { logger } from "@/lib/logger";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

// GET /api/admin/products — Admin: list semua produk (termasuk inactive)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const filters = {
      search: searchParams.get("search") || undefined,
      categoryId: searchParams.get("categoryId") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
    };

    const result = await ProductService.getAllAdmin(filters);

    return NextResponse.json(
      {
        success: true,
        message: "Berhasil mengambil daftar produk",
        data: result.products,
        meta: result.meta,
      },
      { status: 200 },
    );
  } catch (error: any) {
    return await handleError(error);
  }
}

// POST /api/admin/products — Admin: buat produk baru
export async function POST(req: Request) {
  const headerList = await headers();
  const traceId = headerList.get("x-request-id") || "unknown";

  const uploadedImages: { url: string; key: string }[] = [];
  const allUploadedKeys: string[] = [];
  let productId = "";

  try {
    const formData = await req.formData();

    // 1. Parsing Category IDs
    const categoryIdsRaw = formData.getAll("categoryIds");
    let categoryIds: string[] = [];

    if (categoryIdsRaw.length === 1 && (categoryIdsRaw[0] as string).includes(",")) {
      categoryIds = (categoryIdsRaw[0] as string).split(",").map((id) => id.trim());
    } else {
      categoryIds = categoryIdsRaw as string[];
    }

    if (categoryIds.length === 0 && formData.get("categoryIds")) {
      categoryIds = [formData.get("categoryIds") as string];
    }

    // 2. Data Mentah
    const rawData = {
      productCode: formData.get("productCode"),
      name: formData.get("name"),
      // price & stock tidak ada di form induk — dikelola per varian
      shortDescription: formData.get("shortDescription"),
      productType: formData.get("productType"),
      gender: formData.get("gender") || "Unisex",
      categoryIds,
      description: formData.get("description"),
      material: formData.get("material"),
      outsole: formData.get("outsole"),
      insole: formData.get("insole"),
      closureType: formData.get("closureType"),
      origin: formData.get("origin"),
      notes: formData.get("notes"),
      sizeTemplateId: formData.get("sizeTemplateId") || undefined,
      // Ukuran kustom per-produk (tidak mengubah template bersama)
      customSizes: formData.get("customSizes")
        ? JSON.parse(formData.get("customSizes") as string)
        : [],
      customMeasurements: formData.get("customMeasurements")
        ? JSON.parse(formData.get("customMeasurements") as string)
        : undefined,
      isPopular: formData.get("isPopular") === "true",
      isBestseller: formData.get("isBestseller") === "true",
      isNew: formData.get("isNew") !== "false",
      isActive: formData.get("isActive") === "true",
      images: formData.getAll("images"),
      variants: formData.get("variants") ? JSON.parse(formData.get("variants") as string) : [],
    };

    // Validasi Wajib Minimal 1 Varian
    if (!rawData.variants || rawData.variants.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Minimal 1 varian warna wajib ditambahkan",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    // 3. Validasi Zod
    const validation = productSchema.safeParse(rawData);
    if (!validation.success) {
      logger.warn({ traceId, errors: validation.error.issues }, "Product validation failed");
      return NextResponse.json(
        {
          success: false,
          message: "Data produk tidak valid",
          code: "VALIDATION_ERROR",
          errors: validation.error.flatten().fieldErrors,
          traceId,
        },
        { status: 400 }
      );
    }

    const validatedData = validation.data;
    
    // 3.1 Validasi Relasi ke Database Secara Manual (Dioptimasi dengan Promise.all)
    const [templateExists, existingCategories] = await Promise.all([
      validatedData.sizeTemplateId 
        ? prisma.sizeTemplate.findUnique({ where: { id: validatedData.sizeTemplateId }, select: { id: true } })
        : Promise.resolve(null),
      
      (validatedData.categoryIds && validatedData.categoryIds.length > 0)
        ? prisma.category.count({ where: { id: { in: validatedData.categoryIds } } })
        : Promise.resolve(0)
    ]);

    if (validatedData.sizeTemplateId && !templateExists) {
      return NextResponse.json({
        success: false,
        message: "Data referensi tidak valid atau tidak ditemukan",
        code: "INVALID_REFERENCE",
        field: "sizeTemplateId",
        traceId
      }, { status: 400 });
    }

    if (validatedData.categoryIds && validatedData.categoryIds.length > 0 && existingCategories !== validatedData.categoryIds.length) {
      return NextResponse.json({
        success: false,
        message: "Data referensi tidak valid atau tidak ditemukan",
        code: "INVALID_REFERENCE",
        field: "categoryIds",
        traceId
      }, { status: 400 });
    }

    productId = crypto.randomUUID();

    // 4. Upload Gambar Produk Utama
    const imagesInput = rawData.images;
    if (Array.isArray(imagesInput) && imagesInput.length > 0) {
      for (const file of imagesInput) {
        if (file instanceof File && file.size > 0) {
          const uploadFormData = new FormData();
          uploadFormData.append("file", file);
          // Upload ke folder ID produk
          const res = await uploadFileToS3(uploadFormData, `products/${productId}`);
          if (res.success) {
            const key = res.fileName as string;
            uploadedImages.push({ url: res.url as string, key });
            allUploadedKeys.push(key);
          }
        }
      }
    }

    // 4.1 Upload Gambar Spesifik Varian (Bento-style Sync)
    const variantsWithImages = await Promise.all(
      rawData.variants.map(async (v: any) => {
        const fileIndex = v.imageFileIndex;
        let variantImages = [];

        // Jika ada file baru yang dikirim via FormData
        if (fileIndex !== null && fileIndex !== undefined) {
          const file = formData.get(`variant_images_${fileIndex}`);
          if (file instanceof File && file.size > 0) {
            const uploadFormData = new FormData();
            uploadFormData.append("file", file);
            // Upload ke sub-folder variants di bawah ID produk
            const res = await uploadFileToS3(uploadFormData, `products/${productId}/variants`);
            if (res.success) {
              const key = res.fileName as string;
              variantImages.push({ url: res.url as string, key });
              allUploadedKeys.push(key);
            }
          }
        } 
        // Jika sudah ada gambar sebelumnya (existing)
        else if (v.existingImage) {
          variantImages.push(v.existingImage);
        }

        return {
          ...v,
          images: variantImages
        };
      })
    );

    // 5. Simpan ke DB
    const operatorId = req.headers.get("x-user-id") || undefined;
    const product = await ProductService.create({
      ...validatedData,
      id: productId, // Pass ID manual
      variants: variantsWithImages,
      images: uploadedImages,
      operatorId,
    });

    logger.info({ productId: product.id, productCode: product.productCode, operatorId }, "New product created successfully");

    return NextResponse.json(
      { success: true, message: "Produk berhasil dibuat", data: product },
      { status: 201 },
    );
  } catch (error: any) {
    // Rollback S3: Hapus semua file yang sempat terupload (Utama & Varian) jika gagal simpan ke DB
    if (allUploadedKeys.length > 0) {
      await Promise.all(allUploadedKeys.map((key) => deleteFileFromS3(key)));
    }

    return handleError(error);
  }
}
