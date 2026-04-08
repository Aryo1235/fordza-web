"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api, { setAccessToken } from "@/lib/api";
import { useRouter } from "next/navigation";

// Hook untuk login
export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const res = await api.post("/api/admin/auth/login", credentials);
      return res.data;
    },
    onSuccess: (data) => {
      // Simpan access token di memory
      if (data.data?.accessToken) {
        setAccessToken(data.data.accessToken);
      }
      queryClient.invalidateQueries({ queryKey: ["auth-me"] });
      
      // Redirect sesuai role
      if (data.data?.role === "KASIR") {
        router.push("/kasir");
      } else {
        router.push("/dashboard");
      }
    },
  });
}

// Hook untuk cek session (siapa yang sedang login)
export function useMe() {
  return useQuery({
    queryKey: ["auth-me"],
    queryFn: async () => {
      const res = await api.get("/api/admin/auth/me");
      return res.data.data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // cache 5 menit
  });
}

// Hook untuk logout
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post("/api/admin/auth/logout");
    },
    onSuccess: () => {
      setAccessToken(null);
      queryClient.clear();
      router.push("/login");
    },
    onError: () => {
      // Tetap logout di client meski server error
      setAccessToken(null);
      queryClient.clear();
      router.push("/login");
    },
  });
}
