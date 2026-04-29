import { NextResponse } from "next/server";
import { VariantRepository } from "@/backend/repositories/variants.repo";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "20");

    const variants = await VariantRepository.searchAdmin(search, limit);

    return NextResponse.json({
      success: true,
      data: variants,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal mengambil daftar varian", error: error.message },
      { status: 500 }
    );
  }
}
