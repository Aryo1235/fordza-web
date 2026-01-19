import { NextResponse } from "next/server";
import { ProductService } from "@/services/products.db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // 1. Validasi: Apakah produk ini ada?
    const productExists = await ProductService.getById(id);

    if (!productExists) {
      return NextResponse.json(
        { success: false, message: "Produk tidak ditemukan, ID salah." },
        { status: 404 }, // Berikan status 404 (Not Found)
      );
    }

    // 2. Jika ada, baru ambil produk terkait
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "4");
    const relatedProducts = await ProductService.getRelated(id, limit);

    return NextResponse.json({
      success: true,
      data: relatedProducts,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
