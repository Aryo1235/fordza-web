import { NextResponse } from "next/server";
import { CategoryService } from "@/backend/services/category.service";

// GET /api/public/categories — Customer: lihat kategori aktif
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const result = await CategoryService.getAll(page, limit);

    return NextResponse.json(
      { success: true, data: result.categories, meta: result.meta },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
