import { NextResponse } from "next/server";
import { BannerService } from "@/services/banner.db";
import { uploadFileToS3, deleteFileFromS3 } from "@/actions/upload";

// GET /api/admin/banners/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const banner = await BannerService.getById(id);

    if (!banner) {
      return NextResponse.json(
        { success: false, message: "Banner tidak ditemukan" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: banner });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
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
      return NextResponse.json(
        { success: false, message: "Banner tidak ditemukan" },
        { status: 404 },
      );
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

      if (uploadRes.success) {
        // Hapus gambar lama dari S3
        if (existing.imageKey) {
          await deleteFileFromS3(existing.imageKey);
        }
        updateData.imageUrl = uploadRes.url;
        updateData.imageKey = uploadRes.fileName;
      }
    }

    const banner = await BannerService.update(id, updateData);

    return NextResponse.json(
      { success: true, message: "Banner berhasil diupdate", data: banner },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
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
      return NextResponse.json(
        { success: false, message: "Banner tidak ditemukan" },
        { status: 404 },
      );
    }

    // Hapus gambar dari S3
    if (existing.imageKey) {
      await deleteFileFromS3(existing.imageKey);
    }

    await BannerService.delete(id);

    return NextResponse.json(
      { success: true, message: "Banner berhasil dihapus" },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
