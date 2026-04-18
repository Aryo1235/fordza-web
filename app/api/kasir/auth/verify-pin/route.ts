import { NextResponse } from "next/server";
import { AdminService } from "@/backend/services/admin.service";

export async function POST(req: Request) {
  try {
    const { pin } = await req.json();

    if (!pin) {
      return NextResponse.json(
        { success: false, message: "PIN wajib diisi" },
        { status: 400 }
      );
    }

    const admin = await AdminService.verifyAdminPin(pin);

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "PIN salah atau tidak memiliki wewenang" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verifikasi berhasil",
      data: {
        adminId: admin.id,
        adminName: admin.name,
      },
    });
  } catch (error: any) {
    console.error("POST /api/kasir/auth/verify-pin error:", error.message);
    return NextResponse.json(
      { success: false, message: "Gagal memverifikasi PIN" },
      { status: 500 }
    );
  }
}
