"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  getCashiers 
} from "./api";

export const userKeys = {
  all: ["admin-users"] as const,
  cashiers: ["cashiers"] as const,
};

/** Hook untuk mengambil daftar seluruh user */
export function useUsers() {
  return useQuery({
    queryKey: userKeys.all,
    queryFn: getUsers,
  });
}

/** Hook untuk membuat user baru */
export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.cashiers });
    },
  });
}

/** Hook untuk memperbarui data user */
export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.cashiers });
      // Invalidate auth-me juga karena mungkin mengedit diri sendiri
      queryClient.invalidateQueries({ queryKey: ["auth-me"] });
    },
  });
}

/** Hook untuk menghapus user */
export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.cashiers });
    },
  });
}

/** Hook khusus untuk daftar kasir (biasanya untuk filter atau dropdown) */
export function useCashiers() {
  return useQuery({
    queryKey: userKeys.cashiers,
    queryFn: getCashiers,
  });
}
