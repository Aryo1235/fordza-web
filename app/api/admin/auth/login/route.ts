import { NextResponse } from "next/server";
import { AdminService } from "@/backend/services/admin.service";
import {
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  getAccessCookieConfig,
  getRefreshCookieConfig,
} from "@/lib/auth";
import { loginLimiter } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { headers } from "next/headers";
import { handleError } from "@/lib/error-handler";

export async function POST(req: Request) {
  const headerList = await headers();
  const traceId = headerList.get("x-request-id") || "unknown";

  try {
    // Rate limiting (5 attempts per minute per IP)
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const rateLimitResult = loginLimiter.check(5, ip);

    if (!rateLimitResult.success) {
      logger.warn({ traceId, ip }, "Login rate limit exceeded");
      return NextResponse.json(
        {
          success: false,
          message: "Terlalu banyak percobaan login. Silakan coba lagi nanti.",
          retryAfter: rateLimitResult.reset,
          traceId,
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

    const body = await req.json();
    const { username, password } = body;

    // 1. Validasi input
    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Username dan password wajib diisi", traceId },
        { status: 400 },
      );
    }

    // 2. Cari admin di database
    const admin = await AdminService.findByUsername(username);

    if (!admin) {
      logger.warn({ traceId, username, ip }, "Failed login attempt: User not found");
      return NextResponse.json(
        { success: false, message: "Username atau password salah", traceId },
        { status: 401 },
      );
    }

    // 3. Verify password
    const isPasswordValid = await verifyPassword(password, admin.password);

    if (!isPasswordValid) {
      logger.warn({ traceId, username, ip }, "Failed login attempt: Wrong password");
      return NextResponse.json(
        { success: false, message: "Username atau password salah", traceId },
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
        traceId,
      },
      { status: 200 },
    );

    response.cookies.set(getAccessCookieConfig(accessToken));
    response.cookies.set(getRefreshCookieConfig(refreshToken));

    logger.info({ traceId, username, role: admin.role, ip }, "Admin/Kasir login successful");

    return response;
  } catch (error: any) {
    return handleError(error);
  }
}
