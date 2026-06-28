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
    let dateFrom = searchParams.get("from");
    let dateTo = searchParams.get("to");
    const search = searchParams.get("search") || undefined;
    const sortBy = searchParams.get("sortBy") || undefined;
    const minQuantityRaw = searchParams.get("minQuantity");
    const minQuantity = minQuantityRaw ? Number(minQuantityRaw) : undefined;
    const formatType = (searchParams.get("format") || "excel").toLowerCase();

    if (!dateFrom || !dateTo) {
      const wibNow = new Date(Date.now() + 7 * 60 * 60 * 1000);
      const wib30DaysAgo = new Date(wibNow.getTime() - 30 * 24 * 60 * 60 * 1000);
      if (!dateTo) dateTo = wibNow.toISOString().split("T")[0];
      if (!dateFrom) dateFrom = wib30DaysAgo.toISOString().split("T")[0];
    }

    const report = await ReportService.getSalesReportStats(dateFrom, dateTo, {
      search,
      sortBy: sortBy as any,
      minQuantity,
    });
    const detailRows = report.soldProducts;
    const totalQty = detailRows.reduce((sum, item: any) => sum + Number(item.quantity || 0), 0);
    const totalRevenue = detailRows.reduce((sum, item: any) => sum + Number(item.revenue || 0), 0);
    const totalDiscount = detailRows.reduce((sum, item: any) => sum + Number(item.discount || 0), 0);

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
            "Metode Pembayaran",
            "Harga Satuan",
            "Total Diskon",
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
                product.paymentMethod || "CASH",
                `Rp ${Number(product.basePriceAtSale || 0).toLocaleString("id-ID")}`,
                Number(product.discount || 0) > 0 ? `-Rp ${Number(product.discount).toLocaleString("id-ID")}` : "-",
                product.quantity,
                `Rp ${Number(product.revenue || 0).toLocaleString("id-ID")}`,
              ])
            : [["-", "-", "Tidak ada data", "-", "-", "-", "-", "-", "-", "-"]],
        foot: detailRows.length > 0 ? [
          [
            "TOTAL",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            totalQty.toString(),
            `Rp ${totalRevenue.toLocaleString("id-ID")}`,
          ]
        ] : undefined,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [60, 48, 37] },
        footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
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
    const excelRows = detailRows.length > 0
      ? [
          ...detailRows.map((product: any) => ({
            "Kode Produk": product.code || "-",
            "Kode Variant": product.variantCode || "-",
            "Nama Produk": product.name,
            Warna: product.color || "-",
            Ukuran: product.size || "-",
            "Metode Pembayaran": product.paymentMethod || "CASH",
            "Harga Satuan": Number(product.basePriceAtSale || 0),
            "Total Diskon": Number(product.discount || 0),
            Qty: product.quantity,
            Revenue: Number(product.revenue || 0),
          })),
          {
            "Kode Produk": "TOTAL",
            "Kode Variant": "",
            "Nama Produk": "",
            Warna: "",
            Ukuran: "",
            "Metode Pembayaran": "",
            "Harga Satuan": "",
            "Total Diskon": "",
            Qty: totalQty,
            Revenue: totalRevenue,
          }
        ]
      : [{ Info: "Tidak ada data" }];

    const detailSheet = XLSX.utils.json_to_sheet(excelRows);

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
