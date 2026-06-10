import { NextResponse } from "next/server";
import { ShiftService } from "@/backend/services/shift.service";
import { handleError, AppError } from "@/lib/error-handler";

export async function GET(req: Request) {
  try {
    const role = req.headers.get("x-user-role");
    if (role !== "ADMIN") {
      throw new AppError("Akses Ditolak: Hanya Admin yang dapat memantau shift laci", 403, "FORBIDDEN");
    }

    const { searchParams } = new URL(req.url);
    const filters = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
      search: searchParams.get("search") || undefined,
      status: searchParams.get("status") || undefined,
      kasirId: searchParams.get("kasirId") || undefined,
    };

    const data = await ShiftService.getAllShiftsPaginated(filters);

    return NextResponse.json({
      success: true,
      data: data.shifts,
      meta: data.meta,
    });
  } catch (error: any) {
    return await handleError(error);
  }
}
