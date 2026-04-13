import { NextResponse } from "next/server";
import { uploadFileToS3, deleteFileFromS3 } from "@/actions/upload";
import { prisma } from "@/lib/prisma";

// POST /api/admin/products/[id]/images — Tambah 1 gambar baru ke produk
// Body: FormData { image: File }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let uploadedKey: string | null = null;

  try {
    const { id } = await params;

    // Cek produk ada
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return NextResponse.json(
        { success: false, message: "Produk tidak ditemukan" },
        { status: 404 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("image");

    if (!file || !(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { success: false, message: "File gambar wajib dikirim (field: image)" },
        { status: 400 },
      );
    }

    // Upload ke S3
    const uploadForm = new FormData();
    uploadForm.append("file", file);
    const res = await uploadFileToS3(uploadForm, "products");

    if (!res.success) {
      return NextResponse.json(
        { success: false, message: res.message || "Gagal upload gambar ke S3" },
        { status: 500 },
      );
    }

    uploadedKey = res.fileName as string;

    // Simpan ke database
    const image = await prisma.productImage.create({
      data: {
        productId: id,
        url: res.url as string,
        key: uploadedKey,
      },
      select: { id: true, url: true },
    });

    return NextResponse.json(
      { success: true, message: "Gambar berhasil ditambahkan", data: image },
      { status: 201 },
    );
  } catch (error: any) {
    // Rollback: hapus dari S3 kalau gagal simpan ke DB
    if (uploadedKey) await deleteFileFromS3(uploadedKey);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
