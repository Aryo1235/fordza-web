/**
 * Admin Repository
 * ─────────────────────────────────────────────
 * LAYER 1 — DATA ACCESS ONLY
 *
 * Hanya menangani kueri CRUD ke tabel "Admin".
 * TIDAK ada logic pengecekan password di sini
 * (verifikasi bcrypt → itu urusan AuthService/AdminService).
 */

import { prisma } from "@/lib/prisma";
import { Role } from "@/app/generated/prisma/client";

export const AdminRepository = {
  async findByUsername(username: string) {
    // Mengambil seluruh data termasuk password (untuk proses verifikasi di Service)
    return await prisma.admin.findFirst({ where: { username, deletedAt: null } });
  },

  async findById(id: string) {
    return await prisma.admin.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
        // JANGAN pilih password — kolom sensitif tidak dikembalikan
      },
    });
  },

  async create(data: { username: string; password: string; name?: string; role?: Role; pin?: string }) {
    return await prisma.admin.create({
      data: {
        username: data.username,
        password: data.password, // Password sudah di-hash SEBELUM masuk repo ini
        name: data.name,
        role: data.role || "KASIR",
        pin: data.pin,
      },
    });
  },

  async findAllCashiers() {
    return await prisma.admin.findMany({
      where: { role: "KASIR", deletedAt: null },
      select: {
        id: true,
        name: true,
        username: true,
      },
      orderBy: { name: "asc" },
    });
  },

  async findAdminPinCandidates() {
    return await prisma.admin.findMany({
      where: { role: "ADMIN", pin: { not: null }, deletedAt: null },
      select: {
        id: true,
        name: true,
        username: true,
        pin: true,
      },
    });
  },

  async findAll() {
    const users = await prisma.admin.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
        pin: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return users.map(user => {
      const { pin, ...rest } = user;
      return {
        ...rest,
        hasPin: !!pin,
      };
    });
  },

  async update(id: string, data: { username?: string; password?: string; name?: string; role?: Role; pin?: string }) {
    return await prisma.admin.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    return await prisma.admin.update({ where: { id }, data: { deletedAt: new Date() } });
  },
};
