import { NextResponse } from "next/server";
import { TransactionService } from "@/backend/services/transaction.service";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ success: false, message: "ID Transaksi tidak valid" }, { status: 400 });
    }

    const transaction = await TransactionService.getById(id);

    if (!transaction) {
      return NextResponse.json(
        { success: false, message: "Transaksi tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: transaction,
    });
  } catch (error: any) {
    console.error("GET /api/admin/transactions/[id] error:", error.message);
    return NextResponse.json(
      { success: false, message: "Gagal memuat detail transaksi" },
      { status: 500 }
    );
  }
}
