/**
 * Transaction Repository
 * ─────────────────────────────────────────────
 * LAYER 1 — DATA ACCESS ONLY
 *
 * Menangani semua kueri ke tabel Transaction & TransactionItem.
 *
 * CATATAN PENTING tentang prisma.$transaction di sini:
 * $transaction() bukan "logic bisnis", melainkan fitur database
 * untuk menjamin ACID (Atomicity). Ini tetap boleh ada di Repository
 * karena sifatnya adalah "cara menyimpan data" — jika 1 langkah gagal,
 * semua dibatalkan. Logika "apa yang disimpan?" tetap ada di Service.
 */

import { prisma } from "@/lib/prisma";
import { TransactionStatus } from "@/app/generated/prisma/client";

// Konversi tanggal lokal (YYYY-MM-DD, acuan WIB) ke rentang UTC agar stabil lintas timezone server.
function getWibDateRangeUtc(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const baseUtc = Date.UTC(year, month - 1, day, 0, 0, 0, 0);

  // WIB = UTC+7, jadi 00:00 WIB = H-1 17:00 UTC
  const startUtc = new Date(baseUtc - 7 * 60 * 60 * 1000);
  // 23:59:59.999 WIB = H 16:59:59.999 UTC
  const endUtc = new Date(
    baseUtc + (24 * 60 * 60 * 1000 - 1) - 7 * 60 * 60 * 1000,
  );

  return { startUtc, endUtc };
}

export const TransactionRepository = {
  // Hitung jumlah transaksi hari ini → untuk generate nomor invoice
  async countToday(): Promise<number> {
    const now = new Date();

    // 🇮🇩 Normalisasi WIB:
    // Kita ingin start/end of day dalam WIB lalu ditarik ke UTC untuk query.
    const wibNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);

    // Mencari batas 00:00 WIB hari ini dalam standar UTC
    const startOfDayUTC = new Date(wibNow);
    startOfDayUTC.setUTCHours(0 - 7, 0, 0, 0);

    // Mencari batas 23:59 WIB hari ini dalam standar UTC
    const endOfDayUTC = new Date(wibNow);
    endOfDayUTC.setUTCHours(23 - 7, 59, 59, 999);

    return await prisma.transaction.count({
      where: { createdAt: { gte: startOfDayUTC, lte: endOfDayUTC } },
    });
  },

  // Ambil semua produk yang ID-nya ada di keranjang (untuk validasi stok di Service)
  async findProductsByIds(productIds: string[]) {
    return await prisma.product.findMany({
      where: { id: { in: productIds } },
    });
  },

  // Simpan transaksi + item + kurangi stok dalam 1 operasi ACID
  async createWithStockDecrement(data: {
    invoiceNo: string;
    totalPrice: number;
    amountPaid: number;
    change: number;
    kasirId: string;
    customerName?: string;
    customerPhone?: string;
    items: {
      productId: string;
      productCode: string;
      quantity: number;
      priceAtSale: number;
      productName: string;
      discountAmount: number;
    }[];
  }) {
    return await prisma.$transaction(async (tx) => {
      // LANGKAH 1: Buat record transaksi + semua item-nya
      const newTransaction = await tx.transaction.create({
        data: {
          invoiceNo: data.invoiceNo,
          totalPrice: data.totalPrice,
          amountPaid: data.amountPaid,
          change: data.change,
          status: "PAID",
          kasirId: data.kasirId,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          items: {
            create: data.items.map((i) => ({
              productId: i.productId,
              productCode: i.productCode,
              quantity: i.quantity,
              priceAtSale: i.priceAtSale,
              productName: i.productName,
              discountAmount: i.discountAmount,
            })),
          },
        },
        include: {
          items: true,
          kasir: { select: { name: true, username: true } },
        },
      });

      // LANGKAH 2: Kurangi stok setiap produk & CATAT LOG secara paralel
      await Promise.all(
        data.items.map(async (i) => {
          // Update Stok
          const updatedProduct = await tx.product.update({
            where: { id: i.productId },
            data: { stock: { decrement: i.quantity } },
          });

          // Catat Stock Log (Ledger)
          await tx.stockLog.create({
            data: {
              productId: i.productId,
              delta: -i.quantity,
              currentStock: updatedProduct.stock,
              type: "SALE",
              notes: `Penjualan Invoice ${data.invoiceNo}`,
              operatorId: data.kasirId,
            },
          });
        }),
      );

      return newTransaction;
    });
  },

  async getAll(filters: {
    page: number;
    limit: number;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    kasirId?: string;
  }) {
    const { page, limit, search, dateFrom, dateTo, kasirId } = filters;
    const where: any = {};

    if (search) where.invoiceNo = { contains: search, mode: "insensitive" };
    if (kasirId) where.kasirId = kasirId;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        const { startUtc } = getWibDateRangeUtc(dateFrom);
        where.createdAt.gte = startUtc;
      }
      if (dateTo) {
        const { endUtc } = getWibDateRangeUtc(dateTo);
        where.createdAt.lte = endUtc;
      }
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          kasir: { select: { name: true, username: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return { transactions, total };
  },

  async getExportAll(filters: {
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    kasirId?: string;
  }) {
    const { search, dateFrom, dateTo, kasirId } = filters;
    const where: any = {};

    if (search) where.invoiceNo = { contains: search, mode: "insensitive" };
    if (kasirId) where.kasirId = kasirId;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        const { startUtc } = getWibDateRangeUtc(dateFrom);
        where.createdAt.gte = startUtc;
      }
      if (dateTo) {
        const { endUtc } = getWibDateRangeUtc(dateTo);
        where.createdAt.lte = endUtc;
      }
    }

    return await prisma.transaction.findMany({
      where,
      include: {
        kasir: { select: { name: true, username: true, role: true } },
        items: {
          select: {
            productId: true,
            productName: true,
            productCode: true,
            quantity: true,
            priceAtSale: true,
            discountAmount: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async findById(id: string) {
    return await prisma.transaction.findUnique({
      where: { id },
      include: {
        items: true,
        kasir: { select: { name: true, username: true, role: true } },
      },
    });
  },

  // Ambil semua item dalam transaksi → untuk keperluan VOID (kembalikan stok)
  async findItemsByTransactionId(transactionId: string) {
    return await prisma.transactionItem.findMany({ where: { transactionId } });
  },

  // Ubah status VOID + kembalikan stok dalam 1 operasi ACID
  async voidWithStockRestore(
    transactionId: string,
    items: { productId: string; quantity: number }[],
    cancelReason: string,
    operatorId?: string,
  ) {
    return await prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: "VOID",
          cancelReason,
        },
      });

      await Promise.all(
        items.map(async (i) => {
          // Update Stok
          const updatedProduct = await tx.product.update({
            where: { id: i.productId },
            data: { stock: { increment: i.quantity } },
          });

          // Catat Stock Log (Ledger)
          await tx.stockLog.create({
            data: {
              productId: i.productId,
              delta: i.quantity,
              currentStock: updatedProduct.stock,
              type: "VOID",
              notes: `Void Transaksi ID: ${transactionId}. Alasan: ${cancelReason}`,
              operatorId: operatorId || null,
            },
          });
        }),
      );
    });
  },

  // --- LAPORAN & STATISTIK ---
  async getReportStats(dateFrom: string, dateTo: string) {
    const { startUtc: start } = getWibDateRangeUtc(dateFrom);
    const { endUtc: end } = getWibDateRangeUtc(dateTo);

    const where = {
      status: "PAID",
      createdAt: { gte: start, lte: end },
    };

    const [summary, rawItems, dailySales] = await Promise.all([
      // 1. Total Pendapatan & Jumlah Transaksi
      prisma.transaction.aggregate({
        where: { ...where, status: "PAID" },
        _sum: { totalPrice: true },
        _count: { id: true },
      }),

      // 2. Data Produk Terjual (Detail untuk Audit)
      prisma.transactionItem.findMany({
        where: { transaction: { ...where, status: "PAID" } },
        select: {
          productId: true,
          productName: true,
          productCode: true,
          quantity: true,
          priceAtSale: true,
        },
      }),

      // 3. Penjualan Harian
      prisma.transaction.findMany({
        where: { ...where, status: "PAID" },
        select: { createdAt: true, totalPrice: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    // Agregasi Produk Terjual secara manual untuk mendukung perhitungan Harga * Qty
    const productAggregation: Record<string, any> = {};
    (rawItems || []).forEach((item: any) => {
      const key = item.productId;
      if (!productAggregation[key]) {
        productAggregation[key] = {
          name: item.productName,
          code: item.productCode || "-",
          quantity: 0,
          priceAtSale: Number(item.priceAtSale),
          revenue: 0,
        };
      }
      productAggregation[key].quantity += item.quantity;
      productAggregation[key].revenue +=
        Number(item.priceAtSale) * item.quantity;
    });

    const aggregatedProducts = Object.values(productAggregation).sort(
      (a, b) => b.quantity - a.quantity,
    );

    return {
      revenue: Number(summary?._sum?.totalPrice || 0),
      orderCount: summary?._count?.id || 0,
      soldProducts: aggregatedProducts,
      dailySales: (dailySales || []).map((s: any) => ({
        createdAt: s.createdAt,
        totalPrice: Number(s.totalPrice),
      })),
    };
  },
};
