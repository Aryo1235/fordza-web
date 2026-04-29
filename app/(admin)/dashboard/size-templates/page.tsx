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
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SizeTemplatesPage() {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [type, setType] = useState("Sepatu");
  const [sizesStr, setSizesStr] = useState("");

  const { data, isLoading } = useSizeTemplatesAdmin();
  const createMutation = useCreateSizeTemplate();
  const updateMutation = useUpdateSizeTemplate();
  const deleteMutation = useDeleteSizeTemplate();

  const handleOpenNew = () => {
    setEditingId(null);
    setName("");
    setType("Sepatu");
    setSizesStr("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingId(item.id);
    setName(item.name);
    setType(item.type);
    setSizesStr(item.sizes.join(", "));
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sizesStr) {
      toast.error("Nama dan Ukuran wajib diisi!");
      return;
    }

    const sizes = sizesStr.split(",").map(s => s.trim()).filter(Boolean);
    if (sizes.length === 0) {
      toast.error("Minimal masukkan 1 ukuran!");
      return;
    }

    const payload = { name, type, sizes };

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
          <Button 
            variant="ghost" 
            size="icon" 
            title="Edit"
            onClick={() => handleOpenEdit(item)}
            className="hover:text-blue-600"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            title="Hapus"
            onClick={() => setDeleteId(item.id)}
            className="hover:text-red-600"
            disabled={item.productDetails?.length > 0}
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
        title="Template Ukuran" 
        description="Kelola daftar pilihan ukuran (size chart) yang dapat dipasang ke produk."
        action={
          <Button onClick={handleOpenNew} className="bg-[#3C3025] hover:bg-[#5a4a38] text-white">
            <Plus className="mr-2 h-4 w-4" /> Buat Template
          </Button>
        }
      />

      <DataTable 
        columns={columns} 
        data={data?.data || []} 
        isLoading={isLoading} 
        showNumber={true}
      />

      <ConfirmDialog 
        open={!!deleteId}
        onOpenChange={(op) => !op && setDeleteId(null)}
        title="Hapus Template"
        description="Apakah Anda yakin ingin menghapus template ukuran ini? Aksi ini tidak dapat dibatalkan."
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Template Ukuran" : "Buat Template Ukuran Baru"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
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
              <Label>Tipe (Untuk display icon)</Label>
              <Input 
                value={type} 
                onChange={(e) => setType(e.target.value)} 
                placeholder="Cth: Sepatu, Pakaian, Aksesoris"
                required 
              />
            </div>

            <div className="space-y-1.5">
              <Label>Daftar Ukuran</Label>
              <Input 
                value={sizesStr} 
                onChange={(e) => setSizesStr(e.target.value)} 
                placeholder="Cth: 39, 40, 41, 42, 43" 
                required 
              />
              <p className="text-xs text-muted-foreground">Pisahkan dengan koma (,). Contoh: S, M, L, XL</p>
            </div>

            <DialogFooter className="pt-4">
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
