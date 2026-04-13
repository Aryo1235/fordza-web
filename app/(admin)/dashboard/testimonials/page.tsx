"use client";

import { useState } from "react";
import { useTestimonialsAdmin, useUpdateTestimonial, useDeleteTestimonial, useCreateTestimonial } from "@/features/testimonials";
import { useProductsAdmin } from "@/features/products";
import { DataTable } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/layout/admin/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Trash2, Search, Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function TestimonialsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form State
  const [customerName, setCustomerName] = useState("");
  const [productId, setProductId] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");

  const { data, isLoading } = useTestimonialsAdmin(page, limit, search);
  // Fetch products for dropdown - Only when modal is open (Optimization)
  const { data: productsData } = useProductsAdmin({ page: 1, limit: 100 }, isAddOpen);
  
  const createMutation = useCreateTestimonial();
  const updateMutation = useUpdateTestimonial();
  const deleteMutation = useDeleteTestimonial();

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => {
          setDeleteId(null);
          toast.success("Testimoni berhasil dihapus");
        },
        onError: () => toast.error("Gagal menghapus testimoni"),
      });
    }
  };

  const handleToggleApproval = (id: string, currentStatus: boolean) => {
    updateMutation.mutate({ id, data: { isActive: !currentStatus } }, {
      onSuccess: () => toast.success("Status berhasil diperbarui"),
      onError: () => toast.error("Gagal memperbarui status"),
    });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !customerName || !content) {
      toast.error("Harap isi semua kolom dengan benar!");
      return;
    }
    
    // Status langsung aktif karena admin yang buat
    createMutation.mutate({ productId, customerName, rating, content, isActive: true }, {
      onSuccess: () => {
        setIsAddOpen(false);
        setCustomerName("");
        setProductId("");
        setProductSearch("");
        setRating(5);
        setContent("");
        toast.success("Testimoni berhasil ditambahkan!");
      },
      onError: (err: any) => toast.error(err?.response?.data?.message || "Gagal menambah testimoni")
    });
  };

  // Filter products for dropdown
  const filteredProducts = productsData?.data?.filter((p: any) => 
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const columns = [
    {
      header: "Pelanggan",
      cell: (item: any) => (
        <div>
          <p className="font-semibold text-[#3C3025]">{item.customerName}</p>
          <div className="flex items-center mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg 
                key={i} 
                className={`w-3 h-3 ${i < item.rating ? "text-yellow-400" : "text-gray-300"}`} 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        </div>
      ),
    },
    {
      header: "Ulasan & Produk",
      cell: (item: any) => (
        <div className="max-w-[300px] lg:max-w-[400px]">
          <p className="text-sm italic text-gray-700">"{item.content}"</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-6 w-6 rounded bg-gray-100 overflow-hidden relative">
              {item.product?.images?.[0]?.url && (
                <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <p className="text-xs font-medium text-gray-500 truncate">{item.product?.name}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Tgl Review",
      cell: (item: any) => (
        <span className="text-muted-foreground text-sm">
          {new Date(item.createdAt).toLocaleDateString("id-ID", {
            day: 'numeric', month: 'short', year: 'numeric'
          })}
        </span>
      ),
    },
    {
      header: "Tampilkan di Web?",
      cell: (item: any) => (
        <Switch 
          checked={item.isActive} 
          onCheckedChange={() => handleToggleApproval(item.id, item.isActive)}
          disabled={updateMutation.isPending && updateMutation.variables?.id === item.id}
        />
      ),
    },
    {
      header: "Aksi",
      className: "text-right",
      cell: (item: any) => (
        <div className="flex justify-end gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            title="Hapus Permanen"
            onClick={() => setDeleteId(item.id)}
            className="hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <PageHeader 
        title="Moderasi Testimoni" 
        description="Pilih ulasan mana saja yang akan ditampilkan untuk dilihat publik."
        action={
          <Button onClick={() => setIsAddOpen(true)} className="bg-[#3C3025] hover:bg-[#5a4a38] text-white">
            <Plus className="mr-2 h-4 w-4" /> Tambah Manual
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-stone-200 shadow-sm font-medium">
        <div className="relative w-full sm:max-w-md space-y-1.5 flex-1">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Cari Ulasan</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <Input 
              placeholder="Ketik nama pelanggan..." 
              className="pl-9 h-10 border-stone-200 focus:ring-stone-200 text-sm"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
        <div className="hidden md:block py-2 px-4 bg-stone-50 rounded-lg border border-stone-100 italic text-[10px] font-bold text-stone-400 uppercase tracking-tight">
          Status: Public Reviews
        </div>
      </div>

      <div className="border border-stone-200 rounded-xl shadow-sm overflow-hidden bg-white mb-6">
        <div className="bg-stone-50 border-b border-stone-100 py-3 px-6">
          <p className="text-[10px] font-bold text-stone-500 uppercase tracking-tight flex items-center gap-2">
            <Search className="w-3 h-3 text-stone-400" />
            Customer Feedback & Moderation Audit ({data?.meta?.totalItems || 0} Reviews)
          </p>
        </div>
        <DataTable 
          columns={columns} 
          data={data?.data || []} 
          isLoading={isLoading} 
          meta={data?.meta}
          onPageChange={setPage}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
          emptyMessage="Belum ada testimoni pelanggan."
          className="space-y-0 [&_.rounded-md.border]:border-none [&_.rounded-md.border]:shadow-none [&_.rounded-md.border]:rounded-none"
        />
      </div>

      {/* Dialog Hapus */}
      <ConfirmDialog 
        open={!!deleteId}
        onOpenChange={(op) => !op && setDeleteId(null)}
        title="Hapus Testimoni"
        description="Testimoni ini akan dihapus permanen. Rating produk mungkin akan dihitung ulang secara otomatis."
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />

      {/* Dialog Tambah Manual */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Testimoni Manual</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Nama Pelanggan (Cth: dari WhatsApp)</Label>
              <Input 
                value={customerName} 
                onChange={(e) => setCustomerName(e.target.value)} 
                placeholder="Budi Santoso" 
                required 
              />
            </div>

            <div className="space-y-1.5 relative">
              <Label>Pilih Produk</Label>
              <Input 
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setIsDropdownOpen(true);
                  if (productId) setProductId(""); // reset ID jika user ngetik ulang
                }}
                onFocus={() => setIsDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                placeholder="Ketik nama produk untuk mencari..."
                required={!productId}
              />
              {isDropdownOpen && filteredProducts && filteredProducts.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 max-h-48 overflow-auto bg-white border border-gray-200 rounded-md shadow-lg">
                  {filteredProducts.map((p: any) => (
                    <li 
                      key={p.id}
                      className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 border-b last:border-0"
                      onClick={() => {
                        setProductId(p.id);
                        setProductSearch(p.name);
                        setIsDropdownOpen(false);
                      }}
                    >
                      {p.name}
                    </li>
                  ))}
                </ul>
              )}
              {isDropdownOpen && filteredProducts?.length === 0 && (
                <div className="absolute z-10 w-full mt-1 p-3 text-sm text-center text-gray-500 bg-white border border-gray-200 rounded-md shadow-lg">
                  Produk tidak ditemukan
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Rating Bintang</Label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value={5}>⭐⭐⭐⭐⭐ (5 - Sangat Baik)</option>
                <option value={4}>⭐⭐⭐⭐ (4 - Baik)</option>
                <option value={3}>⭐⭐⭐ (3 - Cukup)</option>
                <option value={2}>⭐⭐ (2 - Kurang)</option>
                <option value={1}>⭐ (1 - Buruk)</option>
              </select>
            </div>
            
            <div className="space-y-1.5">
              <Label>Isi Ulasan</Label>
              <Textarea 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                placeholder="Sepatunya sangat nyaman dipakai kerja tiap hari..." 
                required 
                className="h-24"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={createMutation.isPending} className="bg-[#3C3025] hover:bg-[#5a4a38] text-white">
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Simpan & Langsung Tayang
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
