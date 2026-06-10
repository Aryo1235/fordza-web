"use client";

import { useState } from "react";
import { useCategoriesAdmin, useDeleteCategory } from "@/features/categories";
import { DataTable } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/layout/admin/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Eye, Layers } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function CategoriesPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useCategoriesAdmin(page, limit);
  const deleteMutation = useDeleteCategory();

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => {
          toast.success("Kategori berhasil dihapus");
          setDeleteId(null);
        },
        onError: (err: any) => {
          const errMsg = err?.response?.data?.message || err?.message || "Gagal menghapus kategori";
          const traceId = err?.response?.data?.traceId;
          
          toast.error(errMsg);
          console.error(`Error deleting category (Trace ID: ${traceId || "N/A"}):`, err);
          setDeleteId(null);
        }
      });
    }
  };

  const columns = [
    {
      header: "Kategori",
      cell: (item: any) => (
        <div>
          <p className="font-semibold text-[#3C3025]">{item.name}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-[400px]">
            {item.shortDescription}
          </p>
        </div>
      ),
    },
    {
      header: "Urutan",
      accessorKey: "order" as any,
    },
    {
      header: "Aksi",
      className: "text-right",
      cell: (item: any) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            title="Detail"
            className="text-stone-600 hover:text-amber-600 hover:bg-stone-50 rounded-lg"
            asChild
          >
            <Link href={`/dashboard/categories/${item.id}/detail`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Edit"
            className="text-stone-600 hover:text-blue-600 hover:bg-stone-50 rounded-lg"
            asChild
          >
            <Link href={`/dashboard/categories/${item.id}`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
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
        title="Daftar Kategori" 
        description="Kelola kategori produk untuk navigasi pelanggan."
        action={
          <Link href="/dashboard/categories/new">
            <Button className="bg-[#3C3025] hover:bg-[#5a4a38] text-white">
              <Plus className="mr-2 h-4 w-4" /> Tambah Kategori
            </Button>
          </Link>
        }
      />

      <div className="border border-stone-200 rounded-xl shadow-sm overflow-hidden bg-white mb-6">
        <div className="bg-stone-50 border-b border-stone-100 py-3 px-6">
          <p className="text-[10px] font-bold text-stone-500 uppercase tracking-tight flex items-center gap-2">
            <Layers className="w-3 h-3 text-stone-400" />
            Category Master List Management ({data?.meta?.totalItems || data?.data?.length || 0} Items)
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

      <ConfirmDialog 
        open={!!deleteId}
        onOpenChange={(op) => !op && setDeleteId(null)}
        title="Hapus Kategori"
        description="Apakah Anda yakin ingin menghapus kategori ini? Aksi ini tidak dapat dibatalkan."
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
