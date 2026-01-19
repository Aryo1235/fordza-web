import { NextResponse } from "next/server";
import { testimonialSchema } from "@/lib/zod-schemas";
import { TestimonialService } from "@/services/testimonial.db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: productId } = await params; // ID Produk dari URL
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Mengambil testimoni KHUSUS untuk produk ini
    const result = await TestimonialService.getAll({ productId, page, limit });

    return NextResponse.json({
      success: true,
      message: `Berhasil mengambil testimoni untuk produk ID: ${productId}`,
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = testimonialSchema.safeParse(body);
    if (!validation.success)
      return NextResponse.json(
        { success: false, errors: validation.error.flatten().fieldErrors },
        { status: 400 },
      );

    const data = await TestimonialService.create(validation.data);
    return NextResponse.json(
      { success: true, message: "Testimoni berhasil dibuat", data },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
