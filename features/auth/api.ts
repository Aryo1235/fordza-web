import api from "@/lib/api";
import type { AuthResponse, LoginCredentials, User } from "./types";

/** Login ke sistem */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    const res = await api.post("/api/admin/auth/login", credentials);
    return res.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal login");
  }
}

/** Ambil profil user yang sedang login (Session) */
export async function getMe(): Promise<User> {
  try {
    const res = await api.get("/api/admin/auth/me");
    return res.data.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal mengambil data user");
  }
}

/** Logout dari sistem */
export async function logout(): Promise<void> {
  try {
    await api.post("/api/admin/auth/logout");
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Gagal logout");
  }
}
