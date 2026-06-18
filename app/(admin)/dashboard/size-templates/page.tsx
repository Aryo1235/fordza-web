"use client";

import { useState } from "react";
import { 
  useSizeTemplatesAdmin, 
  useCreateSizeTemplate, 
  useUpdateSizeTemplate, 
  useDeleteSizeTemplate 
} from "@/features/admin/size-templates";
import { DataTable } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/layout/admin/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Loader2, Eye, Ruler } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function SizeTemplatesPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [type, setType] = useState("Sepatu");
  const [isMultiSize, setIsMultiSize] = useState(false);
  const [sizesStr, setSizesStr] = useState("");
  const [measurements, setMeasurements] = useState<Record<string, any>>({});

  const { data, isLoading } = useSizeTemplatesAdmin();
  const createMutation = useCreateSizeTemplate();
  const updateMutation = useUpdateSizeTemplate();
  const deleteMutation = useDeleteSizeTemplate();

  const handleOpenNew = () => {
    setEditingId(null);
    setName("");
    setType("Sepatu");
    setSizesStr("");
    setMeasurements({});
    setIsMultiSize(false);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingId(item.id);
    setName(item.name);
    setType(item.type);
    const isMulti = item.sizes.length > 1 || (item.sizes[0] !== "All Size" && item.sizes[0] !== "one size");
    setIsMultiSize(isMulti);
    if (!isMulti) {
      setSizesStr("");
    } else {
      setSizesStr(item.sizes.join(", "));
    }
    setMeasurements(item.measurements || {});
    setIsFormOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => {
          setDeleteId(null);
          toast.success("Template berhasil dihapus");
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || "Gagal menghapus template");
        }
      });
    }
  };

  const updateMeasurement = (size: string, key: string, value: string) => {
    setMeasurements(prev => ({
      ...prev,
      [size]: {
        ...(prev[size] || {}),
        [key]: value
      }
    }));
  };

  const blockInvalidChar = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["e", "E", "+", "-"].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleSizesStrChange = (val: string) => {
    if (type === "Sepatu") {
      // Allow only numbers, commas, spaces
      const cleanVal = val.replace(/[^0-9,\s]/g, "");
      setSizesStr(cleanVal);
    } else {
      setSizesStr(val.toUpperCase());
    }
  };

  const handleTypeChange = (newType: string) => {
    setType(newType);
    if (newType === "Sepatu") {
      const cleanVal = sizesStr.replace(/[^0-9,\s]/g, "");
      setSizesStr(cleanVal);
    } else {
      setSizesStr(sizesStr.toUpperCase());
    }
  };

  const handleNumericChange = (size: string, key: string, val: string) => {
    // Only allow numbers and a single dot
    const cleanVal = val.replace(/[^0-9.]/g, "");
    const parts = cleanVal.split(".");
    const formatted = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : cleanVal;
    updateMeasurement(size, key, formatted);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error("Nama wajib diisi!");
      return;
    }

    const needsSizesStr = type === "Sepatu" || isMultiSize;
    if (needsSizesStr && !sizesStr) {
      toast.error("Ukuran wajib diisi!");
      return;
    }

    const sizes = needsSizesStr
      ? sizesStr.split(",").map(s => s.trim()).filter(Boolean)
      : ["All Size"];

    if (sizes.length === 0) {
      toast.error("Minimal masukkan 1 ukuran!");
      return;
    }

    const filteredMeasurements: Record<string, any> = {};
    sizes.forEach(size => {
      if (measurements[size]) {
        filteredMeasurements[size] = measurements[size];
      }
    });

    const payload = { name, type, sizes, measurements: filteredMeasurements };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload }, {
        onSuccess: () => {
          setIsFormOpen(false);
          toast.success("Template ukuran berhasil diperbarui!");
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || "Gagal mengupdate template");
        }
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          setIsFormOpen(false);
          toast.success("Template ukuran berhasil dibuat!");
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || "Gagal membuat template");
        }
      });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const columns = [
    {
      header: "Nama Template",
      cell: (item: any) => (
        <div>
          <p className="font-semibold text-[#3C3025]">{item.name}</p>
          <p className="text-xs text-muted-foreground">{item.type}</p>
        </div>
      ),
    },
    {
      header: "Daftar Ukuran",
      cell: (item: any) => (
        <div className="flex flex-wrap gap-1 max-w-md">
          {item.sizes.map((size: string, i: number) => (
            <span key={i} className="inline-flex px-2 py-0.5 rounded text-xs border bg-secondary/30 text-secondary-foreground">
              {size}
            </span>
          ))}
        </div>
      ),
    },
    {
      header: "Dipakai di Produk",
      cell: (item: any) => (
        <span className="text-sm border px-2 py-1 rounded inline-block bg-muted">
          {item.productDetails?.length || 0} produk
        </span>
      ),
    },
    {
      header: "Aksi",
      className: "text-right",
      cell: (item: any) => (
        <div className="flex justify-end gap-2">
          <Link href={`/dashboard/size-templates/${item.id}/detail`}>
            <Button 
              variant="ghost" 
              size="icon" 
              title="Lihat Detail"
              className="hover:text-stone-700 text-stone-500"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            title="Edit"
            onClick={() => handleOpenEdit(item)}
            className="hover:text-blue-600 text-stone-500"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            title="Hapus"
            onClick={() => setDeleteId(item.id)}
            className="hover:text-red-600 text-stone-500"
            disabled={item.productDetails?.length > 0}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const rawTemplates = data?.data || [];
  const totalItems = rawTemplates.length;
  const paginatedTemplates = rawTemplates.slice((page - 1) * limit, page * limit);
  const totalPage = Math.ceil(totalItems / limit) || 1;

  const meta = {
    currentPage: page,
    limit,
    totalItems,
    totalPage,
  };

  return (
    <div className="p-6">
      <PageHeader 
        title="Template Ukuran" 
        description="Kelola daftar pilihan ukuran (size chart) yang dapat dipasang ke produk."
        action={
          <Button onClick={handleOpenNew} className="bg-[#3C3025] hover:bg-[#5a4a38] text-white">
            <Plus className="mr-2 h-4 w-4" /> Buat Template
          </Button>
        }
      />

      <div className="border border-stone-200 rounded-xl shadow-sm overflow-hidden bg-white mb-6">
        <div className="bg-stone-50 border-b border-stone-100 py-3 px-6">
          <p className="text-[10px] font-bold text-stone-500 uppercase tracking-tight flex items-center gap-2">
            <Ruler className="w-3 h-3 text-stone-400" />
            Size Chart Template Management ({totalItems} Templates)
          </p>
        </div>
        <DataTable 
          columns={columns} 
          data={paginatedTemplates} 
          isLoading={isLoading} 
          meta={meta}
          onPageChange={setPage}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
          showNumber={true}
          className="space-y-0 [&_.rounded-md.border]:border-none [&_.rounded-md.border]:shadow-none [&_.rounded-md.border]:rounded-none"
        />
      </div>

      <ConfirmDialog 
        open={!!deleteId}
        onOpenChange={(op) => !op && setDeleteId(null)}
        title="Hapus Template"
        description="Apakah Anda yakin ingin menghapus template ukuran ini? Aksi ini tidak dapat dibatalkan."
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md md:max-w-lg max-h-[90vh] flex flex-col p-6">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Template Ukuran" : "Buat Template Ukuran Baru"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-4 py-4 overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="space-y-1.5">
                <Label>Nama Template</Label>
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Cth: Sepatu Formal Pria" 
                  required 
                />
              </div>
              
              <div className="space-y-1.5">
                <Label>Tipe Template</Label>
                <select
                  value={type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-stone-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stone-400"
                >
                  <option value="Sepatu">Sepatu</option>
                  <option value="Apparel">Apparel (Pakaian)</option>
                  <option value="Aksesoris">Aksesoris / Gelang</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              {type !== "Sepatu" && (
                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id="isMultiSize"
                    checked={isMultiSize}
                    onChange={(e) => {
                      setIsMultiSize(e.target.checked);
                      if (!e.target.checked) {
                        setSizesStr("");
                      }
                    }}
                    className="h-4 w-4 rounded border-stone-300 text-[#3C3025] focus:ring-[#3C3025]"
                  />
                  <Label htmlFor="isMultiSize" className="text-xs text-stone-700 font-semibold cursor-pointer select-none">
                    Mempunyai beberapa variasi ukuran (S, M, L, dll)
                  </Label>
                </div>
              )}

              {(type === "Sepatu" || isMultiSize) && (
                <div className="space-y-1.5">
                  <Label>Daftar Ukuran</Label>
                  <Input 
                    value={sizesStr} 
                    onChange={(e) => handleSizesStrChange(e.target.value)} 
                    placeholder={
                      type === "Sepatu" 
                        ? "Cth: 39, 40, 41, 42, 43" 
                        : type === "Apparel" 
                        ? "Cth: S, M, L, XL atau 28, 30, 32"
                        : type === "Aksesoris"
                        ? "Cth: S, M, L atau 15, 16, 17"
                        : "Cth: S, M, L, XL"
                    } 
                    required 
                  />
                  {type === "Sepatu" ? (
                    <p className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
                      ⚠️ Tipe Sepatu hanya mendukung ukuran berupa angka (huruf otomatis diblokir).
                    </p>
                  ) : (
                    <p className="text-[11px] text-stone-500 font-medium">
                      Pisahkan dengan koma (,). Bisa berupa huruf (S, M, L) maupun angka.
                    </p>
                  )}
                </div>
              )}
            </div>

            {(() => {
              const needsSizesStr = type === "Sepatu" || isMultiSize;
              const activeSizes = needsSizesStr 
                ? sizesStr.split(",").map(s => s.trim()).filter(Boolean)
                : ["All Size"];

              if (activeSizes.length === 0 || (needsSizesStr && sizesStr.trim() === "")) return null;

              return (
                <div className="space-y-3 border-t border-stone-150 pt-4 px-1">
                  <Label className="text-stone-700 font-semibold block mb-1">
                    {needsSizesStr ? "Rincian Ukuran (dalam CM)" : "Spesifikasi Detail Ukuran (Satu Ukuran / All Size)"}
                  </Label>
                  <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1">
                    {activeSizes.map((size) => (
                      <div key={size} className="flex items-center gap-4 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                        <span className="min-w-[40px] font-bold text-center bg-[#FEF4E8] text-[#3C3025] px-2 py-1 rounded border border-[#e8ded3] text-sm">
                          {size}
                        </span>
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          {type === "Sepatu" && (
                            <>
                              <div>
                                <Label className="text-[10px] text-stone-500 uppercase">Panjang Insole (cm)</Label>
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  pattern="[0-9.]*"
                                  onKeyDown={blockInvalidChar}
                                  placeholder="Cth: 25.5"
                                  className="h-8 text-xs bg-white"
                                  value={measurements[size]?.insoleLength || measurements[size]?.insole || ""}
                                  onChange={(e) => handleNumericChange(size, "insoleLength", e.target.value)}
                                />
                              </div>
                              <div>
                                <Label className="text-[10px] text-stone-500 uppercase">Lebar Insole (cm)</Label>
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  pattern="[0-9.]*"
                                  onKeyDown={blockInvalidChar}
                                  placeholder="Cth: 9.0"
                                  className="h-8 text-xs bg-white"
                                  value={measurements[size]?.insoleWidth || ""}
                                  onChange={(e) => handleNumericChange(size, "insoleWidth", e.target.value)}
                                />
                              </div>
                            </>
                          )}
                          {type === "Apparel" && (
                            <>
                              <div>
                                <Label className="text-[10px] text-stone-500 uppercase">Lebar Dada (cm)</Label>
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  pattern="[0-9.]*"
                                  onKeyDown={blockInvalidChar}
                                  placeholder="Cth: 52"
                                  className="h-8 text-xs bg-white"
                                  value={measurements[size]?.ld || ""}
                                  onChange={(e) => handleNumericChange(size, "ld", e.target.value)}
                                />
                              </div>
                              <div>
                                <Label className="text-[10px] text-stone-500 uppercase">Panjang Badan (cm)</Label>
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  pattern="[0-9.]*"
                                  onKeyDown={blockInvalidChar}
                                  placeholder="Cth: 70"
                                  className="h-8 text-xs bg-white"
                                  value={measurements[size]?.pb || ""}
                                  onChange={(e) => handleNumericChange(size, "pb", e.target.value)}
                                />
                              </div>
                            </>
                          )}
                          {type === "Aksesoris" && (
                            <div className="col-span-2 space-y-2">
                              <div className="grid grid-cols-3 gap-1.5">
                                <div>
                                  <Label className="text-[9px] text-stone-500 uppercase">P (cm)</Label>
                                  <Input
                                    type="text"
                                    inputMode="decimal"
                                    pattern="[0-9.]*"
                                    onKeyDown={blockInvalidChar}
                                    placeholder="Panjang"
                                    className="h-8 text-[11px] bg-white px-1.5"
                                    value={measurements[size]?.panjang || ""}
                                    onChange={(e) => handleNumericChange(size, "panjang", e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label className="text-[9px] text-stone-500 uppercase">L (cm)</Label>
                                  <Input
                                    type="text"
                                    inputMode="decimal"
                                    pattern="[0-9.]*"
                                    onKeyDown={blockInvalidChar}
                                    placeholder="Lebar"
                                    className="h-8 text-[11px] bg-white px-1.5"
                                    value={measurements[size]?.lebar || ""}
                                    onChange={(e) => handleNumericChange(size, "lebar", e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label className="text-[9px] text-stone-500 uppercase">T (cm)</Label>
                                  <Input
                                    type="text"
                                    inputMode="decimal"
                                    pattern="[0-9.]*"
                                    onKeyDown={blockInvalidChar}
                                    placeholder="Tinggi"
                                    className="h-8 text-[11px] bg-white px-1.5"
                                    value={measurements[size]?.tinggi || ""}
                                    onChange={(e) => handleNumericChange(size, "tinggi", e.target.value)}
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-[9px] text-stone-500 uppercase">Lingkar (cm)</Label>
                                  <Input
                                    type="text"
                                    inputMode="decimal"
                                    pattern="[0-9.]*"
                                    onKeyDown={blockInvalidChar}
                                    placeholder="Gelang/Cincin"
                                    className="h-8 text-[11px] bg-white"
                                    value={measurements[size]?.lingkar || ""}
                                    onChange={(e) => handleNumericChange(size, "lingkar", e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label className="text-[9px] text-stone-500 uppercase">Detail / Volume</Label>
                                  <Input
                                    placeholder="Cth: 60ml, All Size"
                                    className="h-8 text-[11px] bg-white"
                                    value={measurements[size]?.detail || ""}
                                    onChange={(e) => updateMeasurement(size, "detail", e.target.value)}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                          {type !== "Sepatu" && type !== "Apparel" && type !== "Aksesoris" && (
                            <div className="col-span-2">
                              <Label className="text-[10px] text-stone-500 uppercase">Keterangan Detail (CM / Custom)</Label>
                              <Input
                                placeholder="Cth: Panjang tali 60cm"
                                className="h-8 text-xs bg-white"
                                value={measurements[size]?.detail || ""}
                                onChange={(e) => updateMeasurement(size, "detail", e.target.value)}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <DialogFooter className="pt-4 border-t border-stone-100 flex-shrink-0">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSaving} className="bg-[#3C3025] hover:bg-[#5a4a38] text-white">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
