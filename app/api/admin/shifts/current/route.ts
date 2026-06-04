import { NextResponse } from "next/server";
import { ShiftService } from "@/backend/services/shift.service";
import { verifyToken, ACCESS_COOKIE_NAME } from "@/lib/auth";
import { cookies } from "next/headers";
import { handleError, AppError } from "@/lib/error-handler";

export async function GET(req: Request) {
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

    const openShift = await ShiftService.checkCurrentShift(payload.id);

    // Kirim 200 dengan data null agar Frontend tahu belum ada shift secara gracefully
    return NextResponse.json({
      success: true,
      data: openShift || null,
    });
  } catch (error: any) {
    return await handleError(error);
  }
}
