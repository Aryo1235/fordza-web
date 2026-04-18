import { NextResponse } from "next/server";
import { productSchema } from "@/features/products/schemas";
import { ProductService } from "@/backend/services/products.service";
import { uploadFileToS3, deleteFileFromS3 } from "@/actions/upload";

// GET /api/admin/products — Admin: list semua produk (termasuk inactive)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const filters = {
      search: searchParams.get("search") || undefined,
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
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data produk", error: error.message },
      { status: 500 },
    );
  }
}

// POST /api/admin/products — Admin: buat produk baru
export async function POST(req: Request) {
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
      closureType: formData.get("closureType"),
      origin: formData.get("origin"),
      notes: formData.get("notes"),
      sizeTemplateId: formData.get("sizeTemplateId") || undefined,
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
        { success: false, message: "Minimal 1 varian warna wajib ditambahkan." },
        { status: 400 },
      );
    }

    // 3. Validasi Zod
    const validation = productSchema.safeParse(rawData);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: "Validasi Gagal", errors: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const validatedData = validation.data;
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

    return NextResponse.json(
      { success: true, message: "Produk berhasil dibuat", data: product },
      { status: 201 },
    );
  } catch (error: any) {
    // Rollback S3: Hapus semua file yang sempat terupload (Utama & Varian) jika gagal simpan ke DB
    if (allUploadedKeys.length > 0) {
      await Promise.all(allUploadedKeys.map((key) => deleteFileFromS3(key)));
    }

    if (error.code === "P2025" || error.code === "P2003" || error.message.includes("tidak ditemukan")) {
      return NextResponse.json(
        { success: false, message: "ID Kategori atau Size Template tidak ditemukan.", detail: error.message },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server", error: error.message },
      { status: 500 },
    );
  }
}
