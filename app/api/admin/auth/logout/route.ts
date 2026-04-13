import { NextResponse } from "next/server";
import { getLogoutCookieConfigs } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json(
    { success: true, message: "Logout berhasil" },
    { status: 200 },
  );

  // Hapus kedua cookie
  for (const cookieConfig of getLogoutCookieConfigs()) {
    response.cookies.set(cookieConfig);
  }

  return response;
}
