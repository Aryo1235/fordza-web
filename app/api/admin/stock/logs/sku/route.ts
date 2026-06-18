import { NextResponse } from "next/server";
import { StockRepository } from "@/backend/repositories/stock.repo";
import { handleError } from "@/lib/error-handler";
import { headers } from "next/headers";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || undefined;
    const type = searchParams.get("type") || undefined;
    const productId = searchParams.get("productId") || undefined;
    const skuId = searchParams.get("skuId") || undefined;
    const dateFrom = searchParams.get("from") || undefined;
    const dateTo = searchParams.get("to") || undefined;

    const result = await StockRepository.getSkuLogs({
      page,
      limit,
      search,
      type,
      productId,
      skuId,
      dateFrom,
      dateTo,
    });

    const totalPages = Math.ceil(result.total / limit);

    const headerList = await headers();
    const traceId = headerList.get("x-request-id") || "unknown";

    return NextResponse.json({
      success: true,
      data: result.logs,
      meta: {
        total: result.total,
        page,
        limit,
        totalPages,
      },
      traceId,
    });
  } catch (error: any) {
    return await handleError(error);
  }
}
