// src/lib/zod-schemas.ts
import { z } from "zod";

// Reusable file schema (untuk konsistensi)
const fileSchema = z
  .any()
  .refine((file) => file?.size > 0, "File gambar tidak boleh kosong")
  .refine((file) => file?.size <= 2000000, "Ukuran maksimal 2MB") // Kategori biasanya lebih kecil
  .refine(
    (file) => ["image/jpeg", "image/png", "image/webp"].includes(file?.type),
    "Hanya format .jpg, .png, dan .webp yang diizinkan",
  );

export const categorySchema = z.object({
  name: z.string().min(3, "Nama kategori minimal 3 karakter"),
  shortDescription: z.string().optional(),
  order: z.preprocess(
    (val) => parseInt(val as string) || 0,
    z.number().int().nonnegative("Urutan harus angka positif"),
  ),
  image: fileSchema, // Kategori biasanya hanya 1 gambar utama
});

// Export juga schema produk yang tadi
export const productSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  price: z.preprocess(
    (val) => parseFloat(val as string),
    z.number().positive("Harga harus angka positif"),
  ),
  shortDescription: z.string().min(10, "Deskripsi singkat minimal 10 karakter"),
  description: z.string().min(20, "Deskripsi lengkap minimal 20 karakter"),
  productType: z.enum(["shoes", "apparel", "accessories"]),
  categoryIds: z.array(z.string()).min(1, "Pilih minimal satu kategori"),
  gender: z.enum(["Man", "Woman", "Unisex"]).default("Unisex"),
  // images divalidasi sebagai array of files
  images: z.array(fileSchema).min(1, "Minimal upload satu foto produk"),
});

export const bannerSchema = z.object({
  title: z.string().optional(),
  linkUrl: z
    .string()
    .url("Link harus format URL yang valid")
    .optional()
    .or(z.literal("")),
  image: fileSchema, // Menggunakan fileSchema yang sudah kita buat tadi
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
