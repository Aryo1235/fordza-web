"use client";

import { useState } from "react";
import { useBannersAdmin, useCreateBanner, useDeleteBanner } from "@/features/banners";
import { DataTable } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/layout/admin/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { Plus, Trash2, Loader2, Eye, Edit, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

export default function BannersPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Add Form State
  const [title, setTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const { data, isLoading } = useBannersAdmin(page, limit);
  const createMutation = useCreateBanner();
  const deleteMutation = useDeleteBanner();

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => {
          toast.success("Banner berhasil dihapus");
          setDeleteId(null);
        },
        onError: () => {
          toast.error("Gagal menghapus banner");
        }
      });
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !file) {
      toast.error("Judul dan Gambar wajib diisi!");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    if (linkUrl) formData.append("linkUrl", linkUrl);
    formData.append("image", file);

    createMutation.mutate(formData, {
      onSuccess: () => {
        toast.success("Banner berhasil dibuat!");
        setIsAddOpen(false);
        setTitle("");
        setLinkUrl("");
        setFile(null);
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || "Gagal membuat banner");
      }
    });
  };

  const columns = [
    {
      header: "Banner",
      cell: (item: any) => (
        <div className="flex items-center gap-4">
          <div className="h-16 w-32 rounded-lg bg-gray-100 overflow-hidden relative border shrink-0">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            ) : null}
          </div>
          <div>
            <p className="font-semibold text-[#3C3025]">{item.title}</p>
            {item.linkUrl && (
              <a href={item.linkUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                {item.linkUrl}
              </a>
            )}
          </div>
        </div>
      ),
    },
    {
      header: "Tgl Dibuat",
      cell: (item: any) => (
        <span className="text-muted-foreground text-sm">
          {new Date(item.createdAt).toLocaleDateString("id-ID", {
            day: 'numeric', month: 'short', year: 'numeric'
          })}
        </span>
      ),
    },
    {
      header: "Aksi",
      className: "text-right",
      cell: (item: any) => (
        <div className="flex justify-end gap-2">
          <Link href={`/dashboard/banners/${item.id}/detail`}>
            <Button
              variant="ghost"
              size="icon"
              title="Detail"
              className="text-stone-600 hover:text-amber-600 hover:bg-stone-50 rounded-lg"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/dashboard/banners/${item.id}`}>
            <Button
              variant="ghost"
              size="icon"
              title="Edit"
              className="text-stone-600 hover:text-blue-600 hover:bg-stone-50 rounded-lg"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            title="Hapus"
            onClick={() => setDeleteId(item.id)}
            className="text-stone-600 hover:text-red-600 hover:bg-stone-50 rounded-lg"
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
        title="Daftar Banner"
        description="Kelola banner promosi yang tampil di halaman depan (Home)."
        action={
          <Button onClick={() => setIsAddOpen(true)} className="bg-[#3C3025] hover:bg-[#5a4a38] text-white">
            <Plus className="mr-2 h-4 w-4" /> Tambah Banner
          </Button>
        }
      />

      <div className="border border-stone-200 rounded-xl shadow-sm overflow-hidden bg-white mb-6">
        <div className="bg-stone-50 border-b border-stone-100 py-3 px-6">
          <p className="text-[10px] font-bold text-stone-500 uppercase tracking-tight flex items-center gap-2">
            <ImageIcon className="w-3 h-3 text-stone-400" />
            Promo Banner List Management ({data?.meta?.totalItems || data?.data?.length || 0} Items)
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
          showNumber={true}
          className="space-y-0 [&_.rounded-md.border]:border-none [&_.rounded-md.border]:shadow-none [&_.rounded-md.border]:rounded-none"
        />
      </div>

      {/* Dialog Hapus */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(op) => !op && setDeleteId(null)}
        title="Hapus Banner"
        description="Banner ini akan dihapus permanen dari sistem dan tidak akan tampil lagi di halaman depan."
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />

      {/* Dialog Tambah */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Tambah Banner Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 space-y-4 py-4 overflow-y-auto pr-1">
              <div className="space-y-1.5">
                <Label>Judul Banner</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Promo Spesial Kemerdekaan"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Label URL Tujuan (Opsional)</Label>
                <Input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://fordza.co.id/category/sale"
                />
              </div>

              <div className="space-y-1.5 pt-2">
                <Label>Gambar Banner (Rekomendasi: 1920x600px)</Label>
                <ImageUpload
                  images={file ? [{ id: "temp", url: URL.createObjectURL(file) }] : []}
                  onUpload={async (f) => setFile(f)}
                  onRemove={async () => setFile(null)}
                  maxFiles={1}
                />
              </div>
            </div>

            <DialogFooter className="sm:justify-end pt-4 border-t border-zinc-100 shrink-0">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={createMutation.isPending} className="bg-[#3C3025] hover:bg-[#5a4a38] text-white">
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
