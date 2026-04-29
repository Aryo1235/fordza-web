"use client";

import { useState } from "react";
import { useCategoriesAdmin, useDeleteCategory } from "@/features/categories";
import { DataTable } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/layout/admin/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import Link from "next/link";

export default function CategoriesPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useCategoriesAdmin(page, limit);
  const deleteMutation = useDeleteCategory();

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
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
          <Link href={`/dashboard/categories/${item.id}`}>
            <Button variant="ghost" size="icon" title="Edit">
              <Edit className="h-4 w-4 text-blue-600" />
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            title="Hapus"
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

      <DataTable 
        columns={columns} 
        data={data?.data || []} 
        isLoading={isLoading} 
        meta={data?.meta}
        onPageChange={setPage}
        showNumber={true}
      />

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
