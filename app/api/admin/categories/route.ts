import { NextResponse } from "next/server";
import { categorySchema } from "@/features/categories";
import { CategoryService } from "@/backend/services/category.service";
import { uploadFileToS3, deleteFileFromS3 } from "@/actions/upload";

// GET /api/admin/categories — Admin: semua kategori (termasuk inactive)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const result = await CategoryService.getAllAdmin(page, limit);

    return NextResponse.json(
      { success: true, data: result.categories, meta: result.meta },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// POST /api/admin/categories — Admin: buat kategori baru
export async function POST(req: Request) {
  let uploadedImageKey: string | null = null;

  try {
    const formData = await req.formData();
    const rawData = {
      name: formData.get("name"),
      shortDescription: formData.get("shortDescription"),
      order: formData.get("order"),
      image: formData.get("image"),
    };

    const validation = categorySchema.safeParse(rawData);
    if (!validation.success) {
      return NextResponse.json(
        { errors: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const uploadFormData = new FormData();
    uploadFormData.append("file", validation.data.image as File);

    const uploadRes = await uploadFileToS3(uploadFormData, "categories");
    if (!uploadRes.success) {
      return NextResponse.json(
        { success: false, message: "Gagal upload gambar kategori" },
        { status: 500 },
      );
    }

    uploadedImageKey = uploadRes.fileName as string;

    const category = await CategoryService.create({
      name: validation.data.name,
      shortDescription: validation.data.shortDescription,
      imageUrl: uploadRes.url as string,
      imageKey: uploadRes.fileName as string,
      order: validation.data.order,
    });

    return NextResponse.json(
      { success: true, data: category },
      { status: 201 },
    );
  } catch (error: any) {
    if (uploadedImageKey) {
      await deleteFileFromS3(uploadedImageKey);
    }
    return NextResponse.json(
      { success: false, message: error.message },
      { status: error.message.includes("sudah digunakan") ? 400 : 500 },
    );
  }
}
