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
    console.error("GET /api/kasir/transactions/[id] error:", error.message);
    return NextResponse.json(
      { success: false, message: "Gagal memuat detail transaksi" },
      { status: 500 }
    );
  }
}
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { pin, cancelReason } = await req.json();

    if (!id || !pin || !cancelReason) {
      return NextResponse.json({ success: false, message: "Data tidak lengkap" }, { status: 400 });
    }

    // 🔐 VALIDASI KEAMANAN: Cek PIN Admin
    const { AdminRepository } = await import("@/backend/repositories/admin.repo");
    const admin = await AdminRepository.findByPin(pin);

    if (!admin) {
      return NextResponse.json({ success: false, message: "PIN Admin salah atau tidak memiliki akses" }, { status: 403 });
    }

    // Ambil operatorId dari header x-user-id (diset oleh middleware)
    const operatorId = req.headers.get("x-user-id") || undefined;

    // Eksekusi VOID via Service (termasuk kembalikan stok & catat log)
    const result = await TransactionService.voidTransaction(id, cancelReason, operatorId);

    return NextResponse.json({
      success: true,
      message: "Transaksi berhasil dibatalkan (VOID)",
      data: result,
    });
  } catch (error: any) {
    console.error("PATCH /api/kasir/transactions/[id] error:", error.message);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal membatalkan transaksi" },
      { status: 500 }
    );
  }
}
