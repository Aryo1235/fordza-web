import { NextResponse } from "next/server";
import { handleError } from "@/lib/error-handler";
import { bannerSchema } from "@/lib/zod-schemas";
import { uploadFileToS3, deleteFileFromS3 } from "@/actions/upload";
import { BannerService } from "@/backend/services/banner.service";
import { headers } from "next/headers";
import { logger } from "@/lib/logger";

// GET /api/admin/banners — Admin: semua banner
export async function GET(req: Request) {
  try {
    const headerList = await headers();
    const traceId = headerList.get("x-request-id") || "unknown";

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const result = await BannerService.getAll(page, limit);

    return NextResponse.json(
      { success: true, data: result.banners, meta: result.meta, traceId },
      { status: 200 },
    );
  } catch (error: any) {
    return await handleError(error);
  }
}

// POST /api/admin/banners — Admin: buat banner baru
export async function POST(req: Request) {
  let uploadedImageKey: string | null = null;

  try {
    const headerList = await headers();
    const traceId = headerList.get("x-request-id") || "unknown";
    const operatorId = req.headers.get("x-user-id") || undefined;

    const formData = await req.formData();
    const rawData = {
      title: formData.get("title"),
      linkUrl: formData.get("linkUrl"),
      image: formData.getAll("image"),
    };

    const validation = { data: bannerSchema.parse(rawData) };

    const uploadFormData = new FormData();
    uploadFormData.append("file", validation.data.image as File);

    const uploadRes = await uploadFileToS3(uploadFormData, "banners");
    if (!uploadRes.success) {
      return NextResponse.json(
        { success: false, message: "Gagal upload gambar banner", traceId },
        { status: 500 },
      );
    }

    uploadedImageKey = uploadRes.fileName as string;

    const banner = await BannerService.create({
      title: validation.data.title,
      linkUrl: validation.data.linkUrl || undefined,
      imageUrl: uploadRes.url as string,
      imageKey: uploadRes.fileName as string,
      createdById: operatorId,
      updatedById: operatorId,
    });

    logger.info({ traceId, bannerId: banner.id, operatorId }, "New banner created successfully");

    return NextResponse.json(
      { success: true, message: "Banner berhasil dibuat", data: banner, traceId },
      { status: 201 },
    );
  } catch (error: any) {
    return await handleError(error);
  }
}
