// src/app/api/categories/route.ts
import { NextResponse } from "next/server";
import { categorySchema } from "@/lib/zod-schemas";
import { CategoryService } from "@/services/category.db";
import { uploadFileToS3 } from "@/actions/upload";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const result = await CategoryService.getAll(page, limit);

    return NextResponse.json(
      {
        success: true,
        message: "Berhasil mengambil daftar kategori",
        data: result.categories,
        meta: result.meta,
      },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data kategori",
        error: error.message,
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    // 1. Kumpulkan data untuk divalidasi
    const rawData = {
      name: formData.get("name"),
      shortDescription: formData.get("shortDescription"),
      order: formData.get("order"),
      image: formData.get("image"), // Mengambil 1 file
    };

    // 2. Validasi dengan Zod
    const validation = categorySchema.safeParse(rawData);

    if (!validation.success) {
      return NextResponse.json(
        { errors: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const validatedData = validation.data;

    // 3. Proses Upload Gambar Kategori ke Supabase
    let imageUrl = "";
    let imageKey = "";

    if (validatedData.image) {
      const uploadFormData = new FormData();
      uploadFormData.append("file", validatedData.image);

      const uploadRes = await uploadFileToS3(uploadFormData, "categories");
      if (uploadRes.success) {
        imageUrl = uploadRes.url as string;
        imageKey = uploadRes.fileName as string;
      }
    }

    // 4. Simpan ke Database
    const category = await CategoryService.create({
      name: validatedData.name,
      shortDescription: validatedData.shortDescription,
      imageUrl,
      imageKey,
      order: validatedData.order,
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    console.error("Error at Category POST:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
