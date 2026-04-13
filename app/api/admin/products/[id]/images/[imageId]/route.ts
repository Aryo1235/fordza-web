import { NextResponse } from "next/server";
import { deleteFileFromS3 } from "@/actions/upload";
import { prisma } from "@/lib/prisma";

// DELETE /api/admin/products/[id]/images/[imageId] — Hapus 1 gambar dari produk
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> },
) {
  try {
    const { id, imageId } = await params;

    // Cek gambar ada dan milik produk ini
    const image = await prisma.productImage.findFirst({
      where: { id: imageId, productId: id },
    });

    if (!image) {
      return NextResponse.json(
        { success: false, message: "Gambar tidak ditemukan" },
        { status: 404 },
      );
    }

    // Cek produk masih punya minimal 1 gambar setelah dihapus
    const imageCount = await prisma.productImage.count({ where: { productId: id } });
    if (imageCount <= 1) {
      return NextResponse.json(
        {
          success: false,
          message: "Produk harus punya minimal 1 gambar. Tambah gambar baru sebelum menghapus ini.",
        },
        { status: 400 },
      );
    }

    // Hapus dari database
    await prisma.productImage.delete({ where: { id: imageId } });

    // Hapus dari S3
    if (image.key) {
      await deleteFileFromS3(image.key);
    }

    return NextResponse.json(
      { success: true, message: "Gambar berhasil dihapus" },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
