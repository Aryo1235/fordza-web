import { NextResponse } from "next/server";
import { TestimonialService } from "@/backend/services/testimonial.service";
import { handleError } from "@/lib/error-handler";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;

    const products = await TestimonialService.getProductsForTestimonialSelection(search);

    return NextResponse.json(
      {
        success: true,
        message: "Berhasil mengambil daftar produk untuk testimoni",
        data: products,
      },
      { status: 200 },
    );
  } catch (error: any) {
    return await handleError(error);
  }
}
