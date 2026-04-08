import { NextResponse } from "next/server";
import { SizeTemplateService } from "@/services/size-template.db";

// GET /api/public/size-templates — Customer: lihat semua template ukuran
export async function GET() {
  try {
    const data = await SizeTemplateService.getAll();

    return NextResponse.json({
      success: true,
      message: "Berhasil mengambil template ukuran",
      data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
