import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fordza-secret-key-change-in-production",
);

// --- TOKEN CONFIG ---
const ACCESS_TOKEN_EXPIRY = "15m"; // 15 menit
const REFRESH_TOKEN_EXPIRY = "7d"; // 7 hari

const ACCESS_COOKIE_NAME = "access_token";
const REFRESH_COOKIE_NAME = "refresh_token";

// --- PASSWORD ---
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// --- JWT: ACCESS TOKEN (pendek, untuk akses API) ---
export async function signAccessToken(payload: {
  id: string;
  username: string;
  role: string;
}): Promise<string> {
  return await new SignJWT({ ...payload, type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

// --- JWT: REFRESH TOKEN (panjang, untuk dapat access token baru) ---
export async function signRefreshToken(payload: {
  id: string;
  username: string;
  role: string;
}): Promise<string> {
  return await new SignJWT({ ...payload, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

// --- VERIFY TOKEN (bisa access atau refresh) ---
export async function verifyToken(
  token: string,
): Promise<{ id: string; username: string; role: string; type: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { id: string; username: string; role: string; type: string };
  } catch {
    return null;
  }
}

// --- COOKIE CONFIGS ---

// Access Token Cookie (15 menit)
export function getAccessCookieConfig(token: string) {
  return {
    name: ACCESS_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 15, // 15 menit
  };
}

// Refresh Token Cookie (7 hari)
export function getRefreshCookieConfig(token: string) {
  return {
    name: REFRESH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 hari
  };
}

// Logout: hapus kedua cookie
export function getLogoutCookieConfigs() {
  const base = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
  return [
    { name: ACCESS_COOKIE_NAME, value: "", ...base },
    { name: REFRESH_COOKIE_NAME, value: "", ...base },
  ];
}

export { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME };
