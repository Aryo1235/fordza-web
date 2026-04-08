import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fordza-secret-key-change-in-production",
);

const ACCESS_COOKIE_NAME = "access_token";

// Route yang TIDAK perlu auth
const PUBLIC_ROUTES = [
  "/api/admin/auth/login",
  "/api/admin/auth/refresh",
];

async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Hanya intercept /api/admin/* dan /api/kasir/*
  const isAdminRoute = pathname.startsWith("/api/admin");
  const isKasirRoute = pathname.startsWith("/api/kasir");

  if (!isAdminRoute && !isKasirRoute) {
    return NextResponse.next();
  }

  // Skip auth untuk public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
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

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Unauthorized. Silakan login terlebih dahulu." },
      { status: 401 },
    );
  }

  const payload = await verifyJWT(token);

  if (!payload) {
    return NextResponse.json(
      { success: false, message: "Token tidak valid atau sudah kadaluarsa." },
      { status: 401 },
    );
  }

  if (payload.type !== "access") {
    return NextResponse.json(
      { success: false, message: "Gunakan access token, bukan refresh token." },
      { status: 401 },
    );
  }

  const role = payload.role as string;

  // Route /api/kasir/* hanya bisa diakses ADMIN atau KASIR
  if (isKasirRoute && role !== "ADMIN" && role !== "KASIR") {
    return NextResponse.json(
      { success: false, message: "Akses ditolak." },
      { status: 403 },
    );
  }

  // Route /api/admin/* hanya bisa diakses ADMIN
  // Pengecualian: KASIR boleh akses /me (untuk cek info akun) dan /logout
  const isKasirAllowed = pathname === "/api/admin/auth/me" || pathname === "/api/admin/auth/logout";
  
  if (isAdminRoute && role !== "ADMIN" && !isKasirAllowed) {
    return NextResponse.json(
      { success: false, message: "Akses ditolak. Hanya Admin yang diizinkan." },
      { status: 403 },
    );
  }

  // Inject info ke header downstream
  const response = NextResponse.next();
  response.headers.set("x-user-id", payload.id as string);
  response.headers.set("x-user-username", payload.username as string);
  response.headers.set("x-user-role", role);
  return response;
}

export const config = {
  matcher: ["/api/admin/:path*", "/api/kasir/:path*"],
};
