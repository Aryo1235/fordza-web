import { NextResponse } from "next/server";
import { SizeTemplateService } from "@/backend/services/size-template.service";

// GET /api/admin/size-templates/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const template = await SizeTemplateService.getById(id);

    if (!template) {
      return NextResponse.json(
        { success: false, message: "Template tidak ditemukan" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: template });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// PUT /api/admin/size-templates/[id]
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const existing = await SizeTemplateService.getById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Template tidak ditemukan" },
        { status: 404 },
      );
    }

    const body = await req.json();
    const template = await SizeTemplateService.update(id, body);

    return NextResponse.json(
      { success: true, message: "Template berhasil diupdate", data: template },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/size-templates/[id]
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const existing = await SizeTemplateService.getById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Template tidak ditemukan" },
        { status: 404 },
      );
    }

    await SizeTemplateService.delete(id);

    return NextResponse.json(
      { success: true, message: "Template berhasil dihapus" },
      { status: 200 },
    );
  } catch (error: any) {
    // Error jika template masih dipakai oleh produk
    if (error.code === "P2003") {
      return NextResponse.json(
        {
          success: false,
          message: "Tidak bisa menghapus template karena masih digunakan oleh produk",
        },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
