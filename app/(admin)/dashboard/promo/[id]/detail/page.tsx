"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import Link from "next/link";
import {
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Target,
  Tag,
  Percent,
  Banknote,
  ShoppingBag,
  FolderOpen,
  Globe,
  Loader2,
  AlertCircle,
  ArrowLeft,
  User,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  HelpCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
import { DatePicker } from "@/components/ui/date-picker";
import { MultiSelectComboBox } from "@/components/shared/MultiSelectComboBox";
import { BreadcrumbsHeader } from "@/components/layout/admin/BreadcrumbsHeader";

// ✅ Hooks Pattern
import {
  usePromo,
  useUpdatePromo,
  useDeletePromo,
  PromoTarget,
  PromoType
} from "@/features/promo";
import { useCategoriesForPromo } from "@/features/categories";
import { useProductsForPromo } from "@/features/products";
import { useVariantsAdminSearch } from "@/features/variants";

export default function PromoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  // Search states for MultiSelect ComboBox in Edit Dialog
  const [productSearch, setProductSearch] = useState("");
  const [variantSearch, setVariantSearch] = useState("");

  // Local state for Dialog & Form
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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

  // Queries
  const { data: promo, isLoading: isPromoLoading, error: promoError } = usePromo(id);
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

  // Mutations
  const updateMutation = useUpdatePromo();
  const deleteMutation = useDeletePromo();

  const products = productData?.data || [];
  const categories = categoryData?.data || [];

  // Handle Errors
  useEffect(() => {
    if (promoError) {
      toast.error((promoError as any)?.message || "Gagal memuat detail promo");
    }
  }, [promoError]);

  // Set initial form data on edit open
  const handleOpenEdit = () => {
    if (!promo) return;
    setFormData({
      name: promo.name,
      description: promo.description || "",
      type: promo.type,
      value: promo.value.toString(),
      targetType: promo.targetType,
      targetIds: promo.targetIds || [],
      startDate: new Date(promo.startDate),
      endDate: new Date(promo.endDate),
      isActive: promo.isActive,
      minPurchase: promo.minPurchase?.toString() || "0"
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) return toast.error("Nama promo wajib diisi");
    if (!formData.value || parseFloat(formData.value) <= 0) return toast.error("Nilai promo harus valid");
    if (!formData.startDate) return toast.error("Tanggal mulai wajib diisi");
    if (!formData.endDate) return toast.error("Tanggal berakhir wajib diisi");
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

    updateMutation.mutate({ id, data: payload }, {
      onSuccess: () => {
        toast.success("Promo berhasil diperbarui");
        setIsDialogOpen(false);
      },
      onError: (err: any) => toast.error(err.message || "Gagal memperbarui promo")
    });
  };

  const handleDelete = () => {
    if (!confirm("Apakah Anda yakin ingin menghapus aturan promo ini? Tindakan ini tidak dapat dibatalkan.")) return;
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Promo berhasil dihapus");
        router.push("/dashboard/promo");
      },
      onError: (err: any) => toast.error(err.message || "Gagal menghapus promo")
    });
  };

  // Helper untuk Status Badge
  const getStatusInfo = (p: any) => {
    const now = new Date();
    const start = new Date(p.startDate);
    const end = new Date(p.endDate);

    if (!p.isActive) {
      return {
        label: "Nonaktif",
        color: "bg-stone-100 text-stone-600 border-stone-200",
        desc: "Aturan promo dinonaktifkan secara manual oleh admin."
      };
    }
    if (now < start) {
      return {
        label: "Mendatang",
        color: "bg-blue-50 text-blue-600 border-blue-100",
        desc: `Menunggu aktif pada tanggal ${format(start, "dd MMM yyyy HH:mm", { locale: localeId })}`
      };
    }
    if (now > end) {
      return {
        label: "Berakhir",
        color: "bg-red-50 text-red-600 border-red-100",
        desc: `Promo telah kedaluwarsa pada tanggal ${format(end, "dd MMM yyyy HH:mm", { locale: localeId })}`
      };
    }
    return {
      label: "Berjalan",
      color: "bg-emerald-50 text-emerald-700 border-emerald-100",
      desc: `Sedang aktif hingga tanggal ${format(end, "dd MMM yyyy HH:mm", { locale: localeId })}`
    };
  };

  const getCardStatusStyle = (p: any) => {
    const now = new Date();
    const start = new Date(p.startDate);
    const end = new Date(p.endDate);

    if (!p.isActive) {
      return "bg-stone-500/10 text-stone-400 border-stone-500/20";
    }
    if (now < start) {
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    }
    if (now > end) {
      return "bg-red-500/10 text-red-400 border-red-500/20";
    }
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  };

  if (isPromoLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="h-20 w-full bg-stone-100 animate-pulse rounded-xl" />
        <div className="h-40 w-full bg-stone-100 animate-pulse rounded-xl" />
        <div className="h-96 w-full bg-stone-100 animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!promo) {
    return (
      <div className="p-6 max-w-lg mx-auto mt-20 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
        <h3 className="text-xl font-bold text-stone-800">Detail Promo Tidak Ditemukan</h3>
        <p className="text-sm text-stone-500">Promo mungkin telah dihapus atau ID promo tidak valid.</p>
        <Link href="/dashboard/promo">
          <Button className="bg-[#3C3025] hover:bg-[#5a4a38] text-white rounded-xl mt-2">
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Manajemen Promo
          </Button>
        </Link>
      </div>
    );
  }

  const status = getStatusInfo(promo);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      <BreadcrumbsHeader
        title="Detail Promo"
        breadcrumbs={[
          { label: "Promo", href: "/dashboard/promo" },
          { label: "Detail" },
        ]}
        backUrl="/dashboard/promo"
        action={
          <div className="flex gap-2">
            <Button
              onClick={handleOpenEdit}
              className="bg-white hover:bg-stone-50 text-stone-700 border border-stone-200"
            >
              <Pencil className="mr-2 h-4 w-4" /> Edit Promo
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Hapus
            </Button>
          </div>
        }
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 1 Column: Premium Voucher Card representation */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gradient-to-br from-[#3C3025] via-[#2E241B] to-[#1A110A] text-[#FEF4E8] rounded-2xl overflow-hidden shadow-lg border border-amber-500/20 relative flex flex-col justify-between min-h-[300px] p-6 group transition-all duration-300 hover:shadow-xl hover:border-amber-500/30">
            {/* Subtle light reflection overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Branding & Status */}
            <div className="flex justify-between items-center z-10">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-black text-[#1E140C] text-xs shadow-sm shadow-amber-500/20">
                  F
                </div>
                <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-amber-200/60">Fordza Craft</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${getCardStatusStyle(promo)}`}>
                {status.label}
              </span>
            </div>

            {/* Value display (VIP feel) */}
            <div className="my-auto py-6 space-y-2 z-10">
              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-amber-400/80 block">
                Automatic Discount Rule
              </span>
              <div className="space-y-1">
                {promo.type === "PERCENTAGE" ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-white tracking-tight">{promo.value}%</span>
                    <span className="text-sm font-black text-amber-400 uppercase tracking-widest">OFF</span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-amber-300 font-serif">Rp</span>
                    <span className="text-4xl font-extrabold text-white tracking-tight">{promo.value?.toLocaleString("id-ID")}</span>
                  </div>
                )}
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-medium text-stone-300">
                <span className="text-amber-400/80">Min. Belanja:</span>
                <span className="font-bold text-white">Rp {promo.minPurchase?.toLocaleString("id-ID")}</span>
              </div>
            </div>

            {/* Stub details separated by luxury gold line */}
            <div className="border-t border-amber-500/15 pt-4 mt-auto z-10 flex flex-col gap-1.5">
              <span className="text-[9px] uppercase tracking-[0.15em] text-stone-500 font-bold">
                Nama Aturan Promo
              </span>
              <p className="text-xs font-bold text-amber-100/90 truncate" title={promo.name}>
                {promo.name}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-stone-400 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">Keterangan Status</h4>
              <p className="text-xs text-stone-600 mt-1 font-medium leading-relaxed">
                {status.desc}
              </p>
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Config details & audit log */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-stone-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-stone-100 bg-stone-50/50">
              <CardTitle className="text-xs font-bold text-stone-500 uppercase tracking-widest">
                Detail Aturan Promo & Audit
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                
                {/* Promo Rules Section */}
                <div className="space-y-4">
                  <h3 className="font-bold text-stone-800 text-xs uppercase tracking-wider border-b pb-2">Aturan Konfigurasi</h3>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-stone-400 text-xs font-semibold uppercase">Nama</span>
                    <span className="col-span-2 font-semibold text-stone-800">{promo.name}</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-stone-400 text-xs font-semibold uppercase">Tipe Target</span>
                    <span className="col-span-2 font-semibold text-stone-800 capitalize">{promo.targetType.toLowerCase()}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-stone-400 text-xs font-semibold uppercase">Deskripsi</span>
                    <span className="col-span-2 text-stone-600 leading-relaxed">
                      {promo.description || <span className="italic text-stone-400">Tidak ada deskripsi</span>}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-stone-400 text-xs font-semibold uppercase">Mulai</span>
                    <span className="col-span-2 font-medium text-stone-800 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-stone-400" />
                      {format(new Date(promo.startDate), "dd MMMM yyyy HH:mm", { locale: localeId })}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-stone-400 text-xs font-semibold uppercase">Selesai</span>
                    <span className="col-span-2 font-medium text-stone-800 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-stone-400" />
                      {format(new Date(promo.endDate), "dd MMMM yyyy HH:mm", { locale: localeId })}
                    </span>
                  </div>
                </div>

                {/* Audit Logs Section */}
                <div className="space-y-4">
                  <h3 className="font-bold text-stone-800 text-xs uppercase tracking-wider border-b pb-2">Log Audit Sistem</h3>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-stone-400 text-xs font-semibold uppercase">Pembuat</span>
                    <span className="col-span-2 font-medium text-stone-800 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-stone-400" />
                      {promo.createdBy?.name || promo.createdBy?.username || <span className="italic text-stone-400">System</span>}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-stone-400 text-xs font-semibold uppercase">Dibuat Pada</span>
                    <span className="col-span-2 font-medium text-stone-800 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-stone-400" />
                      {format(new Date(promo.createdAt), "dd MMM yyyy HH:mm", { locale: localeId })}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-stone-400 text-xs font-semibold uppercase">Pengubah</span>
                    <span className="col-span-2 font-medium text-stone-800 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-stone-400" />
                      {promo.updatedBy?.name || promo.updatedBy?.username || <span className="italic text-stone-400">Belum diubah</span>}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-stone-400 text-xs font-semibold uppercase">Diubah Pada</span>
                    <span className="col-span-2 font-medium text-stone-800 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-stone-400" />
                      {format(new Date(promo.updatedAt), "dd MMM yyyy HH:mm", { locale: localeId })}
                    </span>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Target Items Listing Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-[#3C3025]">Cakupan & Target Produk</h3>
        
        {promo.targetType === "GLOBAL" ? (
          <div className="flex flex-col items-center justify-center p-12 bg-stone-50 border border-stone-200 border-dashed rounded-2xl text-center">
            <Globe className="h-10 w-10 text-stone-400 mb-3" />
            <h3 className="font-bold text-stone-700">Promo Seluruh Toko (Global)</h3>
            <p className="text-xs text-stone-500 max-w-sm mt-1">
              Aturan diskon ini berlaku otomatis untuk setiap item dan varian produk yang terdaftar di sistem Fordza.
            </p>
          </div>
        ) : (
          <div className="border border-stone-200 rounded-xl overflow-hidden bg-white">
            <div className="bg-stone-50 border-b border-stone-100 py-3 px-6">
              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-tight">
                Daftar Item Target ({promo.targets?.length || 0})
              </p>
            </div>
            <Table>
              <TableHeader className="bg-stone-50/50">
                <TableRow className="border-b border-stone-100 hover:bg-transparent">
                  <TableHead className="py-3 px-6 font-bold text-xs uppercase tracking-wider text-stone-500">Nama Item</TableHead>
                  <TableHead className="py-3 font-bold text-xs uppercase tracking-wider text-stone-500">
                    {promo.targetType === "CATEGORY" ? "Jumlah Produk" : "Tipe / Kode"}
                  </TableHead>
                  <TableHead className="py-3 px-6 font-bold text-xs uppercase tracking-wider text-stone-500 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!promo.targets || promo.targets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-stone-400 text-xs">
                      Tidak ada rincian item target terdaftar. (ID data: {promo.targetIds.join(", ")})
                    </TableCell>
                  </TableRow>
                ) : (
                  promo.targets.map((item: any) => (
                    <TableRow key={item.id} className="hover:bg-stone-50/50 border-b border-stone-100 transition-colors">
                      <TableCell className="py-4 px-6 font-semibold text-stone-800 text-sm">
                        {item.name}
                      </TableCell>
                      <TableCell className="py-4">
                        {promo.targetType === "CATEGORY" ? (
                          <Badge variant="secondary" className="bg-[#3C3025]/10 text-[#3C3025] hover:bg-[#3C3025]/20 font-bold border-none px-2.5 py-1 text-xs">
                            {item.code || "0 Produk"}
                          </Badge>
                        ) : (
                          <span className="font-mono text-xs font-semibold text-stone-500">
                            {item.code || `ID: ${item.id}`}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-4 px-6 text-right">
                        {promo.targetType === "PRODUCT" && (
                          <Link href={`/dashboard/products/${item.id}/detail`}>
                            <Button variant="ghost" size="sm" className="h-8 hover:text-amber-600 hover:bg-stone-50 rounded-lg text-stone-500 gap-1.5 text-xs font-semibold">
                              <Eye className="h-3.5 w-3.5" /> Lihat Produk
                            </Button>
                          </Link>
                        )}
                        {promo.targetType === "VARIANT" && (
                          <Link href={`/dashboard/products`}>
                            <Button variant="ghost" size="sm" className="h-8 hover:text-amber-600 hover:bg-stone-50 rounded-lg text-stone-500 gap-1.5 text-xs font-semibold">
                              <Eye className="h-3.5 w-3.5" /> Buka Katalog
                            </Button>
                          </Link>
                        )}
                        {promo.targetType === "CATEGORY" && (
                          <Link href={`/dashboard/categories/${item.id}/detail`}>
                            <Button variant="ghost" size="sm" className="h-8 hover:text-amber-600 hover:bg-stone-50 rounded-lg text-stone-500 gap-1.5 text-xs font-semibold">
                              <Eye className="h-3.5 w-3.5" /> Lihat Kategori
                            </Button>
                          </Link>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Edit Dialog Form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl bg-white border-none shadow-2xl rounded-3xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-[#3C3025]">
                Edit Promo
              </DialogTitle>
              <DialogDescription>
                Sesuaikan aturan diskon otomatis untuk meningkatkan penjualan.
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

                <div className="space-y-2 text-blue-600 bg-blue-50 p-3 rounded-xl flex items-center gap-2 text-xs">
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
                disabled={updateMutation.isPending}
                className="bg-[#3C3025] hover:bg-[#524336] text-white rounded-xl px-8 transition-all active:scale-95"
              >
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
