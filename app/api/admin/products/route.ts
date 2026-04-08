import { NextResponse } from "next/server";
import { productSchema } from "@/features/products/schemas";
import { ProductService } from "@/services/products.db";
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
      name: formData.get("name"),
      price: formData.get("price"),
      stock: formData.get("stock") || "0",
      shortDescription: formData.get("shortDescription"),
      productType: formData.get("productType"),
      gender: formData.get("gender") || "Unisex",
      categoryIds,
      description: formData.get("description"),
      material: formData.get("material"),
      closureType: formData.get("closureType"),
      outsole: formData.get("outsole"),
      origin: formData.get("origin"),
      notes: formData.get("notes"),
      careInstructions: formData.get("careInstructions"),
      sizeTemplateId: formData.get("sizeTemplateId") || undefined,
      isPopular: formData.get("isPopular") === "true",
      isBestseller: formData.get("isBestseller") === "true",
      isNew: formData.get("isNew") !== "false",
      isActive: formData.get("isActive") === "true",
      images: formData.getAll("images"),
    };

    // 3. Validasi Zod
    const validation = productSchema.safeParse(rawData);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: "Validasi Gagal", errors: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const validatedData = validation.data;

    // 4. Upload Gambar
    const imagesInput = rawData.images;
    if (Array.isArray(imagesInput) && imagesInput.length > 0) {
      for (const file of imagesInput) {
        if (file instanceof File && file.size > 0) {
          const uploadFormData = new FormData();
          uploadFormData.append("file", file);
          const res = await uploadFileToS3(uploadFormData, "products");
          if (res.success) {
            uploadedImages.push({ url: res.url as string, key: res.fileName as string });
          }
        }
      }
    }

    // 5. Simpan ke DB
    const product = await ProductService.create({
      ...validatedData,
      images: uploadedImages,
    });

    return NextResponse.json(
      { success: true, message: "Produk berhasil dibuat", data: product },
      { status: 201 },
    );
  } catch (error: any) {
    // Rollback S3
    if (uploadedImages.length > 0) {
      await Promise.all(uploadedImages.map((img) => deleteFileFromS3(img.key)));
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
