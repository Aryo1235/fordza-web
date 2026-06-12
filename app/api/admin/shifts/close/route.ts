import { NextResponse } from "next/server";
import { ShiftService } from "@/backend/services/shift.service";
import { verifyToken, ACCESS_COOKIE_NAME } from "@/lib/auth";
import { cookies, headers } from "next/headers";
import { handleError, AppError } from "@/lib/error-handler";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    let token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
    if (!token) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) token = authHeader.slice(7);
    }

    if (!token) {
      throw new AppError("Tidak ada session", 401, "UNAUTHORIZED");
    }

    const payload = await verifyToken(token);
    if (!payload || payload.type !== "access") {
      throw new AppError("Token tidak valid", 401, "UNAUTHORIZED");
    }

    const body = await req.json();
    const { actualEndingCash } = body;

    if (actualEndingCash === undefined || isNaN(Number(actualEndingCash))) {
      throw new AppError("Uang Fisik nominal tidak valid", 400, "INVALID_INPUT");
    }

    const closedShift = await ShiftService.closeShift(payload.id, Number(actualEndingCash));

    const headerList = await headers();
    const traceId = headerList.get("x-request-id") || "unknown";
    logger.info({ traceId, shiftId: closedShift.id, adminId: payload.id }, "Shift closed successfully");

    return NextResponse.json({
      success: true,
      data: closedShift,
    });
  } catch (error: any) {
    return await handleError(error);
  }
}
