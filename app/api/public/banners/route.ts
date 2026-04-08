import { NextResponse } from "next/server";
import { BannerService } from "@/services/banner.db";

// GET /api/public/banners — Customer: lihat banner aktif
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const result = await BannerService.getAll(page, limit);

    // Filter hanya banner aktif
    const activeBanners = result.banners.filter((b) => b.isActive);

    return NextResponse.json(
      { success: true, data: activeBanners, meta: result.meta },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
