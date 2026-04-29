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

    const logs = await StockRepository.getSkuLogsExport({ search, type });

    // Logic Excel: Detail SKU Flat List
    const excelRows = logs.map((log: any) => ({
      Waktu: format(new Date(log.createdAt), "dd/MM/yyyy HH:mm"),
      "Nama Produk": log.sku?.variant?.product?.name || "Produk Terhapus",
      "Kode Produk": log.sku?.variant?.product?.productCode || "-",
      Warna: log.color || log.sku?.variant?.color || "-",
      Ukuran: log.size || log.sku?.size || "-",
      "Kode SKU": log.sku?.variant?.variantCode || "-",
      Tipe: log.type,
      "Perubahan Stok": Number(log.delta || 0),
      "Stok Akhir": Number(log.currentStock || 0),
      Operator: log.operator?.name || log.operator?.username || "Sistem",
      Catatan: log.notes || "-",
    }));

    if (formatType === "pdf") {
      const doc = new jsPDF({ orientation: "landscape" });
      const mainColor: [number, number, number] = [60, 48, 37]; // #3C3025

      doc.setFontSize(22);
      doc.setTextColor(mainColor[0], mainColor[1], mainColor[2]);
      doc.text("LAPORAN HISTORI STOK DETAIL", 14, 18);
      
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(`Fordza Web SKU Level Tracking - ${format(new Date(), "dd MMM yyyy, HH:mm")}`, 14, 25);
      doc.text(`Filter: ${search || "Semua"} | Tipe: ${type || "Semua"}`, 14, 30);

      // Advanced Nested Grouping: Product -> Variant -> Logs
      const groupedData: any = {};
      logs.forEach((log: any) => {
        const prodId = log.sku?.variant?.productId || "unknown";
        const varId = log.sku?.variantId || "unknown";
        
        if (!groupedData[prodId]) {
          groupedData[prodId] = { 
            name: log.sku?.variant?.product?.name || "Produk Terhapus",
            code: log.sku?.variant?.product?.productCode || "-",
            variants: {} 
          };
        }
        
        if (!groupedData[prodId].variants[varId]) {
          groupedData[prodId].variants[varId] = {
            color: log.color || log.sku?.variant?.color || "-",
            vCode: log.sku?.variant?.variantCode || "-",
            entries: []
          };
        }
        
        groupedData[prodId].variants[varId].entries.push(log);
      });

      const pdfBody: any[] = [];
      Object.keys(groupedData).forEach(pId => {
        const pGroup = groupedData[pId];
        
        // 1. PRODUCT HEADER
        pdfBody.push([{
          content: `PRODUK: ${pGroup.name.toUpperCase()}  |  KODE PRODUK: ${pGroup.code}`,
          colSpan: 7,
          styles: { fillColor: mainColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9, halign: 'left', cellPadding: 3 }
        }]);

        Object.keys(pGroup.variants).forEach(vId => {
          const vGroup = pGroup.variants[vId];
          
          // 2. VARIANT SUB-HEADER
          pdfBody.push([{
            content: `  WARNA: ${vGroup.color.toUpperCase()}  |  KODE SKU: ${vGroup.vCode}`,
            colSpan: 7,
            styles: { fillColor: [245, 243, 240], textColor: [80, 70, 60], fontStyle: 'bold', fontSize: 8.5, halign: 'left', cellPadding: 2.5 }
          }]);

          // 3. LOG ENTRIES
          vGroup.entries.forEach((log: any) => {
            pdfBody.push([
              format(new Date(log.createdAt), "dd/MM HH:mm"),
              { content: `Sz ${log.size || log.sku?.size}`, styles: { fontStyle: 'bold' } },
              { content: log.type, styles: { fontStyle: 'bold' } },
              { content: log.delta > 0 ? `+${log.delta}` : log.delta.toString(), styles: { fontStyle: 'bold', textColor: log.delta > 0 ? [0, 150, 0] as [number, number, number] : [200, 0, 0] as [number, number, number] } },
              log.currentStock.toString(),
              log.operator?.name || log.operator?.username || "Sistem",
              log.notes || "-"
            ]);
          });
        });
      });

      autoTable(doc, {
        startY: 35,
        head: [
          ["Waktu", "Size", "Tipe", "Delta", "S. Akhir", "Operator", "Catatan"]
        ],
        body: pdfBody,
        theme: "plain",
        headStyles: { 
          fillColor: [255, 255, 255], textColor: [120, 120, 120], fontSize: 8, fontStyle: "bold", halign: 'center', lineColor: [220, 220, 220], lineWidth: 0.1 
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 15, halign: 'center' },
          2: { cellWidth: 20 },
          3: { cellWidth: 15, halign: 'center' },
          4: { cellWidth: 18, halign: 'center' },
          5: { cellWidth: 30 },
          6: { cellWidth: 'auto' }
        },
        styles: { fontSize: 8, cellPadding: 2, valign: 'middle', lineColor: [240, 240, 240], lineWidth: 0.1 },
        margin: { bottom: 35 },
        didDrawPage: (data) => {
          const str = "Halaman " + (doc as any).internal.getNumberOfPages();
          doc.setFontSize(8); doc.setTextColor(150, 150, 150);
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
          "Content-Disposition": `attachment; filename="${buildFileName("Histori_Stok_Detail_Fordza", "pdf")}"`,
        },
      });
    }

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(
      excelRows.length > 0 ? excelRows : [{ Info: "Tidak ada data" }],
    );
    XLSX.utils.book_append_sheet(workbook, worksheet, "Histori SKU");

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${buildFileName("Histori_Stok_Detail_Fordza", "xlsx")}"`,
      },
    });
  } catch (error: any) {
    console.error("GET /api/admin/stock/logs/sku/export error:", error.message);
    return NextResponse.json(
      { success: false, message: "Gagal mengekspor histori stok SKU" },
      { status: 500 },
    );
  }
}
