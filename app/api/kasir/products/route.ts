import { NextResponse } from "next/server";
import { ProductRepository } from "@/backend/repositories/products.repo";
import { handleError } from "@/lib/error-handler";

/**
 * Kasir Products Route
 * ─────────────────────────────────────────────
 * Endpoint ini mengambil produk yang tersedia untuk kasir.
 * Filter khusus: hanya produk AKTIF dan stok > 0.
 *
 * Menggunakan ProductRepository langsung karena ini murni
 * "ambil data" tanpa logika bisnis tambahan.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    const result = await ProductRepository.getForKasir({ search, page, limit });

    return NextResponse.json({
      success: true,
      data: result.products,
      meta: result.meta,
    });
  } catch (error: any) {
    return await handleError(error);
  }
}
