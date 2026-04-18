// features/variants/schemas.ts
// Validasi Zod untuk form Varian dan SKU

import { z } from "zod";

// ─── VARIAN (Level Warna) ───────────────────────────────────

export const variantSchema = z.object({
  color: z.string().min(1, "Nama warna wajib diisi"),
  colorCode: z
    .string()
    .max(5, "Kode warna maks 5 karakter")
    .regex(/^[A-Z0-9]*$/, "Hanya huruf kapital dan angka")
    .optional()
    .nullable(),
  basePrice: z.coerce
    .number()
    .min(1000, "Harga jual minimal Rp 1.000")
    .optional(),
  comparisonPrice: z.coerce
    .number()
    .min(0, "Harga gimmick tidak boleh negatif")
    .optional()
    .nullable(),
  isActive: z.boolean().default(true),
  images: z.array(z.object({ url: z.string(), key: z.string() })).optional(),
});

export type VariantSchemaValues = z.infer<typeof variantSchema>;

// ─── SKU (Level Ukuran) ────────────────────────────────────

export const skuSchema = z.object({
  size: z.string().min(1, "Ukuran wajib diisi"),
  stock: z.coerce.number().int().min(0, "Stok tidak boleh negatif").default(0),
  // null = pakai harga basePrice varian (reguler)
  // diisi = override harga (misal bigsize ≥ 45)
  priceOverride: z.coerce.number().min(1000).optional().nullable(),
  isActive: z.boolean().default(true),
});

export type SkuSchemaValues = z.infer<typeof skuSchema>;

// ─── BULK SKU (Membuat beberapa ukuran sekaligus) ──────────

export const bulkSkuSchema = z.object({
  skus: z.array(skuSchema).min(1, "Tambahkan minimal 1 ukuran"),
});

export type BulkSkuSchemaValues = z.infer<typeof bulkSkuSchema>;
