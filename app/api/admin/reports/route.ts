import { NextResponse } from "next/server";
import { ReportService } from "@/backend/services/report.service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get("from");
    const dateTo = searchParams.get("to");
    const search = searchParams.get("search") || undefined;
    const sortBy = searchParams.get("sortBy") || undefined;
    const minQuantityRaw = searchParams.get("minQuantity");
    const minQuantity = minQuantityRaw ? Number(minQuantityRaw) : undefined;

    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { success: false, message: "Parameter 'from' dan 'to' wajib ada" },
        { status: 400 },
      );
    }

    const report = await ReportService.getSalesReportSummary(dateFrom, dateTo);

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    console.error("GET /api/admin/reports error:", error.message);
    return NextResponse.json(
      { success: false, message: "Gagal memuat laporan" },
      { status: 500 },
    );
  }
}
