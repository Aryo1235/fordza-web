import { NextResponse } from "next/server";
import { TestimonialService } from "@/services/testimonial.db";
import { ProductService } from "@/services/products.db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: productId } = await params;

    // 1. Validasi Keberadaan Produk
    const productExists = await ProductService.getById(productId);

    if (!productExists) {
      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil testimoni. Produk tidak terdaftar.",
        },
        { status: 404 },
      );
    }

    // 2. Jika produk valid, ambil testimoninya
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const result = await TestimonialService.getAll({ productId, page, limit });

    return NextResponse.json({
      success: true,
      data: result.testimonials,
      meta: result.meta,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
