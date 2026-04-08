// src/lib/zod-schemas.ts
import { z } from "zod";

// Reusable file schema (untuk konsistensi)
export const fileSchema = z
  .any()
  .refine((file) => file?.size > 0, "File gambar tidak boleh kosong")
  .refine((file) => file?.size <= 2000000, "Ukuran maksimal 2MB") // Kategori biasanya lebih kecil
  .refine(
    (file) => ["image/jpeg", "image/png", "image/webp"].includes(file?.type),
    "Hanya format .jpg, .png, dan .webp yang diizinkan",
  );


export const bannerSchema = z.object({
  title: z.string().optional(),
  linkUrl: z.string().optional().nullable().or(z.literal("")),
  image: fileSchema, 
});

export const sizeTemplateSchema = z.object({
  name: z.string().min(3, "Nama template minimal 3 karakter"),
  type: z.string().min(2, "Tipe wajib diisi"),
  sizes: z.array(z.string()).min(1, "Minimal harus ada satu ukuran"),
});

export const testimonialSchema = z.object({
  productId: z.string().min(1, "Product ID wajib diisi"),
  customerName: z.string().min(3, "Nama customer minimal 3 karakter"),
  rating: z.coerce.number().min(1).max(5),
  content: z.string().min(5, "Konten minimal 5 karakter"),
  isActive: z.boolean().default(true),
});
