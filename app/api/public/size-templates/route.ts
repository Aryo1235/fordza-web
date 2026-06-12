import { NextResponse } from "next/server";
import { SizeTemplateService } from "@/backend/services/size-template.service";
import { handleError } from "@/lib/error-handler";

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
  return await handleError(error);
  }
}
