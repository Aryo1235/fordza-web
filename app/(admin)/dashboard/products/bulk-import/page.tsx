"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Settings2, Upload, FileDown, CheckCircle2, AlertCircle, ArrowRight, Table as TableIcon } from "lucide-react";
import { parseProductCsv, type BulkProduct } from "@/features/products/utils/csv-parser";
import { useBulkImportProducts } from "@/features/products";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import * as XLSX from "xlsx";
import { useCategoriesForPromo } from "@/features/categories";
import { useSizeTemplatesAdmin } from "@/features/admin/size-templates";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function BulkImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<BulkProduct[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [importErrors, setImportErrors] = useState<Record<string, string>>({}); // productCode -> error message
  const importMutation = useBulkImportProducts();

  const { data: categoriesData } = useCategoriesForPromo();
  const { data: templatesData } = useSizeTemplatesAdmin();

  const categories = useMemo(() => categoriesData?.data || [], [categoriesData]);
  const templates = useMemo(() => templatesData?.data || [], [templatesData]);

  // Otomatis memetakan nama kategori & nama size template ke ID database agar terbaca di UI Select
  const resolvedPreviewData = useMemo(() => {
    return previewData.map((p) => {
      const resolvedCategoryIds = p.categoryIds.map((catInput) => {
        const matched = categories.find(
          (c: any) => c.id === catInput || c.name.toLowerCase() === catInput.toLowerCase()
        );
        return matched ? matched.id : catInput;
      });

      let resolvedTemplateId = p.sizeTemplateId;
      if (resolvedTemplateId) {
        const matched = templates.find(
          (t: any) => t.id === resolvedTemplateId || t.name.toLowerCase() === resolvedTemplateId.toLowerCase()
        );
        if (matched) resolvedTemplateId = matched.id;
      }

      return {
        ...p,
        categoryIds: resolvedCategoryIds,
        sizeTemplateId: resolvedTemplateId,
      };
    });
  }, [previewData, categories, templates]);


  const processFile = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith(".csv") && !selectedFile.name.endsWith(".xlsx") && !selectedFile.name.endsWith(".xls")) {
      toast.error("Mohon unggah file format .csv atau .xlsx");
      return;
    }

    setFile(selectedFile);
    setIsParsing(true);
    setImportErrors({}); // Reset errors
    try {
      const data = await parseProductCsv(selectedFile);
      setPreviewData(data);
      toast.success(`${data.length} produk terdeteksi.`);
    } catch (err) {
      toast.error("Gagal membaca file");
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processFile(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) processFile(droppedFile);
  };

  const handleUpdateRow = (index: number, field: string, value: any) => {
    const newData = [...previewData];
    (newData[index] as any)[field] = value;
    setPreviewData(newData);
  };

  const formatErrorMessage = (msg: string) => {
    if (msg.includes("Unique constraint failed") && msg.includes("product_code")) {
      return "Kode Produk ini sudah ada di database (Duplicate)";
    }
    if (msg.includes("categoryIds") || msg.includes("category")) {
      return "ID/Nama Kategori tidak ditemukan di sistem";
    }
    if (msg.includes("sizeTemplateId")) {
      return "Size Template tidak ditemukan";
    }
    return msg;
  };

  const handleImport = () => {
    if (resolvedPreviewData.length === 0) return;

    importMutation.mutate(resolvedPreviewData, {
      onSuccess: (res) => {
        const results = res.data;
        if (results.failed > 0) {
          toast.warning(`Berhasil: ${results.success}, Gagal: ${results.failed}.`);
          
          // Map errors ke state agar muncul di tabel
          const errorMap: Record<string, string> = {};
          results.errors.forEach((err: any) => {
            errorMap[err.productCode] = formatErrorMessage(err.message);
          });
          setImportErrors(errorMap);
        } else {
          toast.success(`Berhasil mengimport ${results.success} produk!`);
          router.push("/dashboard/products");
        }
      },
      onError: (err: any) => {
        toast.error(err.message || "Gagal melakukan import");
      }
    });
  };

  const downloadTemplate = () => {
    const headers = [
      "productCode", "name", "shortDescription", "productType", "gender",
      "categoryIds", "sizeTemplateId", "material", "outsole", "insole", "closureType",
      "origin", "notes", "variantColor", "variantCode", "basePrice",
      "comparisonPrice", "oversizePrice", "oversizeSizes", "sizes", "stocks",
      "isPopular", "isBestseller", "isNew"
    ];

    const data = [
      {
        productCode: "FDZ-URBAN-01",
        name: "Fordza Urban Sneakers",
        shortDescription: "Sneakers urban premium",
        productType: "shoes",
        gender: "Man",
        categoryIds: categories[0]?.name || "Sneakers",
        sizeTemplateId: templates[0]?.name || "Sepatu Pria (EU)",
        material: "Genuine Leather",
        outsole: "Rubber TPR",
        insole: "Memory Foam",
        closureType: "Laces",
        origin: "Indonesia",
        notes: "Tips: Bersihkan dengan lap lembab",
        variantColor: "Full Black",
        variantCode: "URB-BLK",
        basePrice: 350000,
        comparisonPrice: 450000,
        oversizePrice: 375000,
        oversizeSizes: "44,45",
        sizes: "39,40,41,42,43,44,45",
        stocks: "10,15,20,10,10,5,5",
        isPopular: true,
        isBestseller: false,
        isNew: true
      }
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template Produk");
    worksheet["!cols"] = headers.map(h => ({ wch: h.length + 12 }));

    const refData: any[] = [];
    const maxLen = Math.max(categories.length, templates.length);
    for (let i = 0; i < maxLen; i++) {
      refData.push({
        "NAMA KATEGORI": categories[i]?.name || "",
        "ID KATEGORI": categories[i]?.id || "",
        " ": "",
        "NAMA SIZE TEMPLATE": templates[i]?.name || "",
        "ID SIZE TEMPLATE": templates[i]?.id || ""
      });
    }
    const refSheet = XLSX.utils.json_to_sheet(refData);
    XLSX.utils.book_append_sheet(workbook, refSheet, "DAFTAR REFERENSI");
    refSheet["!cols"] = [{ wch: 25 }, { wch: 20 }, { wch: 5 }, { wch: 25 }, { wch: 20 }];

    XLSX.writeFile(workbook, "template_fordza_bulk.xlsx");
    toast.info("Template Excel Dinamis diunduh.");
  };

  return (
    <div className="p-6 mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-stone-50 rounded-xl flex items-center justify-center border border-stone-100">
            <TableIcon className="w-6 h-6 text-stone-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-800 tracking-tight">Bulk Import System</h1>
            <p className="text-xs text-stone-500">Impor data produk massal dengan validasi cerdas.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={downloadTemplate} className="h-10 border-stone-200 text-xs font-bold">
            <FileDown className="w-3.5 h-3.5 mr-2" /> Template Excel
          </Button>
          <div 
            className={`relative group transition-all duration-300 ${isDragging ? "scale-105" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
            <Button className={`h-10 px-6 text-xs font-bold transition-colors ${isDragging ? "bg-emerald-600 shadow-lg shadow-emerald-100" : "bg-[#3C3025] hover:bg-black text-white"}`}>
              <Upload className={`w-3.5 h-3.5 mr-2 ${isDragging ? "animate-bounce" : ""}`} /> {file ? "Ganti File" : "Pilih File"}
            </Button>
          </div>
        </div>
      </div>

      {resolvedPreviewData.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-stone-100 shadow-sm">
            <div className="flex items-center gap-8">
              <div className="flex flex-col">
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Status Data</span>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-bold text-stone-700">{resolvedPreviewData.length} Produk Terdeteksi</span>
                </div>
              </div>
              <div className="w-px h-8 bg-stone-100" />
              <p className="text-[10px] text-stone-400 max-w-[300px] leading-relaxed">
                Silakan periksa kembali data di bawah. Klik kolom yang berwarna <span className="text-red-500 font-bold">Merah</span> untuk memilih kategori/template yang benar.
              </p>
            </div>
            <Button
              onClick={handleImport}
              disabled={importMutation.isPending}
              className="bg-[#3C3025] hover:bg-black text-white font-bold h-10 px-8 rounded-lg shadow-lg shadow-stone-200 transition-all active:scale-95"
            >
              {importMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
              Proses Ke Database
            </Button>
          </div>

          <div className="bg-white rounded-2xl border border-stone-100 shadow-xl overflow-hidden">
            <ScrollArea className="w-full">
              <div className="p-0">
                <table className="w-full text-left border-collapse min-w-[1800px]">
                  <thead className="bg-stone-50/50">
                    <tr>
                      <th className="p-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest sticky left-0 bg-stone-50 z-20">Kode & Nama</th>
                      <th className="p-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Kategori</th>
                      <th className="p-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Template Size</th>
                      <th className="p-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Harga Jual</th>
                      <th className="p-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Harga Coret</th>
                      <th className="p-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Oversize</th>
                      <th className="p-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Material</th>
                      <th className="p-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Outsole</th>
                      <th className="p-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Insole</th>
                      <th className="p-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Gender</th>
                      <th className="p-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Varian</th>
                      <th className="p-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Stok</th>
                      <th className="p-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest sticky right-0 bg-stone-50 z-20 border-l border-stone-100">Status / Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resolvedPreviewData.map((p, idx) => {
                      const isCatValid = categories.some((c: any) => c.id === p.categoryIds[0] || c.name === p.categoryIds[0]);
                      const isTplValid = templates.some((t: any) => t.id === p.sizeTemplateId || t.name === p.sizeTemplateId);
                      const error = importErrors[p.productCode];

                      return (
                        <tr key={idx} className={`border-t border-stone-50 hover:bg-stone-50/30 transition-colors ${error ? "bg-red-50/50" : ""}`}>
                          <td className={`p-4 sticky left-0 z-10 border-r border-stone-50 ${error ? "bg-red-50" : "bg-white"}`}>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-mono text-stone-400">{p.productCode}</span>
                              <span className="text-sm font-bold text-stone-800">{p.name}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="w-[180px]">
                              <Select
                                value={p.categoryIds[0] || ""}
                                onValueChange={(val) => handleUpdateRow(idx, "categoryIds", [val])}
                              >
                                <SelectTrigger className={`h-8 text-[11px] ${!isCatValid ? "border-red-300 bg-red-50 text-red-600 font-bold" : "border-stone-100"}`}>
                                  <SelectValue placeholder="Pilih Kategori..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((c: any) => (
                                    <SelectItem key={c.id} value={c.id} className="text-[11px]">{c.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="w-[180px]">
                              <Select
                                value={p.sizeTemplateId || ""}
                                onValueChange={(val) => handleUpdateRow(idx, "sizeTemplateId", val)}
                              >
                                <SelectTrigger className={`h-8 text-[11px] ${!isTplValid ? "border-red-300 bg-red-50 text-red-600 font-bold" : "border-stone-100"}`}>
                                  <SelectValue placeholder="Pilih Template..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {templates.map((t: any) => (
                                    <SelectItem key={t.id} value={t.id} className="text-[11px]">{t.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </td>
                          <td className="p-4 text-sm font-bold text-stone-700">
                             Rp {Number(p.variants[0]?.basePrice).toLocaleString()}
                          </td>
                          <td className="p-4 text-xs text-stone-400 line-through">
                             Rp {Number(p.variants[0]?.comparisonPrice || 0).toLocaleString()}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-amber-600">Rp {Number(p.variants[0]?.skus.find(s => s.priceOverride)?.priceOverride || 0).toLocaleString()}</span>
                              <span className="text-[9px] text-stone-400">Size: {p.variants[0]?.skus.filter(s => s.priceOverride).map(s => s.size).join(", ")}</span>
                            </div>
                          </td>
                          <td className="p-4 text-xs text-stone-600">{p.material}</td>
                          <td className="p-4 text-xs text-stone-600">{p.outsole}</td>
                          <td className="p-4 text-xs text-stone-600">{p.insole}</td>
                          <td className="p-4">
                            <Badge variant="outline" className="text-[10px] uppercase font-bold">{p.gender}</Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {p.variants.map((v, vIdx) => (
                                <Badge key={vIdx} className="bg-[#3C3025] text-white text-[9px] px-1.5 h-4">{v.color}</Badge>
                              ))}
                            </div>
                          </td>
                          <td className="p-4 text-sm font-black text-stone-800">
                             {p.variants.reduce((acc, v) => acc + v.skus.reduce((skAcc, s) => skAcc + s.stock, 0), 0)}
                          </td>
                          <td className={`p-4 sticky right-0 z-10 border-l border-stone-50 ${error ? "bg-red-50" : "bg-white"}`}>
                             {error ? (
                               <div className="flex items-center gap-2 text-red-600">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  <span className="text-[11px] font-bold">{error}</span>
                               </div>
                             ) : (
                               <div className="flex items-center gap-2 text-emerald-600">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span className="text-[11px] font-medium">Ready</span>
                               </div>
                             )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-[10px] text-amber-800 leading-relaxed">
              <strong>Penting:</strong> Produk yang di-import akan otomatis dalam status <strong>Draft (Tidak Aktif)</strong>.
              Pastikan Anda mengunggah gambar dan memeriksa detail akhir sebelum mempublikasikannya ke katalog publik.
            </p>
          </div>
        </div>
      )}

      {resolvedPreviewData.length === 0 && !isParsing && (
        <div 
          className={`bg-white border-2 border-dashed rounded-3xl py-32 flex flex-col items-center justify-center text-center shadow-sm transition-all duration-300 ${isDragging ? "border-emerald-500 bg-emerald-50/30 scale-[1.01]" : "border-stone-100"}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-8 border transition-all duration-500 ${isDragging ? "bg-emerald-100 border-emerald-200 scale-110" : "bg-stone-50 border-stone-100"}`}>
            <Upload className={`w-10 h-10 transition-colors ${isDragging ? "text-emerald-600 animate-bounce" : "text-stone-200"}`} />
          </div>
          <h3 className={`text-2xl font-bold mb-3 transition-colors ${isDragging ? "text-emerald-700" : "text-stone-800"}`}>
            {isDragging ? "Lepaskan File Sekarang" : "Bulk Upload Produk"}
          </h3>
          <p className="text-stone-400 max-w-sm mb-10 text-sm leading-relaxed">
            Seret & letakkan file Excel/CSV ke sini atau klik tombol di bawah untuk memilih file.
          </p>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={downloadTemplate} className="h-12 px-8 rounded-xl border-stone-200">
              Unduh Template Excel
            </Button>
            <div className="relative">
              <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
              <Button className="h-12 px-10 rounded-xl bg-[#3C3025] hover:bg-black text-white">
                Pilih File Manual
              </Button>
            </div>
          </div>
        </div>
      )}

      {isParsing && (
        <div className="h-[500px] flex flex-col items-center justify-center space-y-6">
          <div className="relative">
            <Loader2 className="w-16 h-16 animate-spin text-[#3C3025]" />
            <Settings2 className="w-6 h-6 text-stone-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" />
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-stone-800">Menganalisis Berkas...</p>
            <p className="text-sm text-stone-400">Kami sedang memetakan data Excel Anda ke struktur produk Fordza.</p>
          </div>
        </div>
      )}
    </div>
  );
}
