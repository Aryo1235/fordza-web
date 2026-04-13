import { NextResponse } from "next/server";
import { StockRepository } from "@/backend/repositories/stock.repo";
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
    const search = searchParams.get("search") || undefined;
    const type = searchParams.get("type") || undefined;
    const formatType = (searchParams.get("format") || "excel").toLowerCase();

    const logs = await StockRepository.getLogsExport({ search, type });

    const rows = logs.map((log: any) => ({
      Waktu: format(new Date(log.createdAt), "dd/MM/yyyy HH:mm"),
      Produk: log.product?.name || "-",
      "Kode Produk": log.product?.productCode || "-",
      Tipe: log.type,
      Perubahan: Number(log.delta || 0),
      "Stok Akhir": Number(log.currentStock || 0),
      Operator: log.operator?.name || log.operator?.username || "Sistem",
      Catatan: log.notes || "-",
    }));

    if (formatType === "pdf") {
      const doc = new jsPDF({ orientation: "landscape" });
      doc.setFontSize(16);
      doc.text("Histori Pergerakan Stok Fordza", 14, 16);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(
        `Dicetak pada: ${format(new Date(), "dd MMM yyyy, HH:mm")}`,
        14,
        22,
      );

      autoTable(doc, {
        startY: 28,
        head: [
          [
            "Waktu",
            "Produk",
            "Kode",
            "Tipe",
            "Perubahan",
            "Stok Akhir",
            "Operator",
            "Catatan",
          ],
        ],
        body: rows.map((row) => [
          row.Waktu,
          row.Produk,
          row["Kode Produk"],
          row.Tipe,
          row.Perubahan,
          row["Stok Akhir"],
          row.Operator,
          row.Catatan,
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [60, 48, 37] },
      });

      const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${buildFileName("Laporan_Histori_Stok_Fordza", "pdf")}"`,
        },
      });
    }

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(
      rows.length > 0 ? rows : [{ Info: "Tidak ada data" }],
    );
    XLSX.utils.book_append_sheet(workbook, worksheet, "Histori Stok");

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
    return new NextResponse(buffer as Buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${buildFileName("Laporan_Histori_Stok_Fordza", "xlsx")}"`,
      },
    });
  } catch (error: any) {
    console.error("GET /api/admin/stock/logs/export error:", error.message);
    return NextResponse.json(
      { success: false, message: "Gagal mengekspor histori stok" },
      { status: 500 },
    );
  }
}
