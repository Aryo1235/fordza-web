import { NextResponse } from "next/server";
import { ProductService } from "@/backend/services/products.service";
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
    const formatType = (searchParams.get("format") || "excel").toLowerCase();

    const products = await ProductService.getAllAdminExport({ search });

    // 1. Logic Excel: Flat Mode (1 SKU = 1 Row)
    const excelRows: any[] = [];
    products.forEach((product: any) => {
      product.variants.forEach((variant: any) => {
        variant.skus.forEach((sku: any) => {
          excelRows.push({
            "Kode Produk": product.productCode || "-",
            "Nama Produk": product.name,
            Warna: variant.color || "-",
            Ukuran: sku.size || "-",
            "Kode SKU": variant.variantCode || "-",
            "Stok Sistem": Number(sku.stock || 0),
            Categories: (product.categories || [])
              .map((c: any) => c.category?.name)
              .join(", ") || "-",
          });
        });
      });
    });

    if (formatType === "pdf") {
      const doc = new jsPDF({ orientation: "landscape" });
      const mainColor: [number, number, number] = [60, 48, 37]; // #3C3025

      doc.setFontSize(22);
      doc.setTextColor(mainColor[0], mainColor[1], mainColor[2]);
      doc.text("LAPORAN STOK OPNAME", 14, 18);
      
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(`Fordza Web Administrative Report - ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 25);
      doc.text(`Filter Pencarian: ${search || "Semua Produk"}`, 14, 30);

      const pdfBody: any[] = [];
      products.forEach((product: any) => {
        // 1. BARIS PRODUK (HEADER UTAMA)
        pdfBody.push([
          {
            content: `PRODUK: ${product.name.toUpperCase()}  |  KODE PRODUK: ${product.productCode || "-"}`,
            colSpan: 3,
            styles: { 
              fillColor: [60, 48, 37], 
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              fontSize: 9,
              halign: 'left',
              cellPadding: 3
            }
          }
        ]);

        product.variants.forEach((variant: any) => {
          // 2. BARIS VARIAN (SUB-HEADER)
          pdfBody.push([
            {
              content: `  WARNA: ${variant.color.toUpperCase()}  |  KODE: ${variant.variantCode || "-"}`,
              colSpan: 3,
              styles: { 
                fillColor: [245, 243, 240], 
                textColor: [80, 70, 60],
                fontStyle: 'bold',
                fontSize: 8.5,
                halign: 'left',
                cellPadding: 2.5
              }
            }
          ]);

          // 3. BARIS-BARIS UKURAN (DETAIL)
          variant.skus.forEach((sku: any, index: number) => {
            pdfBody.push([
              { content: (index + 1).toString(), styles: { halign: 'center', textColor: [150, 150, 150] } },
              { content: `Ukuran ${sku.size}`, styles: { fontStyle: 'bold' } },
              { content: sku.stock.toString(), styles: { halign: 'center', fontStyle: 'bold', fontSize: 10 } }
            ]);
          });
        });
      });

      autoTable(doc, {
        startY: 35,
        head: [
          ["No", "Rincian Ukuran", "Stok Sistem"]
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
          0: { cellWidth: 15 },
          1: { cellWidth: 150 },
          2: { cellWidth: 40, halign: 'center' }
        },
        styles: { 
          fontSize: 8, 
          cellPadding: 2,
          valign: 'middle',
          lineColor: [240, 240, 240],
          lineWidth: 0.1
        },
        margin: { bottom: 40 },
        // Footer & Penomoran Halaman
        didDrawPage: (data) => {
          const str = "Halaman " + (doc as any).internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
        }
      });

      // AREA TANDA TANGAN (Selalu muncul di akhir)
      let finalY = (doc as any).lastAutoTable.finalY + 20;
      const pageHeight = doc.internal.pageSize.height;
      
      // Jika ruang tidak cukup (butuh sekitar 40 unit), tambah halaman baru
      if (finalY + 40 > pageHeight) {
        doc.addPage();
        finalY = 20; // Mulai dari atas di halaman baru
      }

      doc.setFontSize(9);
      doc.setTextColor(mainColor[0], mainColor[1], mainColor[2]);
      const startX = 14;
      const signatureWidth = 60;
      const gap = 30;

      // Tanda Tangan 1
      doc.text("Dibuat Oleh,", startX, finalY);
      doc.line(startX, finalY + 20, startX + signatureWidth, finalY + 20);
      doc.text("( Staff Gudang )", startX, finalY + 25);

      // Tanda Tangan 2
      doc.text("Diperiksa Oleh,", startX + signatureWidth + gap, finalY);
      doc.line(startX + signatureWidth + gap, finalY + 20, startX + signatureWidth * 2 + gap, finalY + 20);
      doc.text("( Admin Gudang )", startX + signatureWidth + gap, finalY + 25);

      // Tanda Tangan 3
      doc.text("Diketahui Oleh,", startX + (signatureWidth + gap) * 2, finalY);
      doc.line(startX + (signatureWidth + gap) * 2, finalY + 20, startX + signatureWidth * 3 + gap * 2, finalY + 20);
      doc.text("( Manager / Owner )", startX + (signatureWidth + gap) * 2, finalY + 25);

      const pdfBytes = new Uint8Array(doc.output("arraybuffer"));
      return new NextResponse(pdfBytes, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${buildFileName("Stok_Opname_Fordza", "pdf")}"`,
        },
      });
    }

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(
      excelRows.length > 0 ? excelRows : [{ Info: "Tidak ada data" }],
    );

    // Styling kolom Excel (Opsional, tapi membuat rapi)
    const wscols = [
      { wch: 15 }, // Kode Produk
      { wch: 40 }, // Nama Produk
      { wch: 15 }, // Warna
      { wch: 10 }, // Ukuran
      { wch: 20 }, // Kode SKU
      { wch: 12 }, // Stok
      { wch: 30 }, // Kategori
    ];
    worksheet["!cols"] = wscols;

    XLSX.utils.book_append_sheet(workbook, worksheet, "Stok Opname Detail");

    const xlxsxBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    });

    return new NextResponse(new Uint8Array(xlxsxBuffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${buildFileName("Stok_Opname_Fordza", "xlsx")}"`,
      },
    });
  } catch (error: any) {
    console.error("GET /api/admin/products/export error:", error.message);
    return NextResponse.json(
      { success: false, message: "Gagal mengekspor stok opname" },
      { status: 500 },
    );
  }
}
