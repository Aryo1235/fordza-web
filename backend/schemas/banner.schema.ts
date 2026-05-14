import { z } from "zod";

export const CreateBannerSchema = z.object({
  title: z.string().max(255).optional(),
  imageUrl: z.string().url("URL gambar tidak valid"),
  imageKey: z.string().min(1, "Image key wajib diisi"),
  linkUrl: z.string().url("URL link tidak valid").optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export const UpdateBannerSchema = CreateBannerSchema.partial();

export type CreateBannerInput = z.infer<typeof CreateBannerSchema>;
export type UpdateBannerInput = z.infer<typeof UpdateBannerSchema>;
