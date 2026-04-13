import { NextResponse } from "next/server";
import { ProductService } from "@/backend/services/products.service";

// GET /api/public/products/[id] — Customer: detail produk + related
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const product = await ProductService.getById(id);

    if (!product || !product.isActive) {
      return NextResponse.json(
        { success: false, message: "Produk tidak ditemukan" },
        { status: 404 },
      );
    }

    // Ambil produk terkait
    const relatedProducts = await ProductService.getRelated(id, 4);

    return NextResponse.json({
      success: true,
      data: {
        ...product,
        relatedProducts,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal mengambil detail produk", error: error.message },
      { status: 500 },
    );
  }
}
