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
      include: {
        admin: {
          select: { name: true, username: true }
        },
        transactions: {
          orderBy: { createdAt: "desc" }
        }
      }
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
  },

  async getAllShiftsPaginated(filters: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    kasirId?: string;
  }) {
    const { page, limit, search, status, kasirId } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (kasirId && kasirId !== "ALL") {
      where.adminId = kasirId;
    }

    if (search) {
      where.admin = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { username: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const [shifts, totalItems] = await Promise.all([
      prisma.cashierShift.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          admin: {
            select: { name: true, username: true }
          },
          _count: {
            select: { transactions: true }
          },
          transactions: {
            select: {
              status: true,
              totalPrice: true,
              paymentMethod: true,
            }
          }
        },
        skip,
        take: limit,
      }),
      prisma.cashierShift.count({ where }),
    ]);

    return {
      shifts,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    };
  },

  async getShiftsStats() {
    // 1. Get count by status
    const [totalActive, totalClosed] = await Promise.all([
      prisma.cashierShift.count({ where: { status: "OPEN" } }),
      prisma.cashierShift.count({ where: { status: "CLOSED" } }),
    ]);

    // 2. Get all closed shifts for calculation of actual cash and disparity
    const closedShifts = await prisma.cashierShift.findMany({
      where: { status: "CLOSED" },
      select: {
        startingCash: true,
        expectedEndingCash: true,
        actualEndingCash: true,
      }
    });

    let totalStartingCash = 0;
    let totalActualCash = 0;
    let totalMinusCases = 0;
    let totalMinusAmount = 0;

    closedShifts.forEach((s) => {
      const start = Number(s.startingCash || 0);
      const expected = Number(s.expectedEndingCash || 0);
      const actual = Number(s.actualEndingCash || 0);
      
      totalStartingCash += start;
      totalActualCash += actual;

      const diff = actual - expected;
      if (diff < 0) {
        totalMinusCases += 1;
        totalMinusAmount += Math.abs(diff);
      }
    });

    return {
      totalActiveShifts: totalActive,
      totalClosedShifts: totalClosed,
      totalStartingCash,
      totalActualCash,
      totalMinusCases,
      totalMinusAmount,
    };
  }
};
