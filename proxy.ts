import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { 
  verifyToken, 
  signAccessToken, 
  getAccessCookieConfig, 
  ACCESS_COOKIE_NAME, 
  REFRESH_COOKIE_NAME 
} from "@/lib/auth";

// Route yang TIDAK perlu auth
const PUBLIC_ROUTES = [
  "/api/admin/auth/login",
  "/api/admin/auth/refresh",
];

async function verifyJWT(token: string) {
  return await verifyToken(token);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Tentukan jenis rute
  const isApiRoute = pathname.startsWith("/api");
  const isAdminPage = pathname.startsWith("/dashboard");
  const isKasirPage = pathname.startsWith("/pos") || pathname.startsWith("/riwayat") || pathname.startsWith("/cetak-ulang");

  // Jika bukan rute yang perlu diproteksi, biarkan lewat
  if (!isApiRoute && !isAdminPage && !isKasirPage) {
    return NextResponse.next();
  }

  // Skip auth untuk public API routes
  if (isApiRoute && PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
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
  const payload = token ? await verifyJWT(token) : null;

  // Jika Access Token tidak valid/habis, kita cek apakah ada Refresh Token.
  // Kita TIDAK melakukan refresh di sini (biar Axios yang urus), 
  // tapi kita izinkan masuk ke halaman asalkan masih ada harapan (refresh token).
  if (!payload) {
    const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
    const isRefreshValid = refreshToken ? await verifyToken(refreshToken) : null;

    if (!isRefreshValid) {
      // Benar-benar tidak punya akses sama sekali -> Login
      if (isApiRoute) {
        return NextResponse.json(
          { success: false, message: "Sesi habis. Silakan login kembali." },
          { status: 401 },
        );
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }
    
    // Jika punya Refresh Token tapi Access Token abis, tetap biarkan masuk.
    // Nanti saat halaman load, permintaan API pertama akan memicu 401 dan dihandle Axios.
  }

  // Jika kita sampai di sini, artinya user punya payload valid ATAU punya refresh token valid.
  // Namun untuk logic ROLE GUARD di bawah, kita butuh payload (data user).
  // Jika payload belum ada (karena baru aja expire), kita ambil dari refresh token saja.
  const authPayload = payload || (await verifyToken(request.cookies.get(REFRESH_COOKIE_NAME)?.value!));

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
    return NextResponse.json({ success: false, message: "Akses ditolak." }, { status: 403 });
  }

  const isAdminApi = pathname.startsWith("/api/admin");
  const isMeEndpoint = pathname === "/api/admin/auth/me";
  const isLogoutEndpoint = pathname === "/api/admin/auth/logout";
  const isCashierListEndpoint = pathname === "/api/admin/cashiers" && request.method === "GET";
  const isKasirAllowedApi = isMeEndpoint || isLogoutEndpoint || isCashierListEndpoint;
  
  if (isAdminApi && role !== "ADMIN" && !isKasirAllowedApi) {
    return NextResponse.json({ success: false, message: "Akses ditolak." }, { status: 403 });
  }

  // Inject info ke header downstream agar controller tahu siapa yang request
  const response = NextResponse.next();
  response.headers.set("x-user-id", authPayload.id as string);
  response.headers.set("x-user-username", authPayload.username as string);
  response.headers.set("x-user-role", role);
  return response;
}

export const config = {
  matcher: [
    "/api/admin/:path*", 
    "/api/kasir/:path*", 
    "/dashboard/:path*", 
    "/pos/:path*", 
    "/riwayat/:path*",
    "/cetak-ulang/:path*"
  ],
};
