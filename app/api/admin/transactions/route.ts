import { NextResponse } from "next/server";
import { TransactionService } from "@/backend/services/transaction.service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || undefined;
    const dateFrom = searchParams.get("from") || undefined;
    const dateTo = searchParams.get("to") || undefined;

    const data = await TransactionService.getAll({
      page,
      limit,
      search,
      dateFrom,
      dateTo,
    });

    return NextResponse.json({
      success: true,
      data: data.transactions,
      meta: {
        total: data.total,
        page,
        limit,
        totalPages: Math.ceil(data.total / limit),
      },
    });
  } catch (error: any) {
    console.error("GET /api/admin/transactions error:", error.message);
    return NextResponse.json(
      { success: false, message: "Gagal memuat riwayat transaksi" },
      { status: 500 }
    );
  }
}
