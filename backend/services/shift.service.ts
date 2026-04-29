import { ShiftRepository } from "@/backend/repositories/shift.repo";

export const ShiftService = {
  async openShift(adminId: string, startingCash: number, notes?: string) {
    // 1. Validasi: Jangan izinkan buka laci baru jika laci lama belum ditutup
    const existingOpenShift = await ShiftRepository.findOpenShiftByAdmin(adminId);
    
    if (existingOpenShift) {
      throw new Error("Kasir ini masih memiliki shift yang terbuka. Harap tutup shift sebelumnya.");
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
        throw new Error("Tidak ada shift aktif yang ditemukan. Anda belum membuka shift.");
    }

    // 2. Kalkulasi Sistem (Expected Cash) = Modal Awal + Total Hasil Penjualan
    // (Berdasarkan teori yang baru kita pelajari lewat Socratic-Doc)
    let totalSales = 0;
    currentShift.transactions.forEach((trx: any) => {
        // Pastikan hanya Transaksi Berstatus PAID
        if (trx.status === "PAID") {
            // Uang riil yang diteirma toko adalah total harga final (karena amountPaid dikurangi change = totalPrice)
            totalSales += Number(trx.totalPrice); 
        }
    });

    const expectedEndingCash = Number(currentShift.startingCash) + totalSales;

    // 3. Simpan Penutupan Laci dengan bukti Audit (Termasuk jika ada indikasi Fraud / Selisih)
    return await ShiftRepository.closeShift(currentShift.id, {
        expectedEndingCash,
        actualEndingCash // (Uang fisik asli hasil ketikan kasir malam harinya)
    });
  }
};
