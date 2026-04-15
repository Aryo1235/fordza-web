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
    items: { productId: string; quantity: number; discountAmount?: number }[];
    amountPaid: number;
    customerName?: string;
    customerPhone?: string;
    adminPin?: string;
  }) {
    const { kasirId, items, amountPaid, customerName, customerPhone, adminPin } = data;

    // ✅ KEPUTUSAN BISNIS #1: Ambil data produk dari DB untuk validasi
    const productIds = items.map((i) => i.productId);
    const dbProducts =
      await TransactionRepository.findProductsByIds(productIds);

    // ✅ KEPUTUSAN BISNIS #2: Validasi stok & hitung total
    let totalPrice = 0;
    const validatedItems: {
      productId: string;
      productCode: string;
      quantity: number;
      priceAtSale: number;
      productName: string;
      discountAmount: number;
    }[] = [];

    let totalDiscount = 0;
    for (const item of items) {
      const dbProduct = dbProducts.find((p) => p.id === item.productId);

      if (!dbProduct) {
        throw new Error(`Produk tidak ditemukan: ${item.productId}`);
      }

      // ✅ KEPUTUSAN BISNIS #3: Stok tidak boleh kurang dari jumlah pesanan
      if (dbProduct.stock < item.quantity) {
        throw new Error(
          `Stok ${dbProduct.name} tidak cukup (tersisa ${dbProduct.stock})`,
        );
      }

      if (item.quantity <= 0) {
        throw new Error(`Jumlah produk untuk ${dbProduct.name} tidak valid`);
      }

      const price = Number(dbProduct.price);
      const itemSubtotal = price * item.quantity;
      const discount = Number(item.discountAmount || 0);

      if (discount < 0) {
        throw new Error(`Diskon untuk ${dbProduct.name} tidak boleh negatif`);
      }

      if (discount > itemSubtotal) {
        throw new Error(
          `Diskon ${dbProduct.name} tidak boleh lebih besar dari subtotal item (Rp ${itemSubtotal.toLocaleString("id-ID")})`,
        );
      }

      // ✅ KEPUTUSAN BISNIS #3.1: Hitung subtotal tiap item (Harga * Qty - Diskon)
      totalPrice += price * item.quantity - discount;
      totalDiscount += discount;

      validatedItems.push({
        productId: item.productId,
        productCode: dbProduct.productCode || "-",
        quantity: item.quantity,
        priceAtSale: price,
        productName: dbProduct.name,
        discountAmount: discount,
      });
    }

    if (totalDiscount > DISCOUNT_AUTH_THRESHOLD) {
      if (!adminPin) {
        throw new Error("Diskon besar membutuhkan otorisasi PIN Admin");
      }

      const authorizedAdmin = await AdminService.verifyAdminPin(adminPin);
      if (!authorizedAdmin) {
        throw new Error("PIN Admin salah atau tidak memiliki akses");
      }
    }

    // ✅ KEPUTUSAN BISNIS #4: Uang yang dibayar harus >= total belanja
    if (amountPaid < totalPrice) {
      throw new Error(
        `Nominal pembayaran (Rp ${amountPaid.toLocaleString("id-ID")}) kurang dari total belanja (Rp ${totalPrice.toLocaleString("id-ID")})`,
      );
    }

    const change = amountPaid - totalPrice;

    // ✅ KEPUTUSAN BISNIS #5: Generate nomor invoice unik harian
    const invoiceNo = await this.generateInvoiceNo();

    // ✅ Semua validasi lulus → serahkan ke Repository untuk disimpan
    return await TransactionRepository.createWithStockDecrement({
      invoiceNo,
      totalPrice,
      amountPaid,
      change,
      kasirId,
      customerName,
      customerPhone,
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
        priceAtSale: Number(i.priceAtSale),
        discountAmount: Number(i.discountAmount),
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
        priceAtSale: Number(i.priceAtSale),
        discountAmount: Number(i.discountAmount),
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
      throw new Error("Transaksi tidak ditemukan");
    }

    // ✅ Validasi bisnis: tidak boleh void transaksi yang sudah void
    if (transaction.status === "VOID") {
      throw new Error("Transaksi sudah berstatus VOID");
    }

    const items = await TransactionRepository.findItemsByTransactionId(id);

    // Serahkan ke Repository untuk proses VOID + kembalikan stok secara atomik
    await TransactionRepository.voidWithStockRestore(
      id,
      items,
      cancelReason,
      operatorId,
    );

    return { voided: true };
  },
};
