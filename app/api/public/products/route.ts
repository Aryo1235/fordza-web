import { NextResponse } from "next/server";
import { ProductService } from "@/backend/services/products.service";

// GET /api/public/products — Customer: lihat produk aktif
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const filters = {
      search: searchParams.get("search") || undefined,
      categoryIds: searchParams.getAll("categoryIds"),
      gender: searchParams.get("gender") || undefined,
      isPopular: searchParams.get("isPopular") === "true" || undefined,
      isBestseller: searchParams.get("isBestseller") === "true" || undefined,
      isNew: searchParams.get("isNew") === "true" || undefined,
      minPrice: searchParams.get("minPrice")
        ? parseFloat(searchParams.get("minPrice")!)
        : undefined,
      maxPrice: searchParams.get("maxPrice")
        ? parseFloat(searchParams.get("maxPrice")!)
        : undefined,
      sortBy: searchParams.get("sortBy") || "latest",
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
    };

    const result = await ProductService.getAll(filters);

    return NextResponse.json(
      {
        success: true,
        message: "Berhasil mengambil daftar produk",
        data: result.products,
        meta: result.meta,
      },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data produk", error: error.message },
      { status: 500 },
    );
  }
}
