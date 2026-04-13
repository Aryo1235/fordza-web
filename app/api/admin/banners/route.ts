import { NextResponse } from "next/server";
import { bannerSchema } from "@/lib/zod-schemas";
import { uploadFileToS3, deleteFileFromS3 } from "@/actions/upload";
import { BannerService } from "@/backend/services/banner.service";

// GET /api/admin/banners — Admin: semua banner
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const result = await BannerService.getAll(page, limit);

    return NextResponse.json(
      { success: true, data: result.banners, meta: result.meta },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// POST /api/admin/banners — Admin: buat banner baru
export async function POST(req: Request) {
  let uploadedImageKey: string | null = null;

  try {
    const formData = await req.formData();
    const rawData = {
      title: formData.get("title"),
      linkUrl: formData.get("linkUrl"),
      image: formData.get("image"),
    };

    const validation = bannerSchema.safeParse(rawData);
    if (!validation.success) {
      return NextResponse.json(
        { errors: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const uploadFormData = new FormData();
    uploadFormData.append("file", validation.data.image as File);

    const uploadRes = await uploadFileToS3(uploadFormData, "banners");
    if (!uploadRes.success) {
      return NextResponse.json(
        { success: false, message: "Gagal upload gambar banner" },
        { status: 500 },
      );
    }

    uploadedImageKey = uploadRes.fileName as string;

    const banner = await BannerService.create({
      title: validation.data.title,
      linkUrl: validation.data.linkUrl || undefined,
      imageUrl: uploadRes.url as string,
      imageKey: uploadRes.fileName as string,
    });

    return NextResponse.json(
      { success: true, message: "Banner berhasil dibuat", data: banner },
      { status: 201 },
    );
  } catch (error: any) {
    if (uploadedImageKey) {
      await deleteFileFromS3(uploadedImageKey);
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
