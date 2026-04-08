import { prisma } from "@/lib/prisma";

export const AdminService = {
  async findByUsername(username: string) {
    return await prisma.admin.findUnique({
      where: { username },
    });
  },

  async findById(id: string) {
    return await prisma.admin.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
        // JANGAN select password
      },
    });
  },

  async create(data: { username: string; password: string; name?: string }) {
    return await prisma.admin.create({
      data: {
        username: data.username,
        password: data.password, // Sudah di-hash sebelum masuk sini
        name: data.name,
      },
    });
  },
};
