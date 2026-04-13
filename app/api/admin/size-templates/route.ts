import { NextResponse } from "next/server";
import { sizeTemplateSchema } from "@/lib/zod-schemas";
import { SizeTemplateService } from "@/backend/services/size-template.service";

// GET /api/admin/size-templates — Admin: semua template ukuran
export async function GET() {
  try {
    const data = await SizeTemplateService.getAll();

    return NextResponse.json({
      success: true,
      message: "Berhasil mengambil template",
      data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// POST /api/admin/size-templates — Admin: buat template baru
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = sizeTemplateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, errors: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = await SizeTemplateService.create(validation.data);

    return NextResponse.json(
      { success: true, message: "Template berhasil dibuat", data },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
