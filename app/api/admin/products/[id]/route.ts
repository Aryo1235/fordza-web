import { NextResponse } from "next/server";
import { ProductService } from "@/backend/services/products.service";
import { uploadFileToS3, deleteFileFromS3 } from "@/actions/upload";
import { handleError, AppError } from "@/lib/error-handler";
import { logger } from "@/lib/logger";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

// GET /api/admin/products/[id] — Admin: detail produk
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const product = await ProductService.getById(id);

    if (!product) {
      throw new AppError("Produk tidak ditemukan", 404, "NOT_FOUND");
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error: any) {
    return await handleError(error);
  }
}

// PUT /api/admin/products/[id] — Admin: update produk
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const uploadedImages: { url: string; key: string }[] = [];

  try {
    const { id } = await params;

    // Cek produk ada
    const existing = await ProductService.getById(id);
    if (!existing) {
      throw new AppError("Produk tidak ditemukan", 404, "NOT_FOUND");
    }

    const formData = await req.formData();

    // Parse categoryIds
    const categoryIdsRaw = formData.getAll("categoryIds");
    let categoryIds: string[] = [];
    if (categoryIdsRaw.length === 1 && (categoryIdsRaw[0] as string).includes(",")) {
      categoryIds = (categoryIdsRaw[0] as string).split(",").map((id) => id.trim());
    } else if (categoryIdsRaw.length > 0) {
      categoryIds = categoryIdsRaw as string[];
    }

    // Data update
    const updateData: any = {};
    const fields = [
      "productCode", "name", "shortDescription", "productType", "gender",
      "description", "material", "closureType", "outsole", "insole", "origin", "notes", "sizeTemplateId",
    ];

    for (const field of fields) {
      const value = formData.get(field);
      if (value !== null) {
        // Basic validation
        if (field === "productCode" && typeof value === "string" && value.trim().length === 0) {
          throw new AppError("Kode produk tidak boleh kosong", 400, "VALIDATION_ERROR");
        }
        if (field === "name" && typeof value === "string" && value.trim().length === 0) {
          throw new AppError("Nama produk tidak boleh kosong", 400, "VALIDATION_ERROR");
        }
        if (field === "gender" && !["Man", "Woman", "Unisex"].includes(value as string)) {
          throw new AppError("Gender tidak valid. Harus 'Man', 'Woman', atau 'Unisex'", 400, "VALIDATION_ERROR", { field: "gender" });
        }
        if (field === "productType" && !["shoes", "apparel", "accessories"].includes(value as string)) {
          throw new AppError("Tipe produk tidak valid. Harus 'shoes', 'apparel', atau 'accessories'", 400, "VALIDATION_ERROR", { field: "productType" });
        }
        updateData[field] = value;
      }
    }

    // Flags
    if (formData.get("isPopular") !== null) updateData.isPopular = formData.get("isPopular") === "true";
    if (formData.get("isBestseller") !== null) updateData.isBestseller = formData.get("isBestseller") === "true";
    if (formData.get("isNew") !== null) updateData.isNew = formData.get("isNew") === "true";
    if (formData.get("isActive") !== null) updateData.isActive = formData.get("isActive") === "true";

    // Ukuran kustom per-produk (dikirim dari VariantManager saat tambah ukuran baru)
    if (formData.get("customSizes") !== null) {
      updateData.customSizes = JSON.parse(formData.get("customSizes") as string);
    }
    if (formData.get("customMeasurements") !== null) {
      updateData.customMeasurements = JSON.parse(formData.get("customMeasurements") as string);
    }

    if (categoryIds.length > 0) updateData.categoryIds = categoryIds;


    // Upload gambar baru (jika ada)
    const images = formData.getAll("images");
    if (Array.isArray(images) && images.length > 0) {
      for (const file of images) {
        if (file instanceof File && file.size > 0) {
          const uploadFormData = new FormData();
          uploadFormData.append("file", file);
          const res = await uploadFileToS3(uploadFormData, "products");
          if (res.success) {
            uploadedImages.push({ url: res.url as string, key: res.fileName as string });
          }
        }
      }
      if (uploadedImages.length > 0) updateData.images = uploadedImages;
    }

    const operatorId = req.headers.get("x-user-id") || undefined;
    const headerList = await headers();
    const traceId = headerList.get("x-request-id") || "unknown";

    // Validasi Relasional Manual (sama seperti CREATE)
    if (updateData.sizeTemplateId) {
      const templateExists = await prisma.sizeTemplate.findUnique({
        where: { id: updateData.sizeTemplateId },
        select: { id: true },
      });
      if (!templateExists) {
        return NextResponse.json(
          {
            success: false,
            message: "Data referensi tidak valid atau tidak ditemukan",
            code: "INVALID_REFERENCE",
            field: "sizeTemplateId",
            traceId,
          },
          { status: 400 }
        );
      }
    }

    if (updateData.categoryIds && updateData.categoryIds.length > 0) {
      const validCategoriesCount = await prisma.category.count({
        where: { id: { in: updateData.categoryIds } },
      });
      if (validCategoriesCount !== updateData.categoryIds.length) {
        return NextResponse.json(
          {
            success: false,
            message: "Data referensi tidak valid atau tidak ditemukan",
            code: "INVALID_REFERENCE",
            field: "categoryIds",
            traceId,
          },
          { status: 400 }
        );
      }
    }
    
    const product = await ProductService.update(id, updateData, operatorId);

    logger.info({ traceId, productId: id, operatorId }, "Product updated successfully");

    return NextResponse.json(
      { success: true, message: "Produk berhasil diupdate", data: product },
      { status: 200 },
    );
  } catch (error: any) {
    if (uploadedImages.length > 0) {
      await Promise.all(uploadedImages.map((img) => deleteFileFromS3(img.key)));
    }

    return await handleError(error);
  }
}

// DELETE /api/admin/products/[id] — Admin: soft delete produk
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const existing = await ProductService.getById(id);
    if (!existing) {
      throw new AppError("Produk tidak ditemukan", 404, "NOT_FOUND");
    }

    const operatorId = req.headers.get("x-user-id") || undefined;
    const headerList = await headers();
    const traceId = headerList.get("x-request-id") || "unknown";

    await ProductService.delete(id, operatorId);

    logger.info({ traceId, productId: id, operatorId }, "Product soft-deleted successfully");

    return NextResponse.json(
      { success: true, message: "Produk berhasil dihapus (soft delete)" },
      { status: 200 },
    );
  } catch (error: any) {
    return await handleError(error);
  }
}
