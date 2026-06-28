/**
 * Transaction Service (Kasir)
 * ─────────────────────────────────────────────
 * LAYER 2 — BUSINESS LOGIC
 *
 * INI adalah inti otak dari sistem POS Fordza.
 * Semua keputusan bisnis ada di sini sebelum menyentuh database:
 *
 * 1. Apakah kasir sudah login? (validasi session)
 * 2. Apakah keranjang tidak kosong?
 * 3. Apakah setiap produk ada di database?
 * 4. Apakah stok setiap produk mencukupi?
 * 5. Apakah uang yang dibayar cukup?
 * 6. Generate nomor invoice yang unik
 * 7. Baru setelah SEMUA lulus → suruh Repository eksekusi
 *
 * Repository tidak pernah tahu soal validasi stok atau kembalian.
 * Tugas Repository hanya: "simpan ini ke database".
 */

import { TransactionRepository } from "@/backend/repositories/transaction.repo";
import { AdminService } from "@/backend/services/admin.service";
import { ShiftRepository } from "@/backend/repositories/shift.repo";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/error-handler";

const DISCOUNT_AUTH_THRESHOLD = 300000;

export const TransactionService = {
  /**
   * Proses checkout kasir.
   *
   * Di sinilah LOGIC BISNIS POS berjalan:
   * - Validasi stok tiap produk
   * - Hitung total harga
   * - Hitung kembalian
   * - Generate nomor invoice harian (FDZ-YYYYMMDD-XXXX)
   */
  async checkout(data: {
    kasirId: string;
    items: {
      productId: string;
      quantity: number;
      discountAmount?: number;
      variantId?: string | null;
      skuId?: string | null;
      promoName?: string | null;
      gimmickPriceAtSale?: number | null;
    }[];
    amountPaid: number;
    customerName?: string;
    customerPhone?: string;
    adminPin?: string;
    paymentMethod?: string;
  }) {
    const {
      kasirId,
      items,
      amountPaid,
      customerName,
      customerPhone,
      adminPin,
      paymentMethod,
    } = data;

    // ✅ KEPUTUSAN BISNIS #1: Pisahkan item SKU-based dan product-based
    const skuIds = items.filter((i) => i.skuId).map((i) => i.skuId as string);
    const productIds = items.map((i) => i.productId);

    const [dbProducts, dbSkus] = await Promise.all([
      TransactionRepository.findProductsByIds(productIds),
      skuIds.length > 0
        ? TransactionRepository.findSkusByIds(skuIds)
        : Promise.resolve([]),
    ]);

    // ✅ KEPUTUSAN BISNIS #2: Validasi stok & hitung total
    // STEP 1: Hitung subtotal dulu (tanpa discount) untuk cek minPurchase
    let subtotalBeforeDiscount = 0;
    
    for (const item of items) {
      const dbProduct = dbProducts.find((p) => p.id === item.productId);
      if (!dbProduct) throw new AppError(`Produk tidak ditemukan: ${item.productId}`, 404, "NOT_FOUND");

      let price: number;
      if (item.skuId) {
        const dbSku = dbSkus.find((s) => s.id === item.skuId);
        if (!dbSku) throw new AppError(`SKU tidak ditemukan: ${item.skuId}`, 404, "NOT_FOUND");
        price = Number(dbSku.priceOverride ?? dbSku.variant.basePrice);
      } else {
        price = Number(dbProduct.price ?? 0);
      }
      
      subtotalBeforeDiscount += price * item.quantity;
    }

    // STEP 2: Get active promos untuk re-calculate discount
    const { PromoRepository } = await import("@/backend/repositories/promo.repo");
    const activePromos = await PromoRepository.getActive();

    // STEP 3: Validasi stok & hitung total dengan discount yang di-calculate ulang
    let totalPrice = 0;
    const validatedItems: {
      productId: string;
      productCode: string;
      quantity: number;
      basePriceAtSale: number;
      productName: string;
      discountAmount: number;
      variantId?: string | null;
      variantColor?: string | null;
      skuId?: string | null;
      skuSize?: string | null;
      promoName?: string | null;
      gimmickPriceAtSale?: number | null;
    }[] = [];

    let totalDiscount = 0;
    for (const item of items) {
      const dbProduct = dbProducts.find((p) => p.id === item.productId);
      if (!dbProduct)
        throw new AppError(`Produk tidak ditemukan: ${item.productId}`, 404, "NOT_FOUND");

      if (item.quantity <= 0)
        throw new AppError(`Jumlah produk untuk ${dbProduct.name} tidak valid`, 400, "BAD_REQUEST");

      let price: number;
      let actualStock: number;
      let variantId: string | null = null;
      let variantColor: string | null = null;
      let skuId: string | null = null;
      let skuSize: string | null = null;

      if (item.skuId) {
        // Produk DENGAN varian + SKU
        const dbSku = dbSkus.find((s) => s.id === item.skuId);
        if (!dbSku) throw new AppError(`SKU tidak ditemukan: ${item.skuId}`, 404, "NOT_FOUND");

        actualStock = dbSku.stock;
        price = Number(dbSku.priceOverride ?? dbSku.variant.basePrice);
        variantId = dbSku.variantId;
        variantColor = dbSku.variant.color;
        skuId = dbSku.id;
        skuSize = dbSku.size;
      } else {
        // Produk TANPA varian: gunakan product.stock langsung
        actualStock = dbProduct.stock;
        price = Number(dbProduct.price ?? 0);
      }

      // ✅ Validasi stok
      if (actualStock < item.quantity) {
        const label = skuSize
          ? `${dbProduct.name} (${variantColor} / Size ${skuSize})`
          : dbProduct.name;
        throw new AppError(`Stok ${label} tidak cukup (tersisa ${actualStock})`, 400, "BAD_REQUEST");
      }

      const itemSubtotal = price * item.quantity;
      
      // ✅ FIX: IGNORE discountAmount dari frontend, hitung ulang berdasarkan promo
      let discount = 0;
      let promoName: string | null = null;
      
      // Cari promo terbaik (hierarchy: VARIANT → PRODUCT → CATEGORY → GLOBAL)
      let bestPromo: any = activePromos.find(
        (promo) => promo.targetType === "VARIANT" && item.variantId && promo.targetIds.includes(item.variantId)
      );
      if (!bestPromo) {
        bestPromo = activePromos.find(
          (promo) => promo.targetType === "PRODUCT" && promo.targetIds.includes(item.productId)
        );
      }
      if (!bestPromo) {
        // Gunakan data categories dari dbProduct yang sudah di-fetch di awal (tidak ada query DB tambahan)
        const categoryIds = dbProduct.categories?.map((c: any) => c.categoryId) || [];
        
        bestPromo = activePromos.find(
          (promo) => promo.targetType === "CATEGORY" && promo.targetIds.some(id => categoryIds.includes(id))
        );
      }
      if (!bestPromo) {
        bestPromo = activePromos.find((promo) => promo.targetType === "GLOBAL");
      }
      
      // Hitung discount jika ada promo
      if (bestPromo) {
        const minPurchase = Number(bestPromo.minPurchase || 0);
        
        // Cek apakah memenuhi minPurchase
        if (minPurchase === 0 || subtotalBeforeDiscount >= minPurchase) {
          // Apply promo
          if (bestPromo.type === "PERCENTAGE") {
            discount = (price * Number(bestPromo.value)) / 100 * item.quantity;
          } else {
            // FIXED promo
            if (minPurchase > 0) {
              // Conditional FIXED promo: flat discount, do NOT multiply by quantity!
              discount = Number(bestPromo.value);
            } else {
              // Non-conditional FIXED promo: per-item discount, multiply by quantity!
              discount = Number(bestPromo.value) * item.quantity;
            }
          }
          promoName = bestPromo.name;
        }
      }

      // Validasi discount tidak boleh lebih besar dari subtotal
      discount = Math.min(discount, itemSubtotal);

      totalPrice += itemSubtotal - discount;
      totalDiscount += discount;

      validatedItems.push({
        productId: item.productId,
        productCode: item.skuId 
          ? dbSkus.find(s => s.id === item.skuId)?.variant.variantCode || dbProduct.productCode || "-"
          : dbProduct.productCode || "-",
        quantity: item.quantity,
        basePriceAtSale: price,
        productName: dbProduct.name,
        discountAmount: discount,
        variantId,
        variantColor,
        skuId,
        skuSize,
        promoName,
        gimmickPriceAtSale: item.gimmickPriceAtSale,
      });
    }

    if (totalDiscount > DISCOUNT_AUTH_THRESHOLD) {
      if (!adminPin) {
        throw new AppError("Diskon besar membutuhkan otorisasi PIN Admin", 401, "UNAUTHORIZED");
      }

      const authorizedAdmin = await AdminService.verifyAdminPin(adminPin);
      if (!authorizedAdmin) {
        throw new AppError("PIN Admin salah atau tidak memiliki akses", 401, "UNAUTHORIZED");
      }
    }

    // ✅ KEPUTUSAN BISNIS #4: Uang yang dibayar harus >= total belanja
    const method = paymentMethod || "CASH";
    if (!["CASH", "DEBIT", "QRIS"].includes(method)) {
      throw new AppError("Metode pembayaran tidak valid", 400, "BAD_REQUEST");
    }

    let finalAmountPaid = amountPaid;
    let change = 0;

    if (method === "CASH") {
      if (amountPaid < totalPrice) {
        throw new AppError(
          `Nominal pembayaran (Rp ${amountPaid.toLocaleString("id-ID")}) kurang dari total belanja (Rp ${totalPrice.toLocaleString("id-ID")})`,
          400,
          "BAD_REQUEST"
        );
      }
      change = amountPaid - totalPrice;
    } else {
      // Untuk Debit & QRIS, uang diterima pas sebesar total belanja dan kembalian 0
      finalAmountPaid = totalPrice;
      change = 0;
    }

    // ✅ KEPUTUSAN BISNIS #5: Pastikan Kasir Memiliki Laci Shift yang Aktif
    const currentShift = await ShiftRepository.findOpenShiftByAdmin(kasirId);
    if (!currentShift) {
        throw new AppError("Laci Kasir belum dibuka! Silakan muat ulang dan masukkan Modal Awal terlebih dahulu.", 400, "BAD_REQUEST");
    }

    // ✅ KEPUTUSAN BISNIS #6: Generate nomor invoice unik harian
    const invoiceNo = await this.generateInvoiceNo();

    // ✅ Semua validasi lulus → serahkan ke Repository untuk disimpan
    return await TransactionRepository.createWithStockDecrement({
      invoiceNo,
      totalPrice,
      amountPaid: finalAmountPaid,
      change,
      kasirId,
      shiftId: currentShift.id,
      customerName,
      customerPhone,
      paymentMethod: method,
      items: validatedItems,
    });
  },

  /**
   * Generate nomor invoice unik berdasarkan tanggal + urutan hari ini.
   * Contoh output: "FDZ-20260409-0001"
   *
   * Logic ini ada di SERVICE (bukan Repository) karena ini adalah
   * aturan bisnis tentang FORMAT nomor faktur, bukan sekadar kueri DB.
   */
  async generateInvoiceNo(): Promise<string> {
    const now = new Date();
    // Offset +7 jam untuk WIB
    const wibDate = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const datePart = wibDate.toISOString().slice(0, 10).replace(/-/g, "");

    // Minta Repository hitung berapa transaksi sudah ada hari ini
    const count = await TransactionRepository.countToday();
    const sequence = String(count + 1).padStart(4, "0");

    // Tambahkan 3 karakter random di akhir untuk menjamin keunikan (Unique Constraint Guard)
    const randomSuffix = Math.random()
      .toString(36)
      .substring(2, 5)
      .toUpperCase();

    return `FDZ-${datePart}-${sequence}-${randomSuffix}`;
  },

  async getAll(filters: {
    page: number;
    limit: number;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    kasirId?: string;
  }) {
    const { transactions, total } = await TransactionRepository.getAll(filters);

    // 🧠 Transformasi data: Prisma Decimal → JavaScript Number
    // (agar tidak error saat JSON.stringify di Route Handler)
    return {
      transactions: transactions.map((t: any) => ({
        ...t,
        totalPrice: Number(t.totalPrice),
        amountPaid: Number(t.amountPaid),
        change: Number(t.change),
        cashier: t.kasir?.name || t.kasir?.username || "Sistem",
      })),
      total,
    };
  },

  async getExportAll(filters: {
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    kasirId?: string;
  }) {
    const transactions = await TransactionRepository.getExportAll(filters);

    return transactions.map((t: any) => ({
      id: t.id,
      invoiceNo: t.invoiceNo,
      totalPrice: Number(t.totalPrice),
      amountPaid: Number(t.amountPaid),
      change: Number(t.change),
      status: t.status,
      paymentMethod: t.paymentMethod,
      notes: t.notes,
      cancelReason: t.cancelReason,
      createdAt: t.createdAt.toISOString(),
      customerName: t.customerName,
      customerPhone: t.customerPhone,
      kasir: t.kasir
        ? {
            name: t.kasir.name,
            username: t.kasir.username,
            role: t.kasir.role,
          }
        : null,
      items: (t.items || []).map((i: any) => ({
        productId: i.productId,
        productName: i.productName,
        productCode: i.productCode,
        quantity: i.quantity,
        basePriceAtSale: Number(i.basePriceAtSale),
        discountAmount: Number(i.discountAmount),
        variantColor: i.variantColor,
        skuSize: i.skuSize,
      })),
    }));
  },

  async getById(id: string) {
    const transaction = await TransactionRepository.findById(id);
    if (!transaction) return null;

    // 🧠 Transformasi Decimal → Number & Pastikan struktur bersih agar aman diserialisasi ke JSON
    return {
      id: transaction.id,
      invoiceNo: transaction.invoiceNo,
      totalPrice: Number(transaction.totalPrice),
      amountPaid: Number(transaction.amountPaid),
      change: Number(transaction.change),
      status: transaction.status,
      paymentMethod: transaction.paymentMethod,
      notes: transaction.notes,
      cancelReason: transaction.cancelReason,
      createdAt: transaction.createdAt.toISOString(),
      customerName: transaction.customerName,
      customerPhone: transaction.customerPhone,
      kasir: transaction.kasir
        ? {
            name: transaction.kasir.name,
            username: transaction.kasir.username,
            role: transaction.kasir.role,
          }
        : null,
      items: (transaction.items || []).map((i) => ({
        id: i.id,
        productId: i.productId,
        productName: i.productName,
        productCode: i.productCode,
        quantity: i.quantity,
        basePriceAtSale: Number(i.basePriceAtSale),
        discountAmount: Number(i.discountAmount),
        variantColor: i.variantColor,
        skuSize: i.skuSize,
      })),
    };
  },

  /**
   * VOID transaksi — hanya bisa dilakukan Admin.
   *
   * ✅ KEPUTUSAN BISNIS:
   * - Transaksi yang sudah VOID tidak boleh di-VOID lagi
   * - Stok WAJIB dikembalikan saat transaksi dibatalkan
   */
  async voidTransaction(id: string, cancelReason: string, operatorId?: string) {
    const transaction = await TransactionRepository.findById(id);

    if (!transaction) {
      throw new AppError("Transaksi tidak ditemukan", 404, "NOT_FOUND");
    }

    // ✅ Validasi bisnis: tidak boleh void transaksi yang sudah void
    if (transaction.status === "VOID") {
      throw new AppError("Transaksi sudah berstatus VOID", 400, "BAD_REQUEST");
    }

    const items = await TransactionRepository.findItemsByTransactionId(id);

    // Serahkan ke Repository untuk proses VOID + kembalikan stok secara atomik
    await TransactionRepository.voidWithStockRestore(
      id,
      items.map((i) => ({
        productId: i.productId!,
        quantity: i.quantity,
        skuId: i.skuId ?? null,
        skuSize: i.skuSize ?? null,
        variantColor: i.variantColor ?? null,
      })),
      cancelReason,
      operatorId,
    );

    return { voided: true };
  },
};
