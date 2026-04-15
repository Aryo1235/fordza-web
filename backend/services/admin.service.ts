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
import bcrypt from "bcryptjs";

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

  async verifyAdminPin(pin: string) {
    const trimmedPin = pin?.trim();
    if (!trimmedPin) return null;

    const candidates = await AdminRepository.findAdminPinCandidates();

    for (const admin of candidates) {
      if (!admin.pin) continue;

      // Backward compatible: tetap terima PIN plaintext lama jika belum dimigrasi.
      if (admin.pin === trimmedPin) {
        return { id: admin.id, name: admin.name, username: admin.username };
      }

      const isMatch = await bcrypt.compare(trimmedPin, admin.pin).catch(() => false);
      if (isMatch) {
        return { id: admin.id, name: admin.name, username: admin.username };
      }
    }

    return null;
  },

  async updateUser(id: string, data: { username?: string; password?: string; name?: string; role?: Role; pin?: string }) {
    // Note: Jika password diubah, pastikan sudah di-hash di controller
    return await AdminRepository.update(id, data);
  },

  async deleteUser(id: string) {
    return await AdminRepository.delete(id);
  },
};
