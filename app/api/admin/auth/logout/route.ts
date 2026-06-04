import { NextResponse } from "next/server";
import { getLogoutCookieConfigs } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { handleError } from "@/lib/error-handler";
import { headers } from "next/headers";

export async function POST(req: Request) {
  try {
    const response = NextResponse.json(
      { success: true, message: "Logout berhasil" },
      { status: 200 },
    );

    // Hapus kedua cookie
    for (const cookieConfig of getLogoutCookieConfigs()) {
      response.cookies.set(cookieConfig);
    }

    const userId = req.headers.get("x-user-id") || "unknown";
    const headerList = await headers();
    const traceId = headerList.get("x-request-id") || "unknown";
    
    logger.info({ traceId, userId }, "User logged out successfully");

    return response;
  } catch (error: any) {
    return await handleError(error);
  }
}
