import { z } from "zod";

export const CreateAdminSchema = z.object({
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh huruf, angka, dan underscore"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  name: z.string().min(1, "Nama wajib diisi").max(255).optional(),
  role: z.enum(["ADMIN", "KASIR"], {
    message: "Role harus ADMIN atau KASIR"
  }),
  pin: z
    .string()
    .regex(/^\d{4}$/, "PIN harus 4 digit angka")
    .optional(),
});

export const UpdateAdminSchema = CreateAdminSchema.partial().extend({
  password: z.string().min(6, "Password minimal 6 karakter").optional(),
});

export const LoginSchema = z.object({
  username: z.string().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

export const VerifyPinSchema = z.object({
  pin: z.string().regex(/^\d{4}$/, "PIN harus 4 digit angka"),
});

export type CreateAdminInput = z.infer<typeof CreateAdminSchema>;
export type UpdateAdminInput = z.infer<typeof UpdateAdminSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type VerifyPinInput = z.infer<typeof VerifyPinSchema>;
