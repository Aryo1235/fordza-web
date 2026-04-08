// features/categories/schemas.ts
import { z } from "zod";
import { fileSchema } from "@/lib/zod-schemas";

export const categorySchema = z.object({
  name: z.string().min(3, "Nama kategori minimal 3 karakter"),
  shortDescription: z.string().optional(),
  order: z.preprocess(
    (val) => parseInt(val as string) || 0,
    z.number().int().nonnegative("Urutan harus angka positif"),
  ),
  image: fileSchema.optional(), // Kategori biasanya hanya 1 gambar utama
});

export type CategorySchemaValues = z.infer<typeof categorySchema>;
