// features/products/schemas.ts
// Validasi Zod khusus fitur produk (dipindah dari lib/zod-schemas.ts)

import { z } from "zod";

export const productSchema = z.object({
  productCode: z.string().min(3, "Kode produk minimal 3 karakter"),
  name: z.string().min(3, "Nama produk minimal 3 karakter"),
  // price & stock tidak lagi di form induk — dikelola per SKU di VariantManager
  shortDescription: z.string().min(5),
  productType: z.enum(["shoes", "apparel", "accessories"]),
  gender: z.enum(["Man", "Woman", "Unisex"]).default("Unisex"),

  description: z.string().default("").optional().nullable(),
  material: z.string().min(1, "Material Utama wajib diisi"),
  outsole: z.string().default("").optional().nullable(),
  closureType: z.string().default("").optional().nullable(),
  origin: z.string().default("").optional().nullable(),
  notes: z.string().default("").optional().nullable(),
  sizeTemplateId: z.string().min(1, "Size Template wajib dipilih"),

  categoryIds: z.array(z.string()).min(1),
  isPopular: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  isNew: z.boolean().default(true),
  isActive: z.boolean().default(true),

  images: z.any().optional(),
  variants: z.array(z.any()).optional(), // Mengizinkan data varian masuk ke service
}).superRefine((data, ctx) => {
  if (!data.isActive && (data.isPopular || data.isBestseller || data.isNew)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Produk yang tidak aktif tidak boleh ditandai sebagai Populer, Laris, atau Baru.",
      path: ["isActive"],
    });
  }
});

export type ProductSchemaValues = z.infer<typeof productSchema>;
