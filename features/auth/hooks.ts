"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api, { setAccessToken } from "@/lib/api";
import { useRouter } from "next/navigation";
import { login, logout, getMe } from "./api";
import type { LoginCredentials } from "./types";

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
      // Simpan access token di memory
      if (data.data?.accessToken) {
        setAccessToken(data.data.accessToken);
      }
      queryClient.invalidateQueries({ queryKey: authKeys.me });
      
      // Redirect sesuai role
      if (data.data?.role === "KASIR") {
        router.push("/pos");
      } else {
        router.push("/dashboard");
      }
    },
  });
}

/** Hook untuk cek session (siapa yang sedang login) */
export function useMe() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: getMe,
    retry: false,
    staleTime: 5 * 60 * 1000, // cache 5 menit
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
    onSuccess: performLogout,
    onError: performLogout,
  });
}
