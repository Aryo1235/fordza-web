import { NextResponse } from "next/server";
import { ProductService } from "@/backend/services/products.service";
import { handleError } from "@/lib/error-handler";
import { headers } from "next/headers";

export async function POST(req: Request) {
  try {
    const headerList = await headers();
    const traceId = headerList.get("x-request-id") || "unknown";
    const products = await req.json();

    if (!products || !Array.isArray(products)) {
      return NextResponse.json(
        { success: false, message: "Data produk (array) wajib ada", code: "VALIDATION_ERROR", traceId },
        { status: 400 }
      );
    }

    const operatorId = req.headers.get("x-user-id") || undefined;
    
    const results = await ProductService.bulkImport(products, operatorId);

    const code = results.failed > 0 ? "PARTIAL_SUCCESS" : "SUCCESS";

    return NextResponse.json({
      success: true,
      message: "Proses import selesai",
      code,
      traceId,
      data: results
    });
  } catch (error: any) {
    return await handleError(error);
  }
}
