import { ShiftRepository } from "@/backend/repositories/shift.repo";
import { AppError } from "@/lib/error-handler";

export const ShiftService = {
  async openShift(adminId: string, startingCash: number, notes?: string) {
    // 1. Validasi: Jangan izinkan buka laci baru jika laci lama belum ditutup
    const existingOpenShift = await ShiftRepository.findOpenShiftByAdmin(adminId);
    
    if (existingOpenShift) {
      throw new AppError("Kasir ini masih memiliki shift yang terbuka. Harap tutup shift sebelumnya.", 409, "CONFLICT");
    }

    // 2. Eksekusi Pembukaan
    return await ShiftRepository.create({
      adminId,
      startingCash,
      notes
    });
  },

  async checkCurrentShift(adminId: string) {
    return await ShiftRepository.findOpenShiftByAdmin(adminId);
  },

  async closeShift(adminId: string, actualEndingCash: number) {
    // 1. Cari shift yang masih Open untuk Kasir tersebut
    const currentShift = await ShiftRepository.findOpenShiftByAdmin(adminId);
    
    if (!currentShift) {
        throw new AppError("Tidak ada shift aktif yang ditemukan. Anda belum membuka shift.", 400, "BAD_REQUEST");
    }

    // 2. Kalkulasi Sistem (Expected Cash) = Modal Awal + Total Penjualan TUNAI/CASH
    let totalCashSales = 0;
    currentShift.transactions.forEach((trx: any) => {
        // Pastikan hanya Transaksi Berstatus PAID dan berjenis CASH
        if (trx.status === "PAID" && (trx.paymentMethod === "CASH" || !trx.paymentMethod)) {
            totalCashSales += Number(trx.totalPrice); 
        }
    });

    const expectedEndingCash = Number(currentShift.startingCash) + totalCashSales;

    // 3. Simpan Penutupan Laci dengan bukti Audit (Termasuk jika ada indikasi Fraud / Selisih)
    return await ShiftRepository.closeShift(currentShift.id, {
        expectedEndingCash,
        actualEndingCash // (Uang fisik asli hasil ketikan kasir malam harinya)
    });
  },

  async getAllShiftsPaginated(filters: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    kasirId?: string;
  }) {
    const { shifts, totalItems, totalPages } = await ShiftRepository.getAllShiftsPaginated(filters);

    // Transform Decimal to JavaScript number for safety and calculate sales breakdown
    const formattedShifts = shifts.map((s: any) => {
      let cashSales = 0;
      let debitSales = 0;
      let qrisSales = 0;

      if (s.transactions) {
        s.transactions.forEach((t: any) => {
          if (t.status === "PAID") {
            const val = Number(t.totalPrice);
            if (t.paymentMethod === "DEBIT") {
              debitSales += val;
            } else if (t.paymentMethod === "QRIS") {
              qrisSales += val;
            } else {
              cashSales += val;
            }
          }
        });
      }

      const { transactions, ...rest } = s;

      return {
        ...rest,
        startingCash: Number(s.startingCash),
        expectedEndingCash: s.expectedEndingCash != null ? Number(s.expectedEndingCash) : null,
        actualEndingCash: s.actualEndingCash != null ? Number(s.actualEndingCash) : null,
        cashSales,
        debitSales,
        qrisSales,
      };
    });

    return {
      shifts: formattedShifts,
      meta: {
        totalItems,
        totalPage: totalPages,
        currentPage: filters.page,
        limit: filters.limit,
      }
    };
  },

  async getShiftById(id: string) {
    const shift = await ShiftRepository.findById(id);

    if (!shift) {
      throw new AppError("Data shift laci tidak ditemukan.", 404, "NOT_FOUND");
    }

    let cashSales = 0;
    let debitSales = 0;
    let qrisSales = 0;

    if (shift.transactions) {
      shift.transactions.forEach((t: any) => {
        if (t.status === "PAID") {
          const val = Number(t.totalPrice);
          if (t.paymentMethod === "DEBIT") {
            debitSales += val;
          } else if (t.paymentMethod === "QRIS") {
            qrisSales += val;
          } else {
            cashSales += val;
          }
        }
      });
    }

    const startingCashNum = Number(shift.startingCash);
    const expectedEndingCashNum = shift.expectedEndingCash != null
      ? Number(shift.expectedEndingCash)
      : startingCashNum + cashSales;

    return {
      ...shift,
      startingCash: startingCashNum,
      expectedEndingCash: expectedEndingCashNum,
      actualEndingCash: shift.actualEndingCash != null ? Number(shift.actualEndingCash) : null,
      cashSales,
      debitSales,
      qrisSales,
      transactions: shift.transactions.map((t: any) => ({
        ...t,
        totalPrice: Number(t.totalPrice),
        amountPaid: Number(t.amountPaid),
        change: Number(t.change),
      })),
    };
  },

  async getShiftsStats() {
    return await ShiftRepository.getShiftsStats();
  }
};
