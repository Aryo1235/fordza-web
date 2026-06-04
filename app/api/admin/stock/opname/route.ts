import { NextResponse } from "next/server";
import { StockOpnameService } from "@/backend/services/stock-opname.service";
import { handleError } from "@/lib/error-handler";
import { headers } from "next/headers";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const filters = {
      search: searchParams.get("search") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
    };

    const result = await StockOpnameService.getForOpname(filters);

    return NextResponse.json(
      {
        success: true,
        message: "Berhasil mengambil daftar produk untuk stock opname",
        data: result.products,
        meta: result.meta,
      },
      { status: 200 },
    );
  } catch (error: any) {
    return await handleError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const headerList = await headers();
    const traceId = headerList.get("x-request-id") || "unknown";
    const { items } = await req.json();

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, message: "Data 'items' (array) wajib ada", code: "VALIDATION_ERROR", traceId },
        { status: 400 }
      );
    }

    const operatorId = req.headers.get("x-user-id") || undefined;
    
    await StockOpnameService.bulkUpdateStock(items, operatorId);

    return NextResponse.json({
      success: true,
      message: "Stok berhasil diperbarui secara massal",
      code: "SUCCESS",
      traceId
    });
  } catch (error: any) {
    return await handleError(error);
  }
}
