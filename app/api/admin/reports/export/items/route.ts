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
    const search = searchParams.get("search") || undefined;
    const sortBy = searchParams.get("sortBy") || undefined;
    const minQuantityRaw = searchParams.get("minQuantity");
    const minQuantity = minQuantityRaw ? Number(minQuantityRaw) : undefined;
    const formatType = (searchParams.get("format") || "excel").toLowerCase();

    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { success: false, message: "Parameter 'from' dan 'to' wajib ada" },
        { status: 400 },
      );
    }

    const report = await ReportService.getSalesReportStats(dateFrom, dateTo, {
      search,
      sortBy: sortBy as any,
      minQuantity,
    });
    const detailRows = report.soldProducts;

    if (formatType === "pdf") {
      const doc = new jsPDF({ orientation: "landscape" });
      doc.setFontSize(16);
      doc.text("Laporan Detail Penjualan Fordza", 14, 16);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(
        `Periode: ${format(new Date(dateFrom), "dd MMM yyyy")} - ${format(new Date(dateTo), "dd MMM yyyy")}`,
        14,
        22,
      );
      doc.text(
        `Filter: ${search || "-"} | Sort: ${sortBy || "quantity"} | Min Qty: ${minQuantity ?? "-"}`,
        14,
        27,
      );

      autoTable(doc, {
        startY: 33,
        head: [
          [
            "Kode Produk",
            "Kode Variant",
            "Nama Produk",
            "Warna",
            "Size",
            "Harga Satuan",
            "Qty",
            "Revenue",
          ],
        ],
        body:
          detailRows.length > 0
            ? detailRows.map((product: any) => [
                product.code || "-",
                product.variantCode || "-",
                product.name,
                product.color || "-",
                product.size || "-",
                `Rp ${Number(product.priceAtSale || 0).toLocaleString("id-ID")}`,
                product.quantity,
                `Rp ${Number(product.revenue || 0).toLocaleString("id-ID")}`,
              ])
            : [["-", "-", "Tidak ada data", "-", "-", "-", "-", "-"]],
        styles: { fontSize: 8 },
        headStyles: { fillColor: [60, 48, 37] },
      });

      const pdfBuffer = new Uint8Array(doc.output("arraybuffer"));
      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${buildFileName("Laporan_Detail_Penjualan_Fordza", "pdf")}"`,
        },
      });
    }

    const workbook = XLSX.utils.book_new();
    const detailSheet = XLSX.utils.json_to_sheet(
      detailRows.length > 0
        ? detailRows.map((product: any) => ({
            "Kode Produk": product.code || "-",
            "Kode Variant": product.variantCode || "-",
            "Nama Produk": product.name,
            Warna: product.color || "-",
            Ukuran: product.size || "-",
            "Harga Satuan": Number(product.priceAtSale || 0),
            Qty: product.quantity,
            Revenue: Number(product.revenue || 0),
          }))
        : [{ Info: "Tidak ada data" }],
    );

    XLSX.utils.book_append_sheet(workbook, detailSheet, "Detail Produk");

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${buildFileName("Laporan_Detail_Penjualan_Fordza", "xlsx")}"`,
      },
    });
  } catch (error: any) {
    console.error("GET /api/admin/reports/export/items error:", error.message);
    return NextResponse.json(
      { success: false, message: "Gagal mengekspor detail laporan" },
      { status: 500 },
    );
  }
}
