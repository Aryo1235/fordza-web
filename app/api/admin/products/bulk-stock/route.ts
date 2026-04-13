import { NextResponse } from "next/server";
import { ProductService } from "@/backend/services/products.service";

export async function PATCH(req: Request) {
  try {
    const { items } = await req.json();

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, message: "Data 'items' (array) wajib ada" },
        { status: 400 }
      );
    }

    const operatorId = req.headers.get("x-user-id") || undefined;
    
    // items should be [{ id, stock }]
    await ProductService.bulkUpdateStock(items, operatorId);

    return NextResponse.json({
      success: true,
      message: "Stok berhasil diperbarui secara massal",
    });
  } catch (error: any) {
    console.error("PATCH /api/admin/products/bulk-stock error:", error.message);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui stok" },
      { status: 500 }
    );
  }
}
