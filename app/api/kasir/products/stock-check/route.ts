import { NextResponse } from "next/server";
import { ProductRepository } from "@/backend/repositories/products.repo";
import { handleError } from "@/lib/error-handler";
import { logger } from "@/lib/logger";
import { headers } from "next/headers";
import { sanitizeSearch } from "@/lib/utils";

/**
 * GET /api/kasir/products/stock-check
 * ─────────────────────────────────────────────
 * Endpoint ringan khusus untuk dialog "Cek Stok Cepat" di halaman POS.
 * Hanya mengembalikan: id, productCode, name, category, stock.
 * Tidak membawa data varian, SKU, promo, atau gambar.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const searchRaw = searchParams.get("search") || "";
    const search = sanitizeSearch(searchRaw).trim();
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const result = await ProductRepository.getForStockCheck({ search, page, limit });

    const headerList = await headers();
    const traceId = headerList.get("x-request-id") || "unknown";

    logger.info({ traceId, search, count: result.products.length }, "Stock check query processed");

    return NextResponse.json({
      success: true,
      data: result.products,
      meta: result.meta,
      traceId,
    });
  } catch (error: any) {
    return await handleError(error);
  }
}
