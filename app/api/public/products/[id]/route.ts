import { NextResponse } from "next/server";
import { ProductService } from "@/backend/services/products.service";
import { AppError, handleError } from "@/lib/error-handler";

// GET /api/public/products/[id] — Customer: detail produk + related
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
  return await handleError(error);
  }
}
