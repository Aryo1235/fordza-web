import { NextResponse } from "next/server";
import { StockRepository } from "@/backend/repositories/stock.repo";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || undefined;
    const type = searchParams.get("type") || undefined;

    const result = await StockRepository.getLogs({
      page,
      limit,
      search,
      type,
    });

    const totalPages = Math.ceil(result.total / limit);

    return NextResponse.json({
      success: true,
      data: result.logs,
      meta: {
        total: result.total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
