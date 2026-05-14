import { z } from "zod";

export const CreatePromoSchema = z.object({
  name: z.string().min(1, "Nama promo wajib diisi").max(255),
  description: z.string().optional(),
  type: z.enum(["PERCENTAGE", "NOMINAL"], {
    errorMap: () => ({ message: "Tipe harus PERCENTAGE atau NOMINAL" }),
  }),
  value: z.number().positive("Nilai harus lebih dari 0"),
  targetType: z.enum(["GLOBAL", "CATEGORY", "PRODUCT", "VARIANT"], {
    errorMap: () => ({ message: "Target type tidak valid" }),
  }),
  targetIds: z.array(z.string()).default([]),
  minPurchase: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
});

export const UpdatePromoSchema = CreatePromoSchema.partial();

export type CreatePromoInput = z.infer<typeof CreatePromoSchema>;
export type UpdatePromoInput = z.infer<typeof UpdatePromoSchema>;
