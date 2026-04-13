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

    const rows = products.map((product: any) => ({
      "Kode Produk": product.productCode || "-",
      "Nama Produk": product.name,
      "Stok Sistem": Number(product.stock || 0),
      Kategori:
        (product.categories || [])
          .map((entry: any) => entry.category?.name)
          .filter(Boolean)
          .join(", ") || "-",
      Gender: product.gender || "-",
      Tipe: product.productType || "-",
      Aktif: product.isActive ? "Ya" : "Tidak",
    }));

    if (formatType === "pdf") {
      const doc = new jsPDF({ orientation: "landscape" });
      doc.setFontSize(16);
      doc.text("Laporan Stok Opname Fordza", 14, 16);
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
            "Kode",
            "Nama Produk",
            "Stok Sistem",
            "Kategori",
            "Gender",
            "Tipe",
            "Aktif",
          ],
        ],
        body: rows.map((row) => [
          row["Kode Produk"],
          row["Nama Produk"],
          row["Stok Sistem"],
          row["Kategori"],
          row["Gender"],
          row["Tipe"],
          row["Aktif"],
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [60, 48, 37] },
      });

      const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${buildFileName("Laporan_Stok_Opname_Fordza", "pdf")}"`,
        },
      });
    }

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(
      rows.length > 0 ? rows : [{ Info: "Tidak ada data" }],
    );
    XLSX.utils.book_append_sheet(workbook, worksheet, "Stok Opname");

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
    return new NextResponse(buffer as Buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${buildFileName("Laporan_Stok_Opname_Fordza", "xlsx")}"`,
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
