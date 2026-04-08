import { NextResponse } from "next/server";
import { TestimonialService } from "@/services/testimonial.db";

// GET /api/public/testimonials — Customer: halaman semua review
// Query params:
//   - productId  : filter review untuk produk tertentu
//   - rating     : filter by rating (1-5)
//   - page       : halaman (default: 1)
//   - limit      : jumlah per halaman (default: 10)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const productId = searchParams.get("productId") || undefined;
    const rating = searchParams.get("rating")
      ? parseInt(searchParams.get("rating")!)
      : undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const result = await TestimonialService.getAll({ productId, rating, page, limit });

    return NextResponse.json(
      {
        success: true,
        data: result.testimonials,
        meta: result.meta,
      },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
