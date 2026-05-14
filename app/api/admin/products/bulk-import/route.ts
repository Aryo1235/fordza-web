import { NextResponse } from "next/server";
import { ProductService } from "@/backend/services/products.service";

export async function POST(req: Request) {
  try {
    const products = await req.json();

    if (!products || !Array.isArray(products)) {
      return NextResponse.json(
        { success: false, message: "Data produk (array) wajib ada" },
        { status: 400 }
      );
    }

    const operatorId = req.headers.get("x-user-id") || undefined;
    
    const results = await ProductService.bulkImport(products, operatorId);

    return NextResponse.json({
      success: true,
      message: "Proses import selesai",
      data: results
    });
  } catch (error: any) {
    console.error("POST /api/admin/products/bulk-import error:", error.message);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server", error: error.message },
      { status: 500 }
    );
  }
}
