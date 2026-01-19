import { NextResponse } from "next/server";
import { bannerSchema } from "@/lib/zod-schemas";
import { uploadFileToS3 } from "@/actions/upload";
import { BannerService } from "@/services/banner.db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const result = await BannerService.getAll(page, limit);

    return NextResponse.json(
      {
        success: true,
        message: "Berhasil mengambil daftar banner",
        data: result.banners, // Bungkus data
        meta: result.meta, // Sertakan meta
      },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data banner",
        error: error.message,
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
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
        {
          success: false,
          message: "Validasi gagal",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const uploadRes = await uploadFileToS3(formData, "banners");
    if (!uploadRes.success) throw new Error("Gagal upload banner ke storage");

    const banner = await BannerService.create({
      title: validation.data.title,
      linkUrl: validation.data.linkUrl,
      imageUrl: uploadRes.url as string,
      imageKey: uploadRes.fileName as string,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Banner berhasil dibuat",
        data: banner, // Bungkus data
      },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat membuat banner",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
