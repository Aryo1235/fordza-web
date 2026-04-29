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

// Mendapatkan tanggal harian yang dinormalisasi ke 00:00 WIB untuk kunci Summary Table
function getTodayWib() {
  const now = new Date();
  // Geser ke WIB (+7) lalu potong jamnya menjadi 00:00:00
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return new Date(Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate(), 0, 0, 0, 0));
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
          select: { color: true, variantCode: true, basePrice: true, productId: true, product: { select: { name: true, productCode: true } } },
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
    shiftId?: string;
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
      promoName?: string | null;
      comparisonPriceAtSale?: number | null;
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
          shiftId: data.shiftId,
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
              promoName: i.promoName ?? null,
              comparisonPriceAtSale: i.comparisonPriceAtSale ?? null,
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

            // LANGKAH 3: SINKRONISASI SUMMARY TABLE (per SKU)
            await tx.skuSalesSummary.upsert({
              where: {
                date_productId_variantColor_skuSize: {
                  date: getTodayWib(),
                  productId: i.productId,
                  variantColor: i.variantColor || "-",
                  skuSize: i.skuSize || "-",
                },
              },
              update: {
                totalQty: { increment: i.quantity },
                totalRevenue: { increment: (Number(i.priceAtSale) * i.quantity) - Number(i.discountAmount ?? 0) },
                totalOrders: { increment: 1 },
              },
              create: {
                date: getTodayWib(),
                skuId: i.skuId,
                productId: i.productId,
                productName: i.productName,
                productCode: i.productCode || "-",
                variantColor: i.variantColor || "-",
                skuSize: i.skuSize || "-",
                totalQty: i.quantity,
                totalRevenue: (Number(i.priceAtSale) * i.quantity) - Number(i.discountAmount ?? 0),
                totalOrders: 1,
              },
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
      // Ambil info transaksi asli + items untuk mendapatkan tanggal dan harga jual asli
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: { items: true },
      });
      if (!transaction) throw new Error("Transaksi tidak ditemukan");

      // Normalisasi tanggal transaksi asli ke 00:00 WIB
      const trxDate = new Date(transaction.createdAt.getTime() + 7 * 60 * 60 * 1000);
      const normalizedTrxDate = new Date(Date.UTC(trxDate.getUTCFullYear(), trxDate.getUTCMonth(), trxDate.getUTCDate(), 0, 0, 0, 0));

      await tx.transaction.update({
        where: { id: transactionId },
        data: { status: "VOID", cancelReason },
      });
      await Promise.all(
        items.map(async (i) => {
          const originalItem = transaction.items.find(item => item.productId === i.productId && (i.skuId ? item.skuId === i.skuId : true));
          const priceAtSale = originalItem?.priceAtSale || 0;

          if (i.skuId) {
            // Produk DENGAN varian: kembalikan stok ke SKU
            const updatedSku = await tx.productSku.update({
              where: { id: i.skuId },
              data: { stock: { increment: i.quantity } },
            });

            // KURANGI NILAI DI SUMMARY TABLE (untuk tanggal transaksi asli)
            await tx.skuSalesSummary.updateMany({
              where: {
                date: normalizedTrxDate,
                productId: i.productId,
                variantColor: i.variantColor || "-",
                skuSize: i.skuSize || "-",
              },
              data: {
                totalQty: { decrement: i.quantity },
                totalRevenue: { decrement: Number(priceAtSale) * i.quantity },
                totalOrders: { decrement: 1 },
              },
            });

            // PEMBERSIH OTOMATIS: Jika total harian nol, hapus barisnya dari Summary
            await tx.skuSalesSummary.deleteMany({
              where: {
                date: normalizedTrxDate,
                productId: i.productId,
                variantColor: i.variantColor || "-",
                skuSize: i.skuSize || "-",
                totalQty: { lte: 0 },
              },
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

            // KURANGI NILAI DI SUMMARY TABLE (untuk tanggal transaksi asli - produk tanpa varian)
            await tx.skuSalesSummary.updateMany({
              where: {
                date: normalizedTrxDate,
                productId: i.productId,
                variantColor: "-",
                skuSize: "-",
              },
              data: {
                totalQty: { decrement: i.quantity },
                totalRevenue: { decrement: Number(priceAtSale) * i.quantity },
                totalOrders: { decrement: 1 },
              },
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
    // Normalisasi input tanggal dengan validasi cadangan (Fallback)
    let startWib = new Date(dateFrom);
    if (isNaN(startWib.getTime())) startWib = new Date();
    startWib.setUTCHours(0, 0, 0, 0);

    let endWib = new Date(dateTo);
    if (isNaN(endWib.getTime())) endWib = new Date();
    endWib.setUTCHours(0, 0, 0, 0);

    // 1. Ambil semua ringkasan dalam rentang tersebut dengan relasi SKU
    const summaries = await prisma.skuSalesSummary.findMany({
      where: {
        date: { gte: startWib, lte: endWib },
      },
      include: {
        product: true,
        sku: {
          include: {
            variant: true,
          },
        },
      },
      orderBy: { date: "asc" },
    });
    // 2. Agregasi Global
    let totalRevenue = 0;
    let totalOrders = 0;
    const productAggregation: Record<string, any> = {};
    const dailyAggregation: Record<string, number> = {};

    summaries.forEach((s: any) => {
      // Penjualan Global
      totalRevenue += Number(s.totalRevenue);
      totalOrders += s.totalOrders;

      // Agregasi Produk (untuk tabel top products)
      const key = `${s.productName}-${s.variantColor}-${s.skuSize}`;
      if (!productAggregation[key]) {
        productAggregation[key] = {
          name: s.productName,
          code: s.product?.productCode || "-",
          variantCode: s.sku?.variant?.variantCode || "-",
          color: s.variantColor || "-",
          size: s.skuSize || "-",
          quantity: 0,
          revenue: 0,
        };
      }
      productAggregation[key].quantity += s.totalQty;
      productAggregation[key].revenue += Number(s.totalRevenue);

      // Agregasi Harian (untuk grafik)
      const dateStr = s.date.toISOString();
      dailyAggregation[dateStr] = (dailyAggregation[dateStr] || 0) + Number(s.totalRevenue);
    });

    const aggregatedProducts = Object.values(productAggregation)
      .map(p => ({
        ...p,
        priceAtSale: p.quantity > 0 ? p.revenue / p.quantity : 0
      }))
      .filter(p => p.quantity > 0) // Sembunyikan produk yang sudah di-VOID habis
      .sort((a, b) => b.quantity - a.quantity);

    const dailySales = Object.entries(dailyAggregation).map(([date, revenue]) => ({
      createdAt: new Date(date),
      totalPrice: revenue,
    }));

    return {
      revenue: totalRevenue,
      orderCount: totalOrders,
      soldProducts: aggregatedProducts,
      dailySales: dailySales,
    };
  },
};
