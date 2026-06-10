import { NextResponse } from "next/server";
import { ShiftService } from "@/backend/services/shift.service";
import { handleError, AppError } from "@/lib/error-handler";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const role = req.headers.get("x-user-role");
    if (role !== "ADMIN") {
      throw new AppError("Akses Ditolak: Hanya Admin yang dapat memantau shift laci", 403, "FORBIDDEN");
    }

    const { id } = await params;
    const data = await ShiftService.getShiftById(id);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    return await handleError(error);
  }
}
