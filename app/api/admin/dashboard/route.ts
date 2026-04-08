import { NextResponse } from "next/server";
import { DashboardService } from "@/services/dashboard.db";

export async function GET() {
  try {
    const stats = await DashboardService.getStats();
    return NextResponse.json({ success: true, data: stats }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
