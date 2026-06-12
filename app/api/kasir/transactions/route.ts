import { NextResponse } from "next/server";
import { TransactionService } from "@/backend/services/transaction.service";
import { handleError } from "@/lib/error-handler";
import { logger } from "@/lib/logger";
import { headers } from "next/headers";

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

    const headerList = await headers();
    const traceId = headerList.get("x-request-id") || "unknown";

    return NextResponse.json({
      success: true,
      data: result.transactions,
      meta: { total: result.total, page, limit, totalPages: Math.ceil(result.total / limit) },
      traceId,
    });
  } catch (error: any) {
    return await handleError(error);
  }
}

// POST: Proses transaksi baru (Checkout Kasir)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, amountPaid, customerName, customerPhone, adminPin, paymentMethod } = body;

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

    const method = paymentMethod || "CASH";
    if (method === "CASH" && (!amountPaid || amountPaid <= 0)) {
      return NextResponse.json(
        { success: false, message: "Nominal pembayaran tidak valid" },
        { status: 400 }
      );
    }

    // Serahkan seluruh logika bisnis ke TransactionService
    const transaction = await TransactionService.checkout({ 
      kasirId, 
      items, 
      amountPaid: amountPaid || 0,
      customerName,
      customerPhone,
      adminPin,
      paymentMethod: method,
    });

    const headerList = await headers();
    const traceId = headerList.get("x-request-id") || "unknown";

    logger.info({ 
      traceId,
      invoiceNo: transaction.invoiceNo, 
      totalPrice: transaction.totalPrice, 
      kasirId,
      customerName 
    }, "Transaction completed successfully");

    return NextResponse.json({
      success: true,
      message: "Transaksi berhasil",
      data: transaction,
      traceId,
    });
  } catch (error: any) {
    return await handleError(error);
  }
}
