import { NextResponse } from "next/server";
import { TransactionService } from "@/backend/services/transaction.service";

// GET: Riwayat transaksi
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 20);
    const search = searchParams.get("search") || undefined;
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;
    const kasirId = searchParams.get("kasirId") || undefined;

    const result = await TransactionService.getAll({ page, limit, search, dateFrom, dateTo, kasirId });

    return NextResponse.json({
      success: true,
      data: result.transactions,
      meta: { total: result.total, page, limit, totalPages: Math.ceil(result.total / limit) },
    });
  } catch (error: any) {
    console.error("GET /api/kasir/transactions error:", error.message);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil riwayat transaksi" },
      { status: 500 }
    );
  }
}

// POST: Proses transaksi baru (Checkout Kasir)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, amountPaid, customerName, customerPhone, adminPin } = body;

    // Kasir ID diambil dari header (diset oleh middleware auth)
    const kasirId = request.headers.get("x-user-id");

    // Validasi level Controller (header/auth) — bukan tugas Service
    if (!kasirId) {
      return NextResponse.json(
        { success: false, message: "Sesi kasir tidak valid" },
        { status: 401 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Keranjang belanja kosong" },
        { status: 400 }
      );
    }

    if (!amountPaid || amountPaid <= 0) {
      return NextResponse.json(
        { success: false, message: "Nominal pembayaran tidak valid" },
        { status: 400 }
      );
    }

    // Serahkan seluruh logika bisnis ke TransactionService
    const transaction = await TransactionService.checkout({ 
      kasirId, 
      items, 
      amountPaid,
      customerName,
      customerPhone,
      adminPin,
    });

    return NextResponse.json({
      success: true,
      message: "Transaksi berhasil",
      data: transaction,
    });
  } catch (error: any) {
    console.error("POST /api/kasir/transactions error:", error.message);

    // Error dari Service (validasi stok, pembayaran kurang, dll)
    const isClientError = [
      "tidak cukup",
      "tidak ditemukan",
      "kurang dari",
      "tidak boleh",
      "membutuhkan otorisasi",
      "PIN Admin salah",
    ].some((msg) => error.message?.includes(msg));

    return NextResponse.json(
      { success: false, message: error.message || "Gagal memproses transaksi" },
      { status: isClientError ? 400 : 500 }
    );
  }
}
