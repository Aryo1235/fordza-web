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

    //  KEPUTUSAN BISNIS #1: Pisahkan item SKU-based dan product-based
    const skuIds = items.filter((i) => i.skuId).map((i) => i.skuId as string);
    const productIds = items.map((i) => i.productId);

    const [dbProducts, dbSkus] = await Promise.all([
      TransactionRepository.findProductsByIds(productIds),
      skuIds.length > 0
        ? TransactionRepository.findSkusByIds(skuIds)
        : Promise.resolve([]),
    ]);

    //  KEPUTUSAN BISNIS #2: Validasi stok & hitung total
    // ─────────────────────────────────────────────────────────────────────
    // STEP 1: Validasi produk & hitung subtotal kotor (tanpa diskon apapun)
    //         Digunakan sebagai basis untuk cek minPurchase promo.
    // ─────────────────────────────────────────────────────────────────────
    let subtotalBeforeDiscount = 0;
    const itemMeta: {
      item: typeof items[0];
      dbProduct: (typeof dbProducts)[0];
      dbSku: (typeof dbSkus)[0] | null;
      price: number;
      actualStock: number;
      variantId: string | null;
      variantColor: string | null;
      skuId: string | null;
      skuSize: string | null;
    }[] = [];

    for (const item of items) {
      const dbProduct = dbProducts.find((p) => p.id === item.productId);
      if (!dbProduct) throw new AppError(`Produk tidak ditemukan: ${item.productId}`, 404, "NOT_FOUND");

      if (item.quantity <= 0)
        throw new AppError(`Jumlah produk untuk ${dbProduct.name} tidak valid`, 400, "BAD_REQUEST");

      let price: number;
      let actualStock: number;
      let variantId: string | null = null;
      let variantColor: string | null = null;
      let skuId: string | null = null;
      let skuSize: string | null = null;
      let dbSku: (typeof dbSkus)[0] | null = null;

      if (item.skuId) {
        dbSku = dbSkus.find((s) => s.id === item.skuId) || null;
        if (!dbSku) throw new AppError(`SKU tidak ditemukan: ${item.skuId}`, 404, "NOT_FOUND");
        actualStock = dbSku.stock;
        price = Number(dbSku.priceOverride ?? dbSku.variant.basePrice);
        variantId = dbSku.variantId;
        variantColor = dbSku.variant.color;
        skuId = dbSku.id;
        skuSize = dbSku.size;
      } else {
        actualStock = dbProduct.stock;
        price = Number(dbProduct.price ?? 0);
      }

      // Validasi stok
      if (actualStock < item.quantity) {
        const label = skuSize
          ? `${dbProduct.name} (${variantColor} / Size ${skuSize})`
          : dbProduct.name;
        throw new AppError(`Stok ${label} tidak cukup (tersisa ${actualStock})`, 400, "BAD_REQUEST");
      }

      subtotalBeforeDiscount += price * item.quantity;
      itemMeta.push({ item, dbProduct, dbSku, price, actualStock, variantId, variantColor, skuId, skuSize });
    }

    // STEP 2: Ambil semua promo aktif
    const { PromoRepository } = await import("@/backend/repositories/promo.repo");
    const activePromos = await PromoRepository.getActive();

    // ─────────────────────────────────────────────────────────────────────
    // STEP 3: Identifikasi & Hitung diskon ITEM-LEVEL (VARIANT → PRODUCT → CATEGORY)
    // ─────────────────────────────────────────────────────────────────────
    const itemsWithPromo = itemMeta.map(({ item, dbProduct, dbSku, price, variantId, variantColor, skuId, skuSize }) => {
      const itemSubtotal = price * item.quantity;
      let bestPromo: any = null;

      // Hierarki seleksi promo level item (VARIANT → PRODUCT → CATEGORY)
      bestPromo = activePromos.find(
        (p) => p.targetType === "VARIANT" && item.variantId && p.targetIds.includes(item.variantId)
      );
      if (!bestPromo) {
        bestPromo = activePromos.find(
          (p) => p.targetType === "PRODUCT" && p.targetIds.includes(item.productId)
        );
      }
      if (!bestPromo) {
        const categoryIds = dbProduct.categories?.map((c: any) => c.categoryId) || [];
        bestPromo = activePromos.find(
          (p) => p.targetType === "CATEGORY" && p.targetIds.some((id: string) => categoryIds.includes(id))
        );
      }

      const isGlobalEligible = !bestPromo;

      return {
        item, dbProduct, dbSku, price, variantId, variantColor, skuId, skuSize,
        itemSubtotal,
        bestPromo,
        isGlobalEligible,
        discount: 0, // Akan dihitung di bawah
        promoName: bestPromo?.name || null,
        productCode: dbSku ? dbSku.variant.variantCode : dbProduct.productCode || "-",
        productName: dbProduct.name,
      };
    });

    // 3.1. Hitung promo PERCENTAGE (langsung per-item)
    //     PERCENTAGE tetap dihitung per-item karena bersifat proporsional terhadap harga.
    itemsWithPromo.forEach((entry) => {
      const { bestPromo, price, item, itemSubtotal } = entry;
      if (!bestPromo) return;
      if (bestPromo.type !== "PERCENTAGE") return;

      const minP = Number(bestPromo.minPurchase || 0);
      const meetsMinP = minP === 0 || subtotalBeforeDiscount >= minP;
      if (meetsMinP) {
        entry.discount = (price * Number(bestPromo.value) / 100) * item.quantity;
        entry.discount = Math.min(entry.discount, itemSubtotal);
      }
    });

    // 3.2. Hitung promo NOMINAL tanpa minPurchase secara berkelompok (per Promo ID)
    //     NOMINAL flat: diskon dihitung SEKALI per promo, lalu didistribusikan
    //     proporsional ke item-item yang cocok (sama seperti cara kerja conditional nominal).
    const uniqueNominalPromoIds = Array.from(
      new Set(
        itemsWithPromo
          .filter(e => e.bestPromo && (Number(e.bestPromo.minPurchase || 0) === 0) && e.bestPromo.type === "NOMINAL")
          .map(e => e.bestPromo.id)
      )
    );

    uniqueNominalPromoIds.forEach((promoId) => {
      const matchingEntries = itemsWithPromo.filter(e => e.bestPromo && e.bestPromo.id === promoId);
      const firstPromo = matchingEntries[0].bestPromo;
      const totalDiscountValue = Number(firstPromo.value); // Nilai potongan flat tunggal
      const totalMatchingSubtotal = matchingEntries.reduce((sum, e) => sum + e.itemSubtotal, 0);

      if (matchingEntries.length > 0 && totalMatchingSubtotal > 0) {
        // Batasi diskon agar tidak melebihi subtotal item-item tersebut
        const finalDiscount = Math.min(totalDiscountValue, totalMatchingSubtotal);
        let currentDistributed = 0;

        matchingEntries.forEach((entry, idx) => {
          const isLast = idx === matchingEntries.length - 1;
          let portion = 0;

          if (isLast) {
            portion = finalDiscount - currentDistributed;
          } else {
            portion = Math.round((entry.itemSubtotal / totalMatchingSubtotal) * finalDiscount);
          }

          portion = Math.min(portion, entry.itemSubtotal);
          entry.discount = portion;
          currentDistributed += portion;
        });
      }
    });

    // 3.3. Hitung promo conditional nominal (ada minPurchase) secara berkelompok (per Promo ID)
    // Cari semua promo conditional nominal unik yang aktif pada item di keranjang
    const uniqueConditionalNominalPromoIds = Array.from(
      new Set(
        itemsWithPromo
          .filter(e => e.bestPromo && Number(e.bestPromo.minPurchase || 0) > 0 && e.bestPromo.type === "NOMINAL")
          .map(e => e.bestPromo.id)
      )
    );

    uniqueConditionalNominalPromoIds.forEach((promoId) => {
      // Ambil semua item yang menggunakan promo bersyarat nominal ini
      const matchingEntries = itemsWithPromo.filter(e => e.bestPromo && e.bestPromo.id === promoId);
      const firstPromo = matchingEntries[0].bestPromo;
      const minP = Number(firstPromo.minPurchase || 0);

      // Cek apakah total belanja memenuhi syarat minimal belanja promo
      if (subtotalBeforeDiscount >= minP) {
        const totalDiscountValue = Number(firstPromo.value); // Nilai potongan flat tunggal
        const totalMatchingSubtotal = matchingEntries.reduce((sum, e) => sum + e.itemSubtotal, 0);

        if (matchingEntries.length > 0 && totalMatchingSubtotal > 0) {
          // Batasi diskon agar tidak melebihi subtotal item-item tersebut
          const finalDiscount = Math.min(totalDiscountValue, totalMatchingSubtotal);
          let currentDistributed = 0;

          matchingEntries.forEach((entry, idx) => {
            const isLast = idx === matchingEntries.length - 1;
            let portion = 0;

            if (isLast) {
              portion = finalDiscount - currentDistributed;
            } else {
              portion = Math.round((entry.itemSubtotal / totalMatchingSubtotal) * finalDiscount);
            }

            portion = Math.min(portion, entry.itemSubtotal);
            entry.discount = portion;
            currentDistributed += portion;
          });
        }
      }
    });

    // Hitung total discount & siapkan netSubtotal
    let totalDiscount = 0;
    const finalItemsData = itemsWithPromo.map((entry) => {
      const netSubtotal = entry.itemSubtotal - entry.discount;
      totalDiscount += entry.discount;
      return {
        ...entry,
        netSubtotal,
      };
    });

    // ─────────────────────────────────────────────────────────────────────
    // STEP 4: Hitung & Distribusikan Diskon GLOBAL
    //         Dihitung SEKALI di luar loop berdasarkan subtotal bersih,
    //         lalu diprorata proporsional ke item-item yang "global-eligible".
    // ─────────────────────────────────────────────────────────────────────
    const globalPromo = activePromos.find((p) => p.targetType === "GLOBAL");
    if (globalPromo) {
      const globalMinPurchase = Number(globalPromo.minPurchase || 0);
      // Gunakan subtotal KOTOR sebagai acuan minPurchase global
      const meetsGlobal = globalMinPurchase === 0 || subtotalBeforeDiscount >= globalMinPurchase;

      if (meetsGlobal) {
        // Distribusikan hanya ke item yang tidak punya promo spesifik (global-eligible)
        const eligibleItems = finalItemsData.filter((i) => i.isGlobalEligible && i.itemSubtotal > 0);
        const totalEligibleSubtotal = eligibleItems.reduce((s, i) => s + i.itemSubtotal, 0);

        if (eligibleItems.length > 0 && totalEligibleSubtotal > 0) {
          // Hitung total diskon global SATU KALI untuk seluruh transaksi berdasarkan subtotal eligible
          let totalGlobalDiscount: number;
          if (globalPromo.type === "PERCENTAGE") {
            totalGlobalDiscount = Math.round(totalEligibleSubtotal * Number(globalPromo.value) / 100);
          } else {
            // NOMINAL FLAT: dipotong SEKALI, tidak dikali apapun
            totalGlobalDiscount = Number(globalPromo.value);
          }

          // Pastikan total global discount tidak melebihi subtotal item eligible
          totalGlobalDiscount = Math.min(totalGlobalDiscount, totalEligibleSubtotal);

          let distributed = 0;
          eligibleItems.forEach((eligItem, idx) => {
            const isLast = idx === eligibleItems.length - 1;
            let portion: number;
            if (isLast) {
              // Item terakhir menyerap sisa selisih pembulatan agar total tepat
              portion = totalGlobalDiscount - distributed;
            } else {
              portion = Math.round((eligItem.itemSubtotal / totalEligibleSubtotal) * totalGlobalDiscount);
            }
            portion = Math.min(portion, eligItem.netSubtotal);

            // Update data item dengan porsi diskon global
            eligItem.discount += portion;
            eligItem.netSubtotal -= portion;
            eligItem.promoName = eligItem.promoName || globalPromo.name;
            distributed += portion;
          });

          totalDiscount += distributed;
        }
      }
    }

    // ─────────────────────────────────────────────────────────────────────
    // STEP 5: Susun validated items & hitung total final
    // ─────────────────────────────────────────────────────────────────────
    const validatedItems = finalItemsData.map((d) => ({
      productId: d.item.productId,
      productCode: d.productCode,
      quantity: d.item.quantity,
      basePriceAtSale: d.price,
      productName: d.productName,
      discountAmount: Math.min(Math.round(d.discount), d.itemSubtotal),
      variantId: d.variantId,
      variantColor: d.variantColor,
      skuId: d.skuId,
      skuSize: d.skuSize,
      promoName: d.promoName,
      gimmickPriceAtSale: d.item.gimmickPriceAtSale,
    }));

    const totalPrice = validatedItems.reduce(
      (acc, curr) => acc + (curr.basePriceAtSale * curr.quantity - curr.discountAmount),
      0
    );

    if (totalDiscount > DISCOUNT_AUTH_THRESHOLD) {
      if (!adminPin) {
        throw new AppError("Diskon besar membutuhkan otorisasi PIN Admin", 401, "UNAUTHORIZED");
      }

      const authorizedAdmin = await AdminService.verifyAdminPin(adminPin);
      if (!authorizedAdmin) {
        throw new AppError("PIN Admin salah atau tidak memiliki akses", 401, "UNAUTHORIZED");
      }
    }

    //  KEPUTUSAN BISNIS #4: Uang yang dibayar harus >= total belanja
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

    // KEPUTUSAN BISNIS #5: Pastikan Kasir Memiliki Laci Shift yang Aktif
    const currentShift = await ShiftRepository.findOpenShiftByAdmin(kasirId);
    if (!currentShift) {
      throw new AppError("Laci Kasir belum dibuka! Silakan muat ulang dan masukkan Modal Awal terlebih dahulu.", 400, "BAD_REQUEST");
    }

    //  KEPUTUSAN BISNIS #6: Generate nomor invoice unik harian
    const invoiceNo = await this.generateInvoiceNo();

    //  Semua validasi lulus → serahkan ke Repository untuk disimpan
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
   *  KEPUTUSAN BISNIS:
   * - Transaksi yang sudah VOID tidak boleh di-VOID lagi
   * - Stok WAJIB dikembalikan saat transaksi dibatalkan
   */
  async voidTransaction(id: string, cancelReason: string, operatorId?: string) {
    const transaction = await TransactionRepository.findById(id);

    if (!transaction) {
      throw new AppError("Transaksi tidak ditemukan", 404, "NOT_FOUND");
    }

    //  Validasi bisnis: tidak boleh void transaksi yang sudah void
    if (transaction.status === "VOID") {
      throw new AppError("Transaksi sudah berstatus VOID", 400, "BAD_REQUEST");
    }

    //  Validasi bisnis: Hanya boleh void jika shift kasir pada transaksi tersebut masih OPEN (Kecuali dilakukan oleh ADMIN)
    if (transaction.shiftId) {
      const shift = await prisma.cashierShift.findUnique({
        where: { id: transaction.shiftId },
      });
      if (shift && shift.status === "CLOSED") {
        // Cek apakah operator yang memproses void adalah ADMIN
        let isAdmin = false;
        if (operatorId) {
          const operator = await prisma.admin.findUnique({
            where: { id: operatorId },
            select: { role: true },
          });
          if (operator && operator.role === "ADMIN") {
            isAdmin = true;
          }
        }

        if (!isAdmin) {
          throw new AppError(
            "Transaksi tidak dapat dibatalkan (VOID) karena shift kasir pada transaksi ini sudah ditutup. Hanya Admin/Owner yang dapat membatalkan transaksi dari shift yang sudah tutup.",
            403,
            "FORBIDDEN"
          );
        }
      }
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
