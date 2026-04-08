import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  verifyToken,
  signAccessToken,
  getAccessCookieConfig,
  REFRESH_COOKIE_NAME,
} from "@/lib/auth";

// POST /api/admin/auth/refresh — Dapat access token baru pakai refresh token
export async function POST(req: Request) {
  try {
    // Cari refresh token: Cookie ATAU body
    let refreshToken: string | undefined;

    // 1. Dari cookie
    const cookieStore = await cookies();
    refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;

    // 2. Dari body (untuk Postman)
    if (!refreshToken) {
      try {
        const body = await req.json();
        refreshToken = body.refreshToken;
      } catch {
        // Body kosong, tidak apa-apa
      }
    }

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Refresh token tidak ditemukan. Silakan login ulang.",
          hint: "Kirim refresh token via cookie atau body { refreshToken: '...' }",
        },
        { status: 401 },
      );
    }

    // Verify refresh token
    const payload = await verifyToken(refreshToken);

    if (!payload || payload.type !== "refresh") {
      return NextResponse.json(
        {
          success: false,
          message: "Refresh token tidak valid atau expired. Silakan login ulang.",
        },
        { status: 401 },
      );
    }

    // Generate access token baru
    const newAccessToken = await signAccessToken({
      id: payload.id,
      username: payload.username,
      role: payload.role || "ADMIN",
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Access token berhasil di-refresh",
        data: {
          accessToken: newAccessToken, // Dikembalikan di body (untuk Postman)
        },
      },
      { status: 200 },
    );

    // Set cookie baru
    response.cookies.set(getAccessCookieConfig(newAccessToken));

    return response;
  } catch (error: any) {
    console.error("Refresh Token Error:", error.message);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 },
    );
  }
}
