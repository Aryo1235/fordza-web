"use client";

import { use, useState, useEffect } from "react";
import { useBanner, useUpdateBanner } from "@/features/banners";
import { BreadcrumbsHeader } from "@/components/layout/admin/BreadcrumbsHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { 
  Loader2, 
  Save 
} from "lucide-react";
import Link from "next/link";

export default function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  // Fetch Banner
  const { data: banner, isLoading: isFetching } = useBanner(id);
  const updateMutation = useUpdateBanner();

  // Form State
  const [title, setTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [file, setFile] = useState<File | null>(null);

  // Initialize form state once banner data is fetched
  useEffect(() => {
    if (banner) {
      setTitle(banner.title || "");
      setLinkUrl(banner.linkUrl || "");
      setIsActive(banner.isActive ?? true);
    }
  }, [banner]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      toast.error("Judul banner wajib diisi!");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("linkUrl", linkUrl);
    formData.append("isActive", String(isActive));
    if (file) {
      formData.append("image", file);
    }

    updateMutation.mutate({ id, formData }, {
      onSuccess: () => {
        toast.success("Banner berhasil diperbarui!");
        router.push(`/dashboard/banners/${id}/detail`);
      },
      onError: (err: any) => {
        const errMsg = err?.response?.data?.message || err?.message || "Gagal memperbarui banner";
        const traceId = err?.response?.data?.traceId;
        toast.error(errMsg);
        console.error(`Error updating banner (Trace ID: ${traceId || "N/A"}):`, err);
      }
    });
  };

  // Preview images logic
  const getPreviewImages = () => {
    if (file) {
      return [{ id: "temp", url: URL.createObjectURL(file) }];
    }
    if (banner?.imageUrl) {
      return [{ id: "existing", url: banner.imageUrl }];
    }
    return [];
  };

  if (isFetching || !banner) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#3C3025]" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      
      <BreadcrumbsHeader
        title="Edit Banner"
        breadcrumbs={[
          { label: "Banner", href: "/dashboard/banners" },
          { label: banner.title || "", href: `/dashboard/banners/${id}/detail` },
          { label: "Edit Banner" },
        ]}
      />

      {/* Edit Form Card */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column Fields */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-600 uppercase tracking-wide">Judul Banner</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Promo Spesial Kemerdekaan"
                  required
                  className="rounded-xl h-11 border-zinc-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-600 uppercase tracking-wide">URL Tujuan (Opsional)</Label>
                <Input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://fordza.co.id/category/sale"
                  className="rounded-xl h-11 border-zinc-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-600 uppercase tracking-wide">Status Penayangan</Label>
                <Select
                  value={isActive ? "true" : "false"}
                  onValueChange={(val) => setIsActive(val === "true")}
                >
                  <SelectTrigger className="w-full h-11 rounded-xl border-zinc-200 text-sm font-semibold text-zinc-700">
                    <SelectValue placeholder="Pilih Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-zinc-150">
                    <SelectItem value="true" className="font-bold text-xs">Aktif (Ditampilkan)</SelectItem>
                    <SelectItem value="false" className="font-bold text-xs">Non-aktif (Disembunyikan)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right Column: Image Upload */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-600 uppercase tracking-wide">Gambar Banner (Rekomendasi: 1920x600px)</Label>
              <div className="border border-zinc-100 rounded-2xl p-4 bg-zinc-50/50">
                <ImageUpload
                  images={getPreviewImages()}
                  onUpload={async (f) => setFile(f)}
                  onRemove={async () => setFile(null)}
                  maxFiles={1}
                />
              </div>
            </div>

          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-stone-100">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.back()}
              className="rounded-xl px-5 h-11 font-semibold text-xs border-stone-200 text-stone-500 hover:bg-stone-50"
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={updateMutation.isPending} 
              className="bg-[#3C3025] hover:bg-[#5a4a38] text-white rounded-xl px-6 h-11 font-bold text-xs"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Perubahan
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

    </div>
  );
}
