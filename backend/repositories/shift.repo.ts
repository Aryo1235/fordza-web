import { prisma } from "@/lib/prisma";

export const ShiftRepository = {
  async create(data: { adminId: string; startingCash: number; notes?: string }) {
    return await prisma.cashierShift.create({
      data: {
        adminId: data.adminId,
        startingCash: data.startingCash,
        status: "OPEN",
        notes: data.notes
      }
    });
  },

  async findOpenShiftByAdmin(adminId: string) {
    return await prisma.cashierShift.findFirst({
      where: {
        adminId,
        status: "OPEN"
      },
      include: {
        // Tarik juga transaksi yang sudah terjadi hari ini untuk dikalkulasi
        transactions: true 
      }
    });
  },

  async closeShift(id: string, data: { expectedEndingCash: number, actualEndingCash: number }) {
    return await prisma.cashierShift.update({
      where: { id },
      data: {
        status: "CLOSED",
        endTime: new Date(),
        expectedEndingCash: data.expectedEndingCash,
        actualEndingCash: data.actualEndingCash,
      }
    });
  },

  async findById(id: string) {
    return await prisma.cashierShift.findUnique({
      where: { id },
      include: { transactions: true }
    });
  },

  async getAllShifts() {
    return await prisma.cashierShift.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        admin: {
          select: { name: true, username: true }
        },
        _count: {
          select: { transactions: true }
        }
      }
    });
  }
};
