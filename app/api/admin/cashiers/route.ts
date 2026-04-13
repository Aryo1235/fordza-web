import { NextResponse } from "next/server";
import { AdminService } from "@/backend/services/admin.service";

export async function GET() {
  try {
    const cashiers = await AdminService.getAllCashiers();
    return NextResponse.json({
      success: true,
      data: cashiers,
    });
  } catch (error: any) {
    console.error("GET /api/admin/cashiers error:", error.message);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil daftar kasir" },
      { status: 500 }
    );
  }
}
