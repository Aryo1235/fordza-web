import { NextResponse } from "next/server";
import { AdminService } from "@/backend/services/admin.service";
import { verifyToken, ACCESS_COOKIE_NAME } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  try {
    // Cari token: Cookie ATAU Authorization Header
    let token: string | undefined;

    // 1. Cookie
    const cookieStore = await cookies();
    token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;

    // 2. Authorization header (untuk Postman)
    if (!token) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.slice(7);
      }
    }

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Tidak ada session" },
        { status: 401 },
      );
    }

    const payload = await verifyToken(token);

    if (!payload || payload.type !== "access") {
      return NextResponse.json(
        { success: false, message: "Token tidak valid" },
        { status: 401 },
      );
    }

    // Ambil data admin terbaru dari DB (tanpa password)
    const admin = await AdminService.findById(payload.id);

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Admin tidak ditemukan" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: admin,
    });
  } catch (error: any) {
    console.error("Auth Me Error:", error.message);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 },
    );
  }
}
