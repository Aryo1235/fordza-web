import { z } from "zod";

export const CreateCategorySchema = z.object({
  name: z.string().min(1, "Nama kategori wajib diisi").max(255),
  shortDescription: z.string().max(500).optional(),
  imageUrl: z.string().url("URL gambar tidak valid"),
  imageKey: z.string().min(1, "Image key wajib diisi"),
  isActive: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
});

export const UpdateCategorySchema = CreateCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
