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

  // Ambil semua produk yang ID-nya ada di keranjang (untuk validasi produk tanpa varian)
  async findProductsByIds(productIds: string[]) {
    return await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        variants: {
          where: { isActive: true },
          include: { skus: { where: { isActive: true } } },
        },
      },
    });
  },

  // Ambil SKU berdasarkan ID (untuk validasi stok di Service)
  async findSkusByIds(skuIds: string[]) {
    return await prisma.productSku.findMany({
      where: { id: { in: skuIds } },
      include: {
        variant: {
          select: { color: true, basePrice: true, productId: true, product: { select: { name: true, productCode: true } } },
        },
      },
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
      // Varian & SKU (null jika produk tanpa varian)
      variantId?: string | null;
      variantColor?: string | null;
      skuId?: string | null;
      skuSize?: string | null;
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
              variantId: i.variantId ?? null,
              variantColor: i.variantColor ?? null,
              skuId: i.skuId ?? null,
              skuSize: i.skuSize ?? null,
            })),
          },
        },
        include: {
          items: true,
          kasir: { select: { name: true, username: true } },
        },
      });

      // LANGKAH 2: Kurangi stok — per SKU jika ada varian, per Product jika tidak
      await Promise.all(
        data.items.map(async (i) => {
          if (i.skuId) {
            // Produk DENGAN varian: kurangi stok di ProductSku
            const updatedSku = await tx.productSku.update({
              where: { id: i.skuId },
              data: { stock: { decrement: i.quantity } },
            });

            // Catat SKU Stock Log
            await tx.skuStockLog.create({
              data: {
                skuId: i.skuId,
                delta: -i.quantity,
                currentStock: updatedSku.stock,
                size: i.skuSize || "-",
                color: i.variantColor || "-",
                type: "SALE",
                notes: `Penjualan Invoice ${data.invoiceNo}`,
                operatorId: data.kasirId,
              },
            });

            // Rekalkulasi cached stock di Product induk
            const totalStock = await tx.productSku.aggregate({
              where: { variant: { productId: i.productId } },
              _sum: { stock: true },
            });
            await tx.product.update({
              where: { id: i.productId },
              data: { stock: totalStock._sum.stock ?? 0 },
            });

            // Dual-Logging: Catat juga ke Stock Log level Produk (Master Log)
            await tx.stockLog.create({
              data: {
                productId: i.productId,
                delta: -i.quantity,
                currentStock: totalStock._sum.stock ?? 0,
                type: "SALE",
                notes: `Penjualan Invoice ${data.invoiceNo} (${i.variantColor} - Size ${i.skuSize})`,
                operatorId: data.kasirId,
              },
            });
          } else {
            // Produk TANPA varian: kurangi stok langsung di Product
            const updatedProduct = await tx.product.update({
              where: { id: i.productId },
              data: { stock: { decrement: i.quantity } },
            });

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
          }
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
            // SKU snapshot
            variantColor: true,
            skuSize: true,
            skuId: true,
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
    items: { productId: string; quantity: number; skuId?: string | null; skuSize?: string | null; variantColor?: string | null }[],
    cancelReason: string,
    operatorId?: string,
  ) {
    return await prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id: transactionId },
        data: { status: "VOID", cancelReason },
      });

      await Promise.all(
        items.map(async (i) => {
          if (i.skuId) {
            // Produk DENGAN varian: kembalikan stok ke SKU
            const updatedSku = await tx.productSku.update({
              where: { id: i.skuId },
              data: { stock: { increment: i.quantity } },
            });

            await tx.skuStockLog.create({
              data: {
                skuId: i.skuId,
                delta: i.quantity,
                currentStock: updatedSku.stock,
                size: i.skuSize || "-",
                color: i.variantColor || "-",
                type: "VOID",
                notes: `Void Transaksi ID: ${transactionId}. Alasan: ${cancelReason}`,
                operatorId: operatorId || null,
              },
            });

            // Rekalkulasi cached stock
            const totalStock = await tx.productSku.aggregate({
              where: { variant: { productId: i.productId } },
              _sum: { stock: true },
            });
            await tx.product.update({
              where: { id: i.productId },
              data: { stock: totalStock._sum.stock ?? 0 },
            });

            // Dual-Logging: Catat juga ke Stock Log level Produk (Master Log)
            await tx.stockLog.create({
              data: {
                productId: i.productId,
                delta: i.quantity,
                currentStock: totalStock._sum.stock ?? 0,
                type: "VOID",
                notes: `Void Transaksi ID: ${transactionId} (${i.variantColor} - Size ${i.skuSize})`,
                operatorId: operatorId || null,
              },
            });
          } else {
            // Produk TANPA varian: kembalikan stok ke Product
            const updatedProduct = await tx.product.update({
              where: { id: i.productId },
              data: { stock: { increment: i.quantity } },
            });

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
          }
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

    // Agregasi per nama produk + variant (agar beda warna/ukuran tampil terpisah)
    const productAggregation: Record<string, any> = {};
    (rawItems || []).forEach((item: any) => {
      // Key unik: pakai skuId jika ada, fallback ke productId
      const key = item.skuId ?? item.productId;
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
      productAggregation[key].revenue += Number(item.priceAtSale) * item.quantity;
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
