import { NextResponse } from "next/server";
import { BannerService } from "@/backend/services/banner.service";
import { uploadFileToS3, deleteFileFromS3 } from "@/actions/upload";
import { handleError, AppError } from "@/lib/error-handler";
import { logger } from "@/lib/logger";
import { headers } from "next/headers";

// GET /api/admin/banners/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const banner = await BannerService.getById(id);

    if (!banner) {
      throw new AppError("Banner tidak ditemukan", 404, "NOT_FOUND");
    }

    const headerList = await headers();
    const traceId = headerList.get("x-request-id") || "unknown";

    return NextResponse.json({ success: true, data: banner, traceId });
  } catch (error: any) {
    return await handleError(error);
  }
}

// PUT /api/admin/banners/[id] — Admin: update banner
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const existing = await BannerService.getById(id);
    if (!existing) {
      throw new AppError("Banner tidak ditemukan", 404, "NOT_FOUND");
    }

    const formData = await req.formData();
    const updateData: any = {};

    const title = formData.get("title");
    if (title !== null) updateData.title = title;

    const linkUrl = formData.get("linkUrl");
    if (linkUrl !== null) updateData.linkUrl = linkUrl;

    const isActive = formData.get("isActive");
    if (isActive !== null) updateData.isActive = isActive === "true";

    // Upload gambar baru (jika ada)
    const image = formData.get("image") as File;
    if (image && image.size > 0) {
      const uploadFormData = new FormData();
      uploadFormData.append("file", image);
      const uploadRes = await uploadFileToS3(uploadFormData, "banners");

      if (!uploadRes.success) {
        throw new AppError(uploadRes.message || "Gagal upload gambar banner", 400, "VALIDATION_ERROR");
      }

      // Hapus gambar lama dari S3
      if (existing.imageKey) {
        await deleteFileFromS3(existing.imageKey);
      }
      updateData.imageUrl = uploadRes.url;
      updateData.imageKey = uploadRes.fileName;
    }

    const headerList = await headers();
    const traceId = headerList.get("x-request-id") || "unknown";
    const operatorId = req.headers.get("x-user-id") || undefined;

    const banner = await BannerService.update(id, { ...updateData, updatedById: operatorId });

    logger.info({ traceId, bannerId: id, operatorId }, "Banner updated successfully");

    return NextResponse.json(
      { success: true, message: "Banner berhasil diupdate", data: banner, traceId },
      { status: 200 },
    );
  } catch (error: any) {
    return await handleError(error);
  }
}

// DELETE /api/admin/banners/[id] — Admin: hapus banner
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const existing = await BannerService.getById(id);
    if (!existing) {
      throw new AppError("Banner tidak ditemukan", 404, "NOT_FOUND");
    }

    // Hapus gambar dari S3
    if (existing.imageKey) {
      await deleteFileFromS3(existing.imageKey);
    }

    const headerList = await headers();
    const traceId = headerList.get("x-request-id") || "unknown";
    const operatorId = req.headers.get("x-user-id") || undefined;

    await BannerService.delete(id);

    logger.info({ traceId, bannerId: id, operatorId }, "Banner deleted successfully");

    return NextResponse.json(
      { success: true, message: "Banner berhasil dihapus", traceId },
      { status: 200 },
    );
  } catch (error: any) {
    return await handleError(error);
  }
}
