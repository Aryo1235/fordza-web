import { NextResponse } from "next/server";
import { ProductService } from "@/services/products.db";

// Tambahkan async pada fungsi GET
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }, // Ubah tipe params menjadi Promise
) {
  try {
    // WAJIB: Await params sebelum mengambil id
    const { id } = await params;

    // Cek jika ID tidak ada
    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID tidak valid" },
        { status: 400 },
      );
    }

    const product = await ProductService.getById(id);

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Produk tidak ditemukan",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Berhasil mengambil detail produk",
      data: product,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}
