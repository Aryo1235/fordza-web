import { NextResponse } from "next/server";
import { ShiftService } from "@/backend/services/shift.service";
import { handleError, AppError } from "@/lib/error-handler";

export async function GET(req: Request) {
  try {
    const role = req.headers.get("x-user-role");
    if (role !== "ADMIN") {
      throw new AppError("Akses Ditolak: Hanya Admin yang dapat memantau statistik shift laci", 403, "FORBIDDEN");
    }

    const stats = await ShiftService.getShiftsStats();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    return await handleError(error);
  }
}
