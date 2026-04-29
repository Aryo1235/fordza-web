import { NextResponse } from "next/server";
import { ReportService } from "@/backend/services/report.service";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildFileName(baseName: string, extension: string) {
  return `${baseName}_${format(new Date(), "yyyyMMdd_HHmm")}.${extension}`;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get("from");
    const dateTo = searchParams.get("to");
    const formatType = (searchParams.get("format") || "excel").toLowerCase();

    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { success: false, message: "Parameter 'from' dan 'to' wajib ada" },
        { status: 400 },
      );
    }

    const report = await ReportService.getSalesReportSummary(dateFrom, dateTo);
    const topProducts = [...report.topProducts].slice(0, 5);

    if (formatType === "pdf") {
      const doc = new jsPDF({ orientation: "landscape" });
      doc.setFontSize(16);
      doc.text("Laporan Penjualan Fordza", 14, 16);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(
        `Periode: ${format(new Date(dateFrom), "dd MMM yyyy")} - ${format(new Date(dateTo), "dd MMM yyyy")}`,
        14,
        22,
      );

      autoTable(doc, {
        startY: 28,
        head: [["Total Pendapatan", "Total Transaksi", "Rata-rata Order"]],
        body: [
          [
            `Rp ${Number(report.summary.totalRevenue || 0).toLocaleString("id-ID")}`,
            report.summary.totalOrders,
            `Rp ${Math.round(report.summary.averageOrderValue || 0).toLocaleString("id-ID")}`,
          ],
        ],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [60, 48, 37] },
      });

      doc.text(
        "Top 5 Produk Terlaris",
        14,
        (doc as any).lastAutoTable.finalY + 10,
      );
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 14,
        head: [["Kode Produk", "Kode Variant", "Nama Produk", "Warna", "Size", "Qty", "Revenue"]],
        body: topProducts.map((product: any) => [
          product.code || "-",
          product.variantCode || "-",
          product.name,
          product.color || "-",
          product.size || "-",
          product.quantity,
          `Rp ${Number(product.revenue || 0).toLocaleString("id-ID")}`,
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [80, 70, 60] },
      });

      const pdfBuffer = new Uint8Array(doc.output("arraybuffer"));
      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${buildFileName("Laporan_Ringkasan_Penjualan_Fordza", "pdf")}"`,
        },
      });
    }

    const workbook = XLSX.utils.book_new();
    const summarySheet = XLSX.utils.json_to_sheet([
      {
        Periode: `${format(new Date(dateFrom), "dd MMM yyyy")} - ${format(new Date(dateTo), "dd MMM yyyy")}`,
        "Total Pendapatan": Number(report.summary.totalRevenue || 0),
        "Total Transaksi": report.summary.totalOrders,
        "Rata-rata Order": Number(report.summary.averageOrderValue || 0),
      },
    ]);
    const topSheet = XLSX.utils.json_to_sheet(
      topProducts.map((product: any) => ({
        "Kode Produk": product.code || "-",
        "Kode Variant": product.variantCode || "-",
        "Nama Produk": product.name,
        Warna: product.color || "-",
        Ukuran: product.size || "-",
        Qty: product.quantity,
        Revenue: Number(product.revenue || 0),
      }))
    );
    // Force Turbopack Rebuild: SKU-Centric Version 2.0
    const trendSheet = XLSX.utils.json_to_sheet(
      report.chartData.length > 0
        ? report.chartData
        : [{ Info: "Tidak ada tren harian" }],
    );

    XLSX.utils.book_append_sheet(workbook, summarySheet, "Ringkasan");
    XLSX.utils.book_append_sheet(workbook, topSheet, "Top Produk");
    XLSX.utils.book_append_sheet(workbook, trendSheet, "Tren Harian");

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${buildFileName("Laporan_Ringkasan_Penjualan_Fordza", "xlsx")}"`,
      },
    });
  } catch (error: any) {
    console.error(
      "GET /api/admin/reports/export/summary error:",
      error.message,
    );
    return NextResponse.json(
      { success: false, message: "Gagal mengekspor laporan ringkasan" },
      { status: 500 },
    );
  }
}
