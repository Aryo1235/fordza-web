"use client";

import { useState } from "react";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@/features/users";
import { DataTable } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/layout/admin/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Search, Edit2, Trash2, User, Shield, Lock, Key } from "lucide-react";
import { toast } from "sonner";
import { Pagination } from "@/components/shared/Pagination";
export default function UsersManagementPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    role: "KASIR",
    pin: "",
  });

  const { data, isLoading } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const filteredData = data?.data?.filter((u: any) => 
    u.username.toLowerCase().includes(search.toLowerCase()) || 
    (u.name && u.name.toLowerCase().includes(search.toLowerCase()))
  ) || [];

  const paginatedData = filteredData.slice((page - 1) * limit, page * limit);
  const totalPages = Math.ceil(filteredData.length / limit);

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({ username: "", password: "", name: "", role: "KASIR", pin: "" });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: any) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: "", // Jangan tampilkan password lama
      name: user.name || "",
      role: user.role,
      pin: user.pin || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || (!editingUser && !formData.password)) {
      return toast.error("Username dan Password wajib diisi");
    }

    if (editingUser) {
      updateUser.mutate({ id: editingUser.id, ...formData }, {
        onSuccess: () => {
          toast.success("User berhasil diperbarui");
          setIsModalOpen(false);
        },
        onError: (err: any) => toast.error(err.response?.data?.message || "Gagal memperbarui user")
      });
    } else {
      createUser.mutate(formData, {
        onSuccess: () => {
          toast.success("User berhasil dibuat");
          setIsModalOpen(false);
        },
        onError: (err: any) => toast.error(err.response?.data?.message || "Gagal membuat user")
      });
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteUser.mutate(deleteId, {
        onSuccess: () => {
          toast.success("User berhasil dihapus");
          setDeleteId(null);
        },
        onError: () => toast.error("Gagal menghapus user")
      });
    }
  };

  const columns = [
    {
      header: "User",
      cell: (u: any) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 border border-stone-200">
            <User className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="font-semibold text-stone-800 leading-none">{u.name || "N/A"}</p>
            <p className="text-[11px] text-stone-500 font-mono mt-1">@{u.username}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Role",
      cell: (u: any) => (
        <span className={cn(
          "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
          u.role === "ADMIN" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
        )}>
          {u.role === "ADMIN" ? <Shield className="w-3 h-3 mr-1" /> : <User className="w-3 h-3 mr-1" />}
          {u.role}
        </span>
      ),
    },
    {
      header: "PIN Otorisasi",
      cell: (u: any) => (
        <code className="text-[11px] px-1.5 py-0.5 bg-stone-100 rounded font-bold border border-stone-200">
          {u.pin || "BELUM DISESET"}
        </code>
      ),
    },
    {
      header: "Dibuat Pada",
      cell: (u: any) => (
        <span className="text-xs text-stone-500">
          {new Date(u.createdAt).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      header: "Aksi",
      className: "text-right",
      cell: (u: any) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => handleOpenEditModal(u)} className="h-8 w-8 text-stone-500 hover:text-stone-800">
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteId(u.id)} className="h-8 w-8 text-stone-400 hover:text-red-600">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <PageHeader 
        title="Manajemen User" 
        description="Kelola akun Admin dan Kasir yang memiliki akses ke sistem Fordza."
        action={
          <Button onClick={handleOpenAddModal} className="bg-[#3C3025] hover:bg-[#524132] text-white">
            <Plus className="mr-2 h-4 w-4" /> Tambah Akun
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-stone-200 shadow-sm font-medium">
        <div className="relative w-full sm:max-w-md space-y-1.5 flex-1">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Cari Pengguna</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <Input 
              placeholder="Cari nama atau username..." 
              className="pl-9 h-10 border-stone-200 focus:ring-stone-200 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="hidden md:block py-2 px-4 bg-stone-50 rounded-lg border border-stone-100 italic text-[10px] font-bold text-stone-400 uppercase tracking-tight">
          Role: Admin & Kasir
        </div>
      </div>

      <div className="border border-stone-200 rounded-xl shadow-sm overflow-hidden bg-white mb-6">
        <div className="bg-stone-50 border-b border-stone-100 py-3 px-6">
          <p className="text-[10px] font-bold text-stone-500 uppercase tracking-tight flex items-center gap-2">
            <User className="w-3 h-3" />
            User Access Management & Authorization ({filteredData?.length || 0} Accounts)
          </p>
        </div>
        <DataTable 
          columns={columns} 
          data={paginatedData} 
          isLoading={isLoading} 
          emptyMessage="Tidak ada pengguna ditemukan."
          className="space-y-0 [&_.rounded-md.border]:border-none [&_.rounded-md.border]:shadow-none [&_.rounded-md.border]:rounded-none"
        />
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={filteredData.length}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
        isLoading={isLoading}
        label="pengguna"
      />

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingUser ? "Edit Akun" : "Tambah Akun Baru"}</DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Contoh: Budi Sudarsono"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    value={formData.username} 
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    placeholder="user123"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role Akses</Label>
                  <Select value={formData.role} onValueChange={(val) => setFormData({...formData, role: val})}>
                    <SelectTrigger id="role" className="bg-white">
                      <SelectValue placeholder="Pilih Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KASIR">Kasir (POS Only)</SelectItem>
                      <SelectItem value="ADMIN">Admin (Dashboard)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="password">{editingUser ? "Password Baru (Opsional)" : "Password"}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <Input 
                      id="password" 
                      type="password"
                      value={formData.password} 
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pin" className="flex items-center gap-1.5 underline decoration-stone-300">
                    <Key className="w-3.5 h-3.5" /> PIN Otorisasi (6 Digit)
                  </Label>
                  <Input 
                    id="pin" 
                    value={formData.pin} 
                    onChange={(e) => setFormData({...formData, pin: e.target.value})}
                    placeholder="123456"
                    maxLength={6}
                    className="font-mono"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-[#3C3025] hover:bg-[#524132] text-white" disabled={createUser.isPending || updateUser.isPending}>
                {editingUser ? "Simpan Perubahan" : "Buat Akun"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog 
        open={!!deleteId}
        onOpenChange={(op) => !op && setDeleteId(null)}
        title="Hapus Akun"
        description="Apakah Anda yakin ingin menghapus akun ini? Akses user tersebut akan segera dicabut."
        isLoading={deleteUser.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}

// Utility to merge classnames
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
