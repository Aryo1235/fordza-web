import { NextResponse } from "next/server";
import { ReportService } from "@/backend/services/report.service";
import { handleError, AppError } from "@/lib/error-handler";
import { headers } from "next/headers";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let dateFrom = searchParams.get("from");
    let dateTo = searchParams.get("to");
    const search = searchParams.get("search") || undefined;
    const sortBy = searchParams.get("sortBy") || undefined;
    const minQuantityRaw = searchParams.get("minQuantity");
    const minQuantity = minQuantityRaw ? Number(minQuantityRaw) : undefined;

    if (!dateFrom || !dateTo) {
      const wibNow = new Date(Date.now() + 7 * 60 * 60 * 1000);
      const wib30DaysAgo = new Date(wibNow.getTime() - 30 * 24 * 60 * 60 * 1000);
      if (!dateTo) dateTo = wibNow.toISOString().split("T")[0];
      if (!dateFrom) dateFrom = wib30DaysAgo.toISOString().split("T")[0];
    }

    const report = await ReportService.getSalesReportSummary(dateFrom, dateTo);

    const headerList = await headers();
    const traceId = headerList.get("x-request-id") || "unknown";

    return NextResponse.json({
      success: true,
      data: report,
      traceId,
    });
  } catch (error: any) {
    return await handleError(error);
  }
}
