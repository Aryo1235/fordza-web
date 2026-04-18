import { NextResponse } from "next/server";
import { StockRepository } from "@/backend/repositories/stock.repo";

// GET /api/admin/stock/sku-logs — Riwayat pergerakan stok per SKU (produk dengan varian)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || undefined;
    const type = searchParams.get("type") || undefined;
    const skuId = searchParams.get("skuId") || undefined;
    const productId = searchParams.get("productId") || undefined;

    const result = await StockRepository.getSkuLogs({
      page,
      limit,
      search,
      type,
      skuId,
      productId,
    });

    return NextResponse.json({
      success: true,
      data: result.logs,
      meta: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
