"use client";

import { useState } from "react";
import { Plus, Search, Pencil, Trash2, Calendar, Target, Tag, Percent, Banknote, ShoppingBag, FolderOpen, Globe, Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

// ✅ Pakem Fordza: Import dari Feature Hooks
import { 
  usePromosAdmin, 
  useCreatePromo, 
  useUpdatePromo, 
  useDeletePromo,
  PromoTarget,
  PromoType
} from "@/features/promo";
import { useAllCategoriesAdmin } from "@/features/categories";
import { useProductsAdmin } from "@/features/products";
import { useVariantsAdminSearch } from "@/features/variants";
import { MultiSelectComboBox } from "@/components/shared/MultiSelectComboBox";
import { DatePicker } from "@/components/ui/date-picker";

export default function PromoPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [variantSearch, setVariantSearch] = useState("");

  // ✅ Hooks Pattern
  const { data: promos = [], isLoading } = usePromosAdmin();
  const { data: productData, isLoading: isProductsLoading } = useProductsAdmin({ 
    search: productSearch, 
    limit: 50
  });
  const { data: variantData, isLoading: isVariantsLoading } = useVariantsAdminSearch(variantSearch);
  const { data: categoryData, isLoading: isCategoriesLoading } = useAllCategoriesAdmin();
  
  const createMutation = useCreatePromo();
  const updateMutation = useUpdatePromo();
  const deleteMutation = useDeletePromo();

  const products = productData?.data || [];
  const categories = categoryData?.data || [];

  // Form State
  const [selectedPromo, setSelectedPromo] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "PERCENTAGE" as PromoType,
    value: "",
    targetType: "GLOBAL" as PromoTarget,
    targetIds: [] as string[],
    startDate: null as Date | null,
    endDate: null as Date | null,
    isActive: true,
    minPurchase: ""
  });

  const handleOpenAdd = () => {
    setSelectedPromo(null);
    setFormData({
      name: "",
      description: "",
      type: "PERCENTAGE",
      value: "",
      targetType: "GLOBAL",
      targetIds: [],
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: true,
      minPurchase: "0"
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (promo: any) => {
    setSelectedPromo(promo);
    setFormData({
      name: promo.name,
      description: promo.description || "",
      type: promo.type,
      value: promo.value.toString(),
      targetType: promo.targetType,
      targetIds: promo.targetIds,
      startDate: new Date(promo.startDate),
      endDate: new Date(promo.endDate),
      isActive: promo.isActive,
      minPurchase: promo.minPurchase?.toString() || "0"
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Validasi Required
    if (!formData.name.trim()) return toast.error("Nama promo wajib diisi");
    if (!formData.value || parseFloat(formData.value) <= 0) return toast.error("Nilai promo harus valid");
    if (!formData.startDate) return toast.error("Tanggal mulai wajib diisi");
    if (!formData.endDate) return toast.error("Tanggal berakhir wajib diisi");

    // ✅ Validasi Logika Tanggal
    if (formData.startDate > formData.endDate) {
      return toast.error("Tanggal mulai tidak boleh lebih lama dari tanggal berakhir");
    }

    const payload = {
      ...formData,
      value: parseFloat(formData.value),
      minPurchase: parseFloat(formData.minPurchase || "0"),
      startDate: formData.startDate.toISOString(),
      endDate: formData.endDate.toISOString(),
    };

    if (selectedPromo) {
      updateMutation.mutate({ id: selectedPromo.id, data: payload }, {
        onSuccess: () => {
          toast.success("Promo diperbarui");
          setIsDialogOpen(false);
        },
        onError: (err: any) => toast.error(err.response?.data?.message || err.message)
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Promo berhasil dibuat");
          setIsDialogOpen(false);
        },
        onError: (err: any) => toast.error(err.response?.data?.message || err.message)
      });
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Hapus promo ini?")) return;
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Promo dihapus"),
      onError: (err: any) => toast.error(err.response?.data?.message || err.message)
    });
  };

  const toggleTargetId = (id: string) => {
    setFormData(prev => ({
      ...prev,
      targetIds: prev.targetIds.includes(id)
        ? prev.targetIds.filter(i => i !== id)
        : [...prev.targetIds, id]
    }));
  };

  const getStatusBadge = (promo: any) => {
    const now = new Date();
    const start = new Date(promo.startDate);
    const end = new Date(promo.endDate);

    if (!promo.isActive) return <Badge variant="secondary" className="bg-gray-200 text-gray-700">Nonaktif</Badge>;
    if (now < start) return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Mendatang</Badge>;
    if (now > end) return <Badge variant="destructive">Berakhir</Badge>;
    return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Berjalan</Badge>;
  };

  const filteredPromos = Array.isArray(promos) 
    ? promos.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : [];

  const isSubmitLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 space-y-6 bg-[#FEF4E8] min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#3C3025]">Manajemen Promo</h1>
          <p className="text-muted-foreground mt-1">Kelola diskon otomatis Fordza secara terpusat.</p>
        </div>
        <Button 
          onClick={handleOpenAdd}
          className="bg-[#3C3025] hover:bg-[#524336] text-white rounded-xl h-11 px-6 transition-all"
        >
          <Plus className="mr-2 h-4 w-4" /> Tambah Promo Baru
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden group">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center transition-transform group-hover:scale-110">
              <Tag className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Promo</p>
              <p className="text-2xl font-bold text-[#3C3025]">{filteredPromos.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden group">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center transition-transform group-hover:scale-110">
              <Percent className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Promo Aktif</p>
              <p className="text-2xl font-bold text-[#3C3025]">
                {filteredPromos.filter(p => {
                  const now = new Date();
                  return p.isActive && now >= new Date(p.startDate) && now <= new Date(p.endDate);
                }).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden group">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center transition-transform group-hover:scale-110">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Target Spesifik</p>
              <p className="text-2xl font-bold text-[#3C3025]">
                {filteredPromos.filter(p => p.targetType !== "GLOBAL").length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
        <CardHeader className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-xl font-bold text-[#3C3025]">Daftar Aturan Promo</CardTitle>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Cari nama promo..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-[#FEF4E8]/50 border-none focus-visible:ring-1 focus-visible:ring-orange-200 rounded-xl"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#FEF4E8]/30">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="py-4 px-6 font-semibold">Nama Promo</TableHead>
                <TableHead className="py-4 font-semibold">Jenis & Nilai</TableHead>
                <TableHead className="py-4 font-semibold">Target</TableHead>
                <TableHead className="py-4 font-semibold text-center">Status</TableHead>
                <TableHead className="py-4 font-semibold">Periode</TableHead>
                <TableHead className="py-4 px-6 text-right font-semibold">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-orange-500" />
                  </TableCell>
                </TableRow>
              ) : filteredPromos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    Tidak ada data promo.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPromos.map((promo) => (
                  <TableRow key={promo.id} className="hover:bg-[#FEF4E8]/10 border-gray-50 transition-colors">
                    <TableCell className="py-4 px-6 font-medium text-[#3C3025] truncate max-w-[200px]" title={promo.name}>
                      {promo.name}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        {promo.type === "PERCENTAGE" ? (
                          <div className="flex items-center text-orange-600 font-bold">
                            <Percent className="h-4 w-4 mr-1" /> {promo.value}%
                          </div>
                        ) : (
                          <div className="flex items-center text-blue-600 font-bold">
                            <Banknote className="h-4 w-4 mr-1" /> Rp {promo.value?.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        {promo.targetType === "GLOBAL" && <Globe className="h-4 w-4 text-purple-500" />}
                        {promo.targetType === "CATEGORY" && <FolderOpen className="h-4 w-4 text-orange-400" />}
                        {promo.targetType === "PRODUCT" && <ShoppingBag className="h-4 w-4 text-blue-400" />}
                        {promo.targetType === "VARIANT" && <Target className="h-4 w-4 text-red-400" />}
                        <span className="capitalize text-sm font-medium">{promo.targetType.toLowerCase()}</span>
                        {promo.targetIds?.length > 0 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">+{promo.targetIds.length}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      {getStatusBadge(promo)}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="text-[11px] leading-tight space-y-0.5">
                        <div className="flex items-center text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" /> {format(new Date(promo.startDate), "dd MMM yyyy", { locale: localeId })}
                        </div>
                        <div className="flex items-center text-[#c4a882] font-semibold">
                          sampai {format(new Date(promo.endDate), "dd MMM yyyy", { locale: localeId })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleOpenEdit(promo)}
                          className="h-8 w-8 hover:bg-orange-50 hover:text-orange-600 rounded-lg"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          disabled={deleteMutation.isPending}
                          onClick={() => handleDelete(promo.id)}
                          className="h-8 w-8 hover:bg-red-50 hover:text-red-600 rounded-lg"
                        >
                          {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl bg-white border-none shadow-2xl rounded-3xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-[#3C3025]">
                {selectedPromo ? "Edit Promo" : "Buat Promo Baru"}
              </DialogTitle>
              <DialogDescription>
                Tentukan aturan diskon otomatis untuk meningkatkan penjualan.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 max-h-[60vh] overflow-y-auto px-1">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Nama Promo</label>
                  <Input 
                    required
                    placeholder="Contoh: Promo Lebaran 2026" 
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Deskripsi (Catatan Internal)</label>
                  <Textarea 
                    placeholder="Contoh: Promo hari raya, persetujuan manager..." 
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="h-20 resize-none rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Jenis</label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(val: any) => setFormData(prev => ({ ...prev, type: val }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">Persentase (%)</SelectItem>
                        <SelectItem value="NOMINAL">Nominal (Rp)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Nilai</label>
                    <Input 
                      required
                      type="number"
                      placeholder="Nilai diskon..." 
                      value={formData.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2 text-blue-600 bg-blue-50 p-3 rounded-xl flex gap-3 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p>Promo akan otomatis aktif berdasarkan rentang waktu yang Anda tentukan di bawah ini.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Mulai Tanggal</label>
                  <DatePicker 
                    className="w-full h-11 rounded-xl"
                    date={formData.startDate || undefined}
                    setDate={(date) => setFormData(prev => ({ ...prev, startDate: date || null }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Sampai Tanggal</label>
                  <DatePicker 
                    className="w-full h-11 rounded-xl"
                    date={formData.endDate || undefined}
                    setDate={(date) => setFormData(prev => ({ ...prev, endDate: date || null }))}
                  />
                </div>
              </div>

              {/* Target & Scope */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Target Scope</label>
                  <Select 
                    value={formData.targetType} 
                    onValueChange={(val: any) => setFormData(prev => ({ ...prev, targetType: val, targetIds: [] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GLOBAL">Seluruh Toko (Global)</SelectItem>
                      <SelectItem value="CATEGORY">Kategori Tertentu</SelectItem>
                      <SelectItem value="PRODUCT">Produk Tertentu</SelectItem>
                      <SelectItem value="VARIANT">Varian Warna Tertentu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.targetType !== "GLOBAL" && (
                  <div className="space-y-3 bg-[#FEF4E8]/50 p-4 rounded-2xl border border-orange-100">
                    <label className="text-sm font-semibold flex justify-between items-center">
                      Pilih {formData.targetType === "CATEGORY" ? "Kategori" : "Produk"}
                      <span className="text-[10px] text-muted-foreground">{formData.targetIds.length} terpilih</span>
                    </label>
                    
                    {formData.targetType === "CATEGORY" ? (
                      <MultiSelectComboBox
                        options={categories.map((cat: any) => ({
                          label: cat.name,
                          value: cat.id,
                        }))}
                        selected={formData.targetIds}
                        onChange={(ids) => setFormData(prev => ({ ...prev, targetIds: ids }))}
                        placeholder="Pilih kategori..."
                        searchPlaceholder="Cari kategori..."
                        isLoading={isCategoriesLoading}
                      />
                    ) : formData.targetType === "PRODUCT" ? (
                      <MultiSelectComboBox
                        options={products.map((prod: any) => ({
                          label: prod.name,
                          value: prod.id,
                          description: prod.productCode
                        }))}
                        selected={formData.targetIds}
                        onChange={(ids) => setFormData(prev => ({ ...prev, targetIds: ids }))}
                        placeholder="Pilih produk..."
                        searchPlaceholder="Ketik nama produk..."
                        isLoading={isProductsLoading}
                        onSearchChange={setProductSearch}
                      />
                    ) : (
                      <MultiSelectComboBox
                        options={(variantData?.data || []).map((v: any) => ({
                          label: v.name,
                          value: v.id,
                          description: v.code
                        }))}
                        selected={formData.targetIds}
                        onChange={(ids) => setFormData(prev => ({ ...prev, targetIds: ids }))}
                        placeholder="Pilih varian warna..."
                        searchPlaceholder="Ketik nama produk atau warna..."
                        isLoading={isVariantsLoading}
                        onSearchChange={setVariantSearch}
                      />
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Minimal Belanja (Opsional)</label>
                  <Input 
                    type="number"
                    placeholder="Minimal Rp..." 
                    value={formData.minPurchase}
                    onChange={(e) => setFormData(prev => ({ ...prev, minPurchase: e.target.value }))}
                  />
                  <p className="text-[10px] text-muted-foreground italic">*Fitur minimal belanja akan diterapkan di tahap optimasi POS berikutnya.</p>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t pt-4">
              <Button 
                variant="ghost" 
                type="button" 
                onClick={() => setIsDialogOpen(false)}
                className="rounded-xl"
              >
                Batal
              </Button>
              <Button 
                disabled={isSubmitLoading}
                className="bg-[#3C3025] hover:bg-[#524336] text-white rounded-xl px-8 transition-all active:scale-95"
              >
                {isSubmitLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {selectedPromo ? "Simpan Perubahan" : "Buat Promo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #fef4e8;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c4a882;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
