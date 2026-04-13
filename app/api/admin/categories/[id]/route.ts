import { NextResponse } from "next/server";
import { CategoryService } from "@/backend/services/category.service";
import { uploadFileToS3, deleteFileFromS3 } from "@/actions/upload";

// GET /api/admin/categories/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const category = await CategoryService.getById(id);

    if (!category) {
      return NextResponse.json(
        { success: false, message: "Kategori tidak ditemukan" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: category });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
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
      return NextResponse.json(
        { success: false, message: "Kategori tidak ditemukan" },
        { status: 404 },
      );
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

    const category = await CategoryService.update(id, updateData);

    return NextResponse.json(
      { success: true, message: "Kategori berhasil diupdate", data: category },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: error.message.includes("sudah digunakan") ? 400 : 500 },
    );
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
      return NextResponse.json(
        { success: false, message: "Kategori tidak ditemukan" },
        { status: 404 },
      );
    }

    await CategoryService.delete(id);

    return NextResponse.json(
      { success: true, message: "Kategori berhasil dihapus (soft delete)" },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
