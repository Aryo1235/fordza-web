import { NextResponse } from "next/server";
import { testimonialSchema } from "@/lib/zod-schemas";
import { TestimonialService } from "@/backend/services/testimonial.service";

// GET /api/admin/testimonials — Admin: semua testimoni
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || undefined;

    const result = await TestimonialService.getAllAdmin({ productId, page, limit, search });

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

// POST /api/admin/testimonials — Admin: buat testimoni baru
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const validation = testimonialSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, errors: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const review = await TestimonialService.create({
      customerName: validation.data.customerName,
      rating: validation.data.rating,
      content: validation.data.content,
      isActive: validation.data.isActive,
      product: {
        connect: { id: validation.data.productId },
      },
    });

    return NextResponse.json(
      { success: true, message: "Testimoni berhasil dibuat", data: review },
      { status: 201 },
    );
  } catch (error: any) {
    if (error.message.includes("Product ID tidak valid")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
