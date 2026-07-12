import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import {
  verifyToken,
  signAccessToken,
  getAccessCookieConfig,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from "@/lib/auth";

// Route yang TIDAK perlu auth (tapi masih masuk matcher protected)
const PUBLIC_ROUTES = ["/api/admin/auth/login", "/api/admin/auth/refresh"];

const PUBLIC_API_PREFIXES = ["/api/public", "/api/recommend", "/api/health"];

async function verifyJWT(token: string, type: "access" | "refresh" = "access") {
  return await verifyToken(token, type);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Generate or forward request ID
  const requestId =
    request.headers.get("x-nf-request-id") ||
    request.headers.get("x-request-id") ||
    uuidv4();

  // Tentukan jenis rute
  const isApiRoute = pathname.startsWith("/api");
  const isAdminPage = pathname.startsWith("/dashboard");
  const isKasirPage =
    pathname.startsWith("/pos") ||
    pathname.startsWith("/riwayat") ||
    pathname.startsWith("/cetak-ulang");

  if (!isApiRoute && !isAdminPage && !isKasirPage) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-request-id", requestId);

    const response = NextResponse.next({
      request: { headers: requestHeaders }, // ✅ Ini kuncinya!
    });
    response.headers.set("x-request-id", requestId);
    return response;
  }

  // Terapkan hal yang sama persis untuk PUBLIC_ROUTES
  if (isApiRoute && PUBLIC_ROUTES.includes(pathname)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-request-id", requestId);

    const response = NextResponse.next({
      request: { headers: requestHeaders }, // ✅ Kunci agar API bisa baca
    });
    response.headers.set("x-request-id", requestId);
    return response;
  }

  // Ambil token dari cookie atau Authorization header
  let token: string | undefined;
  token = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  if (!token) {
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }

  // --- LOGIKA PENJAGA GERBANG (PASSIVE GUARD) ---
  const payload = token ? await verifyJWT(token, "access") : null;

  // Jika Access Token tidak valid/habis
  if (!payload) {
    // 🔐 KEAMANAN API: Jika rute API, langsung kembalikan 401 tanpa kompromi (tidak boleh bypass pakai refresh token)
    if (isApiRoute) {
      console.warn(
        `[MIDDLEWARE] Sesi habis/Token tidak valid untuk API Route. TraceID: ${requestId}`,
      );
      return NextResponse.json(
        {
          success: false,
          message: "Sesi habis. Silakan login kembali.",
          code: "UNAUTHORIZED",
          traceId: requestId,
        },
        { status: 401 },
      );
    }

    // Untuk halaman frontend, kita izinkan masuk asalkan masih ada Refresh Token yang valid
    // (agar halaman ter-render dan Axios client-side bisa melakukan silent-refresh)
    const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
    const isRefreshValid = refreshToken
      ? await verifyToken(refreshToken, "refresh")
      : null;

    if (!isRefreshValid) {
      // Benar-benar tidak punya akses sama sekali -> redirect ke login
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Jika kita sampai di sini, artinya user punya payload valid ATAU punya refresh token valid.
  // Namun untuk logic ROLE GUARD di bawah, kita butuh payload (data user).
  // Jika payload belum ada (karena baru aja expire), kita ambil dari refresh token saja.
  const authPayload =
    payload ||
    (await verifyToken(
      request.cookies.get(REFRESH_COOKIE_NAME)?.value!,
      "refresh",
    ));

  if (!authPayload) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = authPayload.role as string;

  // --- LOGIKA ROLE GUARD (PEMBATASAN AKSES) ---
  if (isAdminPage && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/pos", request.url));
  }

  const isKasirApi = pathname.startsWith("/api/kasir");
  if (isKasirApi && role !== "ADMIN" && role !== "KASIR") {
    console.warn(
      `[MIDDLEWARE] Akses Ditolak (Kasir API). Role: ${role}. TraceID: ${requestId}`,
    );
    return NextResponse.json(
      {
        success: false,
        message: "Akses ditolak.",
        code: "FORBIDDEN",
        traceId: requestId,
      },
      { status: 403 },
    );
  }

  const isAdminApi = pathname.startsWith("/api/admin");
  const isMeEndpoint = pathname === "/api/admin/auth/me";
  const isLogoutEndpoint = pathname === "/api/admin/auth/logout";
  const isCashierListEndpoint =
    pathname === "/api/admin/cashiers" && request.method === "GET";
  const isExportEndpoint =
    pathname === "/api/admin/transactions/export" && request.method === "GET";
  const isShiftEndpoint = pathname.startsWith("/api/admin/shifts");
  const isKasirAllowedApi =
    isMeEndpoint ||
    isLogoutEndpoint ||
    isCashierListEndpoint ||
    isExportEndpoint ||
    isShiftEndpoint;

  if (isAdminApi && role !== "ADMIN" && !isKasirAllowedApi) {
    console.warn(
      `[MIDDLEWARE] Akses Ditolak (Admin API). Role: ${role}. TraceID: ${requestId}`,
    );
    return NextResponse.json(
      {
        success: false,
        message: "Akses ditolak.",
        code: "FORBIDDEN",
        traceId: requestId,
      },
      { status: 403 },
    );
  }

  // Inject info ke header downstream (API) dan upstream (Browser)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);
  requestHeaders.set("x-user-id", authPayload.id as string);
  requestHeaders.set("x-user-username", authPayload.username as string);
  requestHeaders.set("x-user-role", role);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Kirim balik ke browser agar frontend bisa menampilkan Trace ID jika error
  response.headers.set("x-request-id", requestId);

  return response;
}

export const config = {
  matcher: [
    // Protected routes (butuh auth)
    "/api/admin/:path*",
    "/api/kasir/:path*",
    "/api/public/:path*",
    "/api/recommend/:path*",
    "/api/health/:path*",
    "/dashboard/:path*",
    "/pos/:path*",
    "/riwayat/:path*",
    "/cetak-ulang/:path*",
    // Public API routes (hanya inject traceId)
    "/api/public/:path*",
    "/api/recommend/:path*",
    "/api/health/:path*",
  ],
};
