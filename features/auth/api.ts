import api from "@/lib/api";
import type { AuthResponse, LoginCredentials, User } from "./types";

/** Login ke sistem */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const res = await api.post("/api/admin/auth/login", credentials);
  return res.data;
}

/** Ambil profil user yang sedang login (Session) */
export async function getMe(): Promise<User> {
  const res = await api.get("/api/admin/auth/me");
  return res.data.data;
}

/** Logout dari sistem */
export async function logout(): Promise<void> {
  await api.post("/api/admin/auth/logout");
}
