// app/api/public/promo/products/route.ts
// Public endpoint — tidak butuh autentikasi
// GET /api/public/promo/products?page=1&limit=12&sortBy=latest&search=...

import { NextRequest, NextResponse } from "next/server";
import { ProductService } from "@/backend/services/products.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const sortBy = searchParams.get("sortBy") || "latest";
    const search = searchParams.get("search") || undefined;

    const data = await ProductService.getAllPromo({ page, limit, sortBy, search });

    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    console.error("[GET /api/public/promo/products]", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal mengambil produk promo" },
      { status: 500 }
    );
  }
}
