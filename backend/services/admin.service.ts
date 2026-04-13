/**
 * Admin Service
 * ─────────────────────────────────────────────
 * LAYER 2 — BUSINESS LOGIC
 *
 * Contoh kasus bisnis yang ADA di sini:
 * Verifikasi password bcrypt dilakukan di SINI (bukan di Repo).
 * Repo hanya mengambil data dari DB.
 * Service yang memutuskan "apakah password cocok → boleh login atau tidak".
 */

import { AdminRepository } from "@/backend/repositories/admin.repo";
import { Role } from "@/app/generated/prisma/client";

export const AdminService = {
  async findByUsername(username: string) {
    // Ambil data admin lengkap (termasuk password hash) untuk proses login
    return await AdminRepository.findByUsername(username);
  },

  async findById(id: string) {
    // Ambil profil admin tanpa password (untuk endpoint /me)
    return await AdminRepository.findById(id);
  },

  async create(data: { username: string; password: string; name?: string; role?: Role; pin?: string }) {
    // Password WAJIB di-hash di Route Handler sebelum sampai di sini
    // Service ini tidak melakukan hashing (itu urusan controller)
    return await AdminRepository.create(data);
  },

  async getAllCashiers() {
    return await AdminRepository.findAllCashiers();
  },

  async getAllUsers() {
    return await AdminRepository.findAll();
  },

  async updateUser(id: string, data: { username?: string; password?: string; name?: string; role?: Role; pin?: string }) {
    // Note: Jika password diubah, pastikan sudah di-hash di controller
    return await AdminRepository.update(id, data);
  },

  async deleteUser(id: string) {
    return await AdminRepository.delete(id);
  },
};
