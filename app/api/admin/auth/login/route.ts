import { NextResponse } from "next/server";
import { AdminService } from "@/backend/services/admin.service";
import {
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  getAccessCookieConfig,
  getRefreshCookieConfig,
} from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;

    // 1. Validasi input
    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Username dan password wajib diisi" },
        { status: 400 },
      );
    }

    // 2. Cari admin di database
    const admin = await AdminService.findByUsername(username);

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Username atau password salah" },
        { status: 401 },
      );
    }

    // 3. Verify password
    const isPasswordValid = await verifyPassword(password, admin.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "Username atau password salah" },
        { status: 401 },
      );
    }

    // 4. Generate kedua token
    const tokenPayload = { id: admin.id, username: admin.username, role: admin.role };
    const accessToken = await signAccessToken(tokenPayload);
    const refreshToken = await signRefreshToken(tokenPayload);

    // 5. Set cookies & return response
    const response = NextResponse.json(
      {
        success: true,
        message: "Login berhasil",
        data: {
          id: admin.id,
          username: admin.username,
          name: admin.name,
          role: admin.role,
          accessToken,
          refreshToken,
        },
      },
      { status: 200 },
    );

    response.cookies.set(getAccessCookieConfig(accessToken));
    response.cookies.set(getRefreshCookieConfig(refreshToken));

    return response;
  } catch (error: any) {
    console.error("Login Error:", error.message);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 },
    );
  }
}
