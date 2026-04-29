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

    // Logic Excel: Standar Flat List
    const excelRows = logs.map((log: any) => ({
      Waktu: format(new Date(log.createdAt), "dd/MM/yyyy HH:mm"),
      "Nama Produk": log.product?.name || "-",
      "Kode Produk": log.product?.productCode || "-",
      Tipe: log.type,
      "Mutasi": log.delta > 0 ? `+${log.delta}` : log.delta.toString(),
      "Stok Akhir": Number(log.currentStock || 0),
      Operator: log.operator?.name || log.operator?.username || "Sistem",
      "Rincian & Catatan": log.notes || "-",
    }));

    if (formatType === "pdf") {
      const doc = new jsPDF({ orientation: "landscape" });
      const mainColor: [number, number, number] = [60, 48, 37]; // #3C3025

      doc.setFontSize(22);
      doc.setTextColor(mainColor[0], mainColor[1], mainColor[2]);
      doc.text("HISTORI PERGERAKAN STOK (UNIVERSAL)", 14, 18);
      
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(`Fordza Web Administrative Report - ${format(new Date(), "dd MMM yyyy, HH:mm")}`, 14, 25);
      doc.text(`Filter: ${search || "Semua"} | Tipe: ${type || "Semua"}`, 14, 30);

      // Grouping Logic for PDF
      const groupedLogs: { [key: string]: { product: any, entries: any[] } } = {};
      logs.forEach((log: any) => {
        const productId = log.productId || "unknown";
        if (!groupedLogs[productId]) {
          groupedLogs[productId] = { product: log.product, entries: [] };
        }
        groupedLogs[productId].entries.push(log);
      });

      const pdfBody: any[] = [];
      Object.values(groupedLogs).forEach((group: any) => {
        // Product Header
        pdfBody.push([
          {
            content: `PRODUK: ${group.product?.name || "TANPA NAMA"}  |  KODE PRODUK: ${group.product?.productCode || "-"}`,
            colSpan: 6,
            styles: { 
              fillColor: mainColor, 
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              fontSize: 9,
              halign: 'left',
              cellPadding: 3
            }
          }
        ]);

        // Log Entries
        group.entries.forEach((log: any, index: number) => {
          pdfBody.push([
            format(new Date(log.createdAt), "dd/MM HH:mm"),
            { content: log.type, styles: { fontStyle: 'bold' } },
            { content: log.delta > 0 ? `+${log.delta}` : log.delta.toString(), styles: { fontStyle: 'bold', textColor: log.delta > 0 ? [0, 150, 0] as [number, number, number] : [200, 0, 0] as [number, number, number] } },
            log.currentStock.toString(),
            log.operator?.name || log.operator?.username || "Sistem",
            log.notes || "-"
          ]);
        });
      });

      autoTable(doc, {
        startY: 35,
        head: [
          ["Waktu", "Tipe", "Delta", "S. Akhir", "Operator", "Rincian & Catatan Mutasi"]
        ],
        body: pdfBody,
        theme: "plain",
        headStyles: { 
          fillColor: [255, 255, 255],
          textColor: [120, 120, 120],
          fontSize: 8,
          fontStyle: "bold",
          halign: 'center',
          lineColor: [220, 220, 220],
          lineWidth: 0.1
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 25 },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 20, halign: 'center' },
          4: { cellWidth: 35 },
          5: { cellWidth: 'auto' }
        },
        styles: { fontSize: 8, cellPadding: 2, valign: 'middle', lineColor: [240, 240, 240], lineWidth: 0.1 },
        margin: { bottom: 35 },
        didDrawPage: (data) => {
          const str = "Halaman " + (doc as any).internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
        }
      });

      // Signature Area (Selalu muncul di akhir)
      let finalY = (doc as any).lastAutoTable.finalY + 15;
      const pageHeight = doc.internal.pageSize.height;

      if (finalY + 40 > pageHeight) {
        doc.addPage();
        finalY = 20;
      }

      doc.setFontSize(9);
      doc.setTextColor(mainColor[0], mainColor[1], mainColor[2]);
      const startX = 14;
      const sigW = 60;
      const gap = 30;

      doc.text("Dicek Oleh,", startX, finalY);
      doc.line(startX, finalY + 20, startX + sigW, finalY + 20);
      doc.text("( Admin Gudang )", startX, finalY + 25);

      doc.text("Disetujui Oleh,", startX + sigW + gap, finalY);
      doc.line(startX + sigW + gap, finalY + 20, startX + sigW * 2 + gap, finalY + 20);
      doc.text("( Manager / Owner )", startX + sigW + gap, finalY + 25);

      const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${buildFileName("Histori_Stok_Universal_Fordza", "pdf")}"`,
        },
      });
    }

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(
      excelRows.length > 0 ? excelRows : [{ Info: "Tidak ada data" }],
    );
    XLSX.utils.book_append_sheet(workbook, worksheet, "Histori Stok");

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${buildFileName("Histori_Stok_Universal_Fordza", "xlsx")}"`,
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
