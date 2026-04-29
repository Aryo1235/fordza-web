import { NextResponse } from "next/server";
import { ShiftService } from "@/backend/services/shift.service";
import { verifyToken, ACCESS_COOKIE_NAME } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    let token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
    if (!token) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) token = authHeader.slice(7);
    }

    if (!token) {
      return NextResponse.json({ success: false, message: "Tidak ada session" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.type !== "access") {
      return NextResponse.json({ success: false, message: "Token tidak valid" }, { status: 401 });
    }

    const body = await req.json();
    const { startingCash, notes } = body;

    if (startingCash === undefined || isNaN(Number(startingCash))) {
      return NextResponse.json({ success: false, message: "Modal Awal nominal tidak valid" }, { status: 400 });
    }

    const newShift = await ShiftService.openShift(payload.id, Number(startingCash), notes);

    return NextResponse.json({
      success: true,
      data: newShift,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
