import { NextResponse } from "next/server";
import { TestimonialService } from "@/backend/services/testimonial.service";

// GET /api/admin/testimonials/[id] — Admin: ambil detail testimoni
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const testimonial = await TestimonialService.getById(id);

    if (!testimonial) {
      return NextResponse.json(
        { success: false, message: "Testimoni tidak ditemukan" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: true, message: "Berhasil mengambil detail testimoni", data: testimonial },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// PUT /api/admin/testimonials/[id] — Admin: update testimoni
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const testimonial = await TestimonialService.update(id, body);

    return NextResponse.json(
      { success: true, message: "Testimoni berhasil diupdate", data: testimonial },
      { status: 200 },
    );
  } catch (error: any) {
    if (error.message.includes("tidak ditemukan")) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/testimonials/[id] — Admin: hapus testimoni
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    await TestimonialService.delete(id);

    return NextResponse.json(
      { success: true, message: "Testimoni berhasil dihapus" },
      { status: 200 },
    );
  } catch (error: any) {
    if (error.message.includes("tidak ditemukan")) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
