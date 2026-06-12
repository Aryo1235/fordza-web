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
    const { startingCash, notes } = body;

    if (startingCash === undefined || isNaN(Number(startingCash))) {
      throw new AppError("Modal Awal nominal tidak valid", 400, "INVALID_INPUT");
    }

    const newShift = await ShiftService.openShift(payload.id, Number(startingCash), notes);

    const headerList = await headers();
    const traceId = headerList.get("x-request-id") || "unknown";
    logger.info({ traceId, shiftId: newShift.id, adminId: payload.id }, "New shift opened");

    return NextResponse.json({
      success: true,
      data: newShift,
      traceId,
    });
  } catch (error: any) {
    return await handleError(error);
  }
}
