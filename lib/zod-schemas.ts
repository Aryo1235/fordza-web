// src/lib/zod-schemas.ts
import { z } from "zod";

// Reusable file schema (untuk konsistensi)
export const fileSchema = z.any()
  .transform((val) => {
    if (Array.isArray(val)) return val;
    if (val === undefined || val === null) return [];
    return [val];
  })
  .superRefine((files, ctx) => {
    if (files.length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Maksimal hanya 1 gambar yang diizinkan",
      });
      return; // Return early
    }

    const file = files[0];
    if (!file || !file.size || file.size === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "File gambar tidak boleh kosong",
      });
      return; // Return early agar pesan error lain tidak ikut muncul
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Hanya format .jpg, .png, dan .webp yang diizinkan",
      });
      return; // Return early jika tipe salah
    }

    if (file.size > 2000000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ukuran maksimal 2MB",
      });
    }
  })
  .transform((files) => files[0]); // Kembalikan sebagai single File agar sesuai dengan tipe sistem


export const bannerSchema = z.object({
  title: z.string().optional(),
  linkUrl: z.string().optional().nullable().or(z.literal("")),
  image: fileSchema, 
}).strict();

export const sizeTemplateSchema = z.object({
  name: z.string().min(3, "Nama template minimal 3 karakter"),
  type: z.string().min(2, "Tipe wajib diisi"),
  sizes: z.array(z.string()).min(1, "Minimal harus ada satu ukuran"),
}).strict();

export const testimonialSchema = z.object({
  productId: z.string().min(1, "Product ID wajib diisi"),
  customerName: z.string().min(3, "Nama customer minimal 3 karakter"),
  rating: z.coerce.number().min(1).max(5),
  content: z.string().min(5, "Konten minimal 5 karakter"),
  isActive: z.boolean().default(true),
}).strict();
