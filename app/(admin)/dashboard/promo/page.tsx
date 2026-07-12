"use client";

import { useState } from "react";
import { Plus, Search, Pencil, Trash2, Calendar, Target, Tag, Percent, Banknote, ShoppingBag, FolderOpen, Globe, Loader2, AlertCircle, Eye } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import Link from "next/link";

import { PageHeader } from "@/components/layout/admin/PageHeader";
import { Pagination } from "@/components/shared/Pagination";
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
import { useCategoriesForPromo } from "@/features/categories";
import { useProductsForPromo } from "@/features/products";
import { useVariantsAdminSearch } from "@/features/variants";
import { MultiSelectComboBox } from "@/components/shared/MultiSelectComboBox";
import { DatePicker } from "@/components/ui/date-picker";

export default function PromoPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [variantSearch, setVariantSearch] = useState("");

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

  // ✅ Hooks Pattern
  const { data: promos = [], isLoading } = usePromosAdmin();
  const { data: productData, isLoading: isProductsLoading } = useProductsForPromo(
    productSearch,
    isDialogOpen && formData.targetType === "PRODUCT"
  );
  const { data: variantData, isLoading: isVariantsLoading } = useVariantsAdminSearch(
    variantSearch,
    20,
    isDialogOpen && formData.targetType === "VARIANT"
  );
  const { data: categoryData, isLoading: isCategoriesLoading } = useCategoriesForPromo(
    isDialogOpen && formData.targetType === "CATEGORY"
  );

  const createMutation = useCreatePromo();
  const updateMutation = useUpdatePromo();
  const deleteMutation = useDeletePromo();

  const products = productData?.data || [];
  const categories = categoryData?.data || [];

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

    if (!promo.isActive) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-stone-100 text-stone-600 border border-stone-200">
          Nonaktif
        </span>
      );
    }
    if (now < start) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100">
          Mendatang
        </span>
      );
    }
    if (now > end) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-600 border border-red-100">
          Berakhir
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
        Berjalan
      </span>
    );
  };

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const filteredPromos = Array.isArray(promos)
    ? promos.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : [];

  const totalItems = filteredPromos.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const currentPage = page > totalPages ? totalPages : page;
  const startIndex = (currentPage - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedPromos = filteredPromos.slice(startIndex, endIndex);

  const isSubmitLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Manajemen Promo"
        description="Kelola diskon otomatis Fordza secara terpusat."
        action={
          <Button
            onClick={handleOpenAdd}
            className="bg-[#3C3025] hover:bg-[#5a4a38] text-white"
          >
            <Plus className="mr-2 h-4 w-4" /> Tambah Promo Baru
          </Button>
        }
      />

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border border-stone-200 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-stone-500 flex items-center justify-between">
              Total Promo
              <Tag className="h-4 w-4 text-stone-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#3C3025]">{Array.isArray(promos) ? promos.length : 0}</p>
            <p className="text-[10px] text-stone-400 mt-1">Seluruh promosi terdaftar</p>
          </CardContent>
        </Card>

        <Card className="border border-stone-200 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-stone-500 flex items-center justify-between">
              Promo Aktif
              <Percent className="h-4 w-4 text-stone-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#3C3025]">
              {Array.isArray(promos)
                ? promos.filter(p => {
                    const now = new Date();
                    return p.isActive && now >= new Date(p.startDate) && now <= new Date(p.endDate);
                  }).length
                : 0}
            </p>
            <p className="text-[10px] text-stone-400 mt-1">Aktif & dapat digunakan</p>
          </CardContent>
        </Card>

        <Card className="border border-stone-200 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-stone-500 flex items-center justify-between">
              Target Spesifik
              <Target className="h-4 w-4 text-stone-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#3C3025]">
              {Array.isArray(promos) ? promos.filter(p => p.targetType !== "GLOBAL").length : 0}
            </p>
            <p className="text-[10px] text-stone-400 mt-1">Kategori, produk, & varian</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-stone-200 shadow-sm font-medium">
        <div className="relative w-full sm:max-w-md space-y-1.5 flex-1">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
            Cari Promo
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <Input
              placeholder="Cari nama promo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 border-stone-200 focus:ring-stone-200 text-sm"
            />
          </div>
        </div>
        <div className="hidden md:block py-2 px-4 bg-stone-50 rounded-lg border border-stone-100 italic text-[10px] font-bold text-stone-400 uppercase tracking-tight">
          Status Aturan: Aktif & Terjadwal
        </div>
      </div>

      {/* Main Table Wrapper */}
      <div className="border border-stone-200 rounded-xl shadow-sm overflow-hidden bg-white mb-6">
        <div className="bg-stone-50 border-b border-stone-100 py-3 px-6">
          <p className="text-[10px] font-bold text-stone-500 uppercase tracking-tight flex items-center gap-2">
            Daftar Aturan Promo
          </p>
        </div>
        <div className="p-0">
          <Table>
            <TableHeader className="bg-stone-50/50">
              <TableRow className="border-b border-stone-100 hover:bg-transparent">
                <TableHead className="py-3 px-6 font-bold text-xs uppercase tracking-wider text-stone-500">Nama Promo</TableHead>
                <TableHead className="py-3 font-bold text-xs uppercase tracking-wider text-stone-500">Jenis & Nilai</TableHead>
                <TableHead className="py-3 font-bold text-xs uppercase tracking-wider text-stone-500">Target</TableHead>
                <TableHead className="py-3 font-bold text-xs uppercase tracking-wider text-stone-500 text-center">Status</TableHead>
                <TableHead className="py-3 font-bold text-xs uppercase tracking-wider text-stone-500">Periode</TableHead>
                <TableHead className="py-3 px-6 font-bold text-xs uppercase tracking-wider text-stone-500 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-stone-500" />
                  </TableCell>
                </TableRow>
              ) : paginatedPromos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-stone-400">
                    Tidak ada data promo.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPromos.map((promo) => (
                  <TableRow key={promo.id} className="hover:bg-stone-50/50 border-b border-stone-100 transition-colors">
                    <TableCell className="py-4 px-6 font-semibold text-[#3C3025] truncate max-w-[200px]" title={promo.name}>
                      {promo.name}
                    </TableCell>
                    <TableCell className="py-4">
                      {promo.type === "PERCENTAGE" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100">
                          {promo.value}% Off
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
                          Rp {promo.value?.toLocaleString("id-ID")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-1.5">
                        {promo.targetType === "GLOBAL" && <Globe className="h-3.5 w-3.5 text-stone-500" />}
                        {promo.targetType === "CATEGORY" && <FolderOpen className="h-3.5 w-3.5 text-stone-500" />}
                        {promo.targetType === "PRODUCT" && <ShoppingBag className="h-3.5 w-3.5 text-stone-500" />}
                        {promo.targetType === "VARIANT" && <Target className="h-3.5 w-3.5 text-stone-500" />}
                        <span className="capitalize text-xs font-medium text-stone-600">
                          {promo.targetType.toLowerCase()}
                        </span>
                        {promo.targetIds?.length > 0 && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-stone-100 text-stone-600 border border-stone-200">
                            +{promo.targetIds.length}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      {getStatusBadge(promo)}
                    </TableCell>
                    <TableCell className="py-4 text-xs">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-stone-700 font-medium flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-stone-400" />
                          {format(new Date(promo.startDate), "dd MMM yyyy", { locale: localeId })}
                        </span>
                        <span className="text-stone-400 text-[10px]">
                          s/d {format(new Date(promo.endDate), "dd MMM yyyy", { locale: localeId })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/dashboard/promo/${promo.id}/detail`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Detail"
                            className="h-8 w-8 hover:text-amber-600 hover:bg-stone-50 rounded-lg text-stone-500"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(promo)}
                          title="Edit"
                          className="h-8 w-8 hover:text-blue-600 hover:bg-stone-50 rounded-lg text-stone-500"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={deleteMutation.isPending}
                          onClick={() => handleDelete(promo.id)}
                          title="Hapus"
                          className="h-8 w-8 hover:text-red-600 hover:bg-stone-50 rounded-lg text-stone-500"
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
          
          {totalItems > 0 && (
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={(nextLimit) => {
                setLimit(nextLimit);
                setPage(1);
              }}
              isLoading={isLoading}
              label="promo"
            />
          )}
        </div>
      </div>
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

                <div className="space-y-2 text-blue-600 bg-blue-50 p-3 rounded-xl flex items-center gap-2  text-xs">
                  <AlertCircle className="h-4 w-4 mb-auto" />
                  <div>
                    <p>Promo aktif otomatis sesuai rentang tanggal.</p>
                  </div>
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
                  <p className="text-[10px] text-green-600 font-semibold italic">*Fitur minimal belanja kini aktif sepenuhnya di sistem POS Kasir Desktop & Mobile.</p>
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

    </div>
  );
}
