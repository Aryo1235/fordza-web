import { NextResponse } from "next/server";
import { CategoryService } from "@/backend/services/category.service";
import { uploadFileToS3, deleteFileFromS3 } from "@/actions/upload";
import { handleError, AppError } from "@/lib/error-handler";
import { logger } from "@/lib/logger";
import { headers } from "next/headers";

// GET /api/admin/categories/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const category = await CategoryService.getById(id);

    if (!category) {
      throw new AppError("Kategori tidak ditemukan", 404, "NOT_FOUND");
    }

    return NextResponse.json({ success: true, data: category });
  } catch (error: any) {
    return await handleError(error);
  }
}

// PUT /api/admin/categories/[id]
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const existing = await CategoryService.getById(id);
    if (!existing) {
      throw new AppError("Kategori tidak ditemukan", 404, "NOT_FOUND");
    }

    const formData = await req.formData();
    const updateData: any = {};

    const name = formData.get("name");
    if (name) updateData.name = name;

    const shortDescription = formData.get("shortDescription");
    if (shortDescription !== null) updateData.shortDescription = shortDescription;

    const order = formData.get("order");
    if (order !== null) updateData.order = order;

    const isActive = formData.get("isActive");
    if (isActive !== null) updateData.isActive = isActive === "true";

    // Upload gambar baru (jika ada)
    const image = formData.get("image") as File;
    if (image && image.size > 0) {
      const uploadFormData = new FormData();
      uploadFormData.append("file", image);
      const uploadRes = await uploadFileToS3(uploadFormData, "categories");

      if (uploadRes.success) {
        // Hapus gambar lama
        if (existing.imageKey) {
          await deleteFileFromS3(existing.imageKey);
        }
        updateData.imageUrl = uploadRes.url;
        updateData.imageKey = uploadRes.fileName;
      }
    }

    const headerList = await headers();
    const traceId = headerList.get("x-request-id") || "unknown";
    const operatorId = req.headers.get("x-user-id") || undefined;

    const category = await CategoryService.update(id, { ...updateData, updatedById: operatorId });

    logger.info({ traceId, categoryId: id, operatorId }, "Category updated successfully");

    return NextResponse.json(
      {
        success: true,
        message: "Kategori berhasil diupdate",
        data: category,
        traceId
      },
      { status: 200 },
    );
  } catch (error: any) {
    return await handleError(error);
  }
}

// DELETE /api/admin/categories/[id] — Soft delete
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const existing = await CategoryService.getById(id);
    if (!existing) {
      throw new AppError("Kategori tidak ditemukan", 404, "NOT_FOUND");
    }

    const headerList = await headers();
    const traceId = headerList.get("x-request-id") || "unknown";
    const operatorId = req.headers.get("x-user-id") || undefined;

    await CategoryService.delete(id);

    logger.info({ traceId, categoryId: id, operatorId }, "Category soft-deleted successfully");

    return NextResponse.json(
      {
        success: true,
        message: "Kategori berhasil dihapus",
        traceId
      },
    );
  } catch (error: any) {
    return await handleError(error);
  }
}
