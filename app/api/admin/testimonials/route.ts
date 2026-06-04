import { NextResponse } from "next/server";
import { handleError } from "@/lib/error-handler";
import { testimonialSchema } from "@/lib/zod-schemas";
import { TestimonialService } from "@/backend/services/testimonial.service";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

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
    return await handleError(error);
  }
}

// POST /api/admin/testimonials — Admin: buat testimoni baru
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const validation = { data: testimonialSchema.parse(body) };

    // Validasi Relasional Manual (sama seperti Products)
    const productExists = await prisma.product.findUnique({
      where: { id: validation.data.productId },
      select: { id: true },
    });

    if (!productExists) {
      const headerList = await headers();
      const traceId = headerList.get("x-request-id") || "unknown";
      
      return NextResponse.json(
        {
          success: false,
          message: "Data referensi tidak valid atau tidak ditemukan",
          code: "INVALID_REFERENCE",
          field: "productId",
          traceId,
        },
        { status: 400 }
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
    return await handleError(error);
  }
}
