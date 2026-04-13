// features/products/schemas.ts
// Validasi Zod khusus fitur produk (dipindah dari lib/zod-schemas.ts)

import { z } from "zod";

export const productSchema = z.object({
  productCode: z.string().min(3, "Kode produk minimal 3 karakter"),
  name: z.string().min(3, "Nama produk minimal 3 karakter"),
  price: z.coerce.number().min(1000),
  stock: z.coerce.number().int().min(0, "Stok tidak boleh negatif").default(0),
  shortDescription: z.string().min(5),
  productType: z.enum(["shoes", "apparel", "accessories"]),
  gender: z.enum(["Man", "Woman", "Unisex"]).default("Unisex"),

  description: z.string().optional(),
  material: z.string().optional().nullable(),
  closureType: z.string().optional().nullable(),
  outsole: z.string().optional().nullable(),
  origin: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  careInstructions: z.string().optional().nullable(),
  sizeTemplateId: z.string().optional().nullable(),

  categoryIds: z.array(z.string()).min(1),
  isPopular: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  isNew: z.boolean().default(true),
  isActive: z.boolean().default(true),

  images: z.any().optional(),
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
