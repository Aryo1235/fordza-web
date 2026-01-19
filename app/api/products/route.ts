import { NextResponse } from "next/server";
import { productSchema } from "@//lib/zod-schemas";
import { ProductService } from "@/services/products.db";
import { uploadFileToS3 } from "@/actions/upload";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const filters = {
      search: searchParams.get("search") || undefined,
      categoryIds: searchParams.getAll("categoryIds"),
      gender: searchParams.get("gender") || undefined,
      isPopular: searchParams.get("isPopular") === "true",
      isBestseller: searchParams.get("isBestseller") === "true",
      isNew: searchParams.get("isNew") === "true",
      minPrice: searchParams.get("minPrice")
        ? parseFloat(searchParams.get("minPrice")!)
        : undefined,
      maxPrice: searchParams.get("maxPrice")
        ? parseFloat(searchParams.get("maxPrice")!)
        : undefined,
      sortBy: searchParams.get("sortBy") || "latest",
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
    };

    const result = await ProductService.getAll(filters);

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
      {
        success: false,
        message: "Gagal mengambil data produk",
        error: error.message,
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    // 1. Kumpulkan data dari FormData
    const rawData = {
      name: formData.get("name"),
      price: formData.get("price"),
      shortDescription: formData.get("shortDescription"),
      description: formData.get("description"),
      productType: formData.get("productType"),
      categoryIds: formData.getAll("categoryIds"),
      gender: formData.get("gender") || undefined,
      images: formData.getAll("images"),
    };

    // 2. Validasi dengan Zod
    const validation = productSchema.safeParse(rawData);

    if (!validation.success) {
      // Jika gagal, kirim pesan error yang rapi ke Postman/FE
      return NextResponse.json(
        { errors: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // 3. Jika valid, ambil data yang sudah "bersih"
    const validatedData = validation.data;

    // 4. Proses Upload ke Supabase
    const uploadedImages = [];
    for (const file of validatedData.images as File[]) {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const res = await uploadFileToS3(uploadFormData, "products");
      console.log("HASIL UPLOAD:", res);
      if (res.success) {
        uploadedImages.push({ url: res.url, key: res.fileName });
      } else {
        // Opsional: Lempar error agar kamu tahu kenapa gagal
        throw new Error("Upload gagal: " + res.message);
      }
    }

    // 5. Simpan ke Database Neon
    const product = await ProductService.create({
      ...validatedData,
      images: uploadedImages,
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
