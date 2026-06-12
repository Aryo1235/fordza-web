"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api, { setAccessToken } from "@/lib/api";
import { useRouter } from "next/navigation";
import { login, logout, getMe } from "./api";
import type { LoginCredentials } from "./types";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

export const authKeys = {
  all: ["auth"] as const,
  me: ["auth-me"] as const,
};

/** Hook untuk login */
export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials),
    onSuccess: (data) => {
      if (data.data?.accessToken) {
        setAccessToken(data.data.accessToken);
      }
      queryClient.invalidateQueries({ queryKey: authKeys.me });
      
      showSuccessToast("Login berhasil!");
      
      if (data.data?.role === "KASIR") {
        router.push("/pos");
      } else {
        router.push("/dashboard");
      }
    },
    onError: (error) => {
      showErrorToast(error, "Login gagal. Periksa username dan password Anda.");
    },
  });
}

/** Hook untuk cek session (siapa yang sedang login) */
export function useMe() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: getMe,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

/** Hook untuk logout */
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const performLogout = () => {
    setAccessToken(null);
    queryClient.clear();
    router.push("/login");
  };

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      showSuccessToast("Logout berhasil");
      performLogout();
    },
    onError: performLogout,
  });
}
