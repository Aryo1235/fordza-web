import { NextResponse } from "next/server";
import { AdminService } from "@/backend/services/admin.service";
import { pinLimiter } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    // Rate limiting (3 attempts per minute per IP)
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const rateLimitResult = pinLimiter.check(3, ip);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Terlalu banyak percobaan PIN. Silakan coba lagi nanti.",
          retryAfter: rateLimitResult.reset,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toISOString(),
          },
        }
      );
    }

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
