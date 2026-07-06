import { test, expect } from '@playwright/test';

test.describe('Point of Sale / POS (Akses Kasir & Admin)', () => {

  test.beforeEach(async ({ page }) => {
    // Sesi login Kasir untuk setiap pengujian POS
    await page.goto('/login');
    await page.fill('#username', 'kasir');
    await page.fill('#password', 'fordza2026');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/pos/);
  });

  test('Skenario 2: Pengujian Buka Shift Kasir dengan kolom modal awal dikosongkan', async ({ page }) => {
    // Jika modal Buka Shift terbuka, coba submit kosong
    const submitBtn = page.locator('button:has-text("SAYA BERTANGGUNG JAWAB & BUKA LACI")');
    if (await submitBtn.isVisible()) {
      await page.fill('#startingCash', '');
      await submitBtn.click();
      
      // Harus muncul toast kesalahan
      await expect(page.locator('text=Format Kas Tidak Valid').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('Skenario 1: Pengujian Buka Shift Kasir dengan nominal modal awal yang valid', async ({ page }) => {
    const submitBtn = page.locator('button:has-text("SAYA BERTANGGUNG JAWAB & BUKA LACI")');
    if (await submitBtn.isVisible()) {
      await page.fill('#startingCash', '500.000');
      await submitBtn.click();
      
      // Toast sukses muncul dan modal tertutup
      await expect(page.locator('text=Shift Berhasil Dibuka').first()).toBeVisible({ timeout: 5000 });
      await expect(submitBtn).not.toBeVisible();
    }
    
    // Pastikan berada di antarmuka POS utama (ada search bar produk)
    await expect(page.locator('input[placeholder="Cari produk atau kategori..."]')).toBeVisible({ timeout: 10000 });
  });

  test('Skenario 3, 4, 5, 6, 7, 10, 11, 12, 13: Alur Transaksi Lengkap POS (Tambah, Qty, Kurang, Kembalian, Checkout, Invoice, Cetak)', async ({ page }) => {
    // Pastikan modal shift tidak menutupi (buka shift jika belum)
    const shiftModalSubmit = page.locator('button:has-text("SAYA BERTANGGUNG JAWAB & BUKA LACI")');
    if (await shiftModalSubmit.isVisible()) {
      await page.fill('#startingCash', '500.000');
      await shiftModalSubmit.click();
      await page.waitForTimeout(1000);
    }

    // Tunggu UI POS siap (search bar muncul)
    await expect(page.locator('input[placeholder="Cari produk atau kategori..."]')).toBeVisible({ timeout: 10000 });

    // 1. Skenario 3: Tambah produk pertama ke keranjang
    // Gunakan produk yang tampil di default (tanpa pencarian)
    // Produk default terlihat di halaman POS - klik tombol ukuran "39" pada produk pertama yang muncul
    await page.waitForTimeout(1000);
    
    const size39Btn = page.locator('button:has-text("39")').first();
    await expect(size39Btn).toBeVisible({ timeout: 10000 });
    await size39Btn.click();
    
    // Buka Keranjang (di mobile/tablet harus klik tombol keranjang melayang, di desktop otomatis tampil jika isCartVisible)
    const openCartBtn = page.locator('text=KERANJANG (');
    if (await openCartBtn.isVisible()) {
      await openCartBtn.click();
    }

    // Verifikasi ada produk di keranjang (minimal ada item, bukan state keranjang kosong)
    // Menggunakan getByRole karena 'complementary' bukan selector CSS yang valid di Playwright
    const cartSection = page.getByRole('complementary');
    await expect(cartSection.locator('p').filter({ hasNotText: 'Keranjang kosong' }).first()).toBeVisible({ timeout: 10000 });

    // 2. Skenario 4: Tambah produk yang sama lagi (Penggabungan item)
    // Qty awal 1
    const qtyText = page.locator('span[class*="text-center text-sm font-bold"], span[class*="w-5 text-center text-stone-700"]').first();
    await expect(qtyText).toHaveText('1', { timeout: 5000 });
    
    // Tambah lagi ukuran 39 (klik lagi tombol ukuran yang sama)
    await size39Btn.click();
    await page.waitForTimeout(500);
    
    // Qty harusnya bertambah jadi 2 (bukan membentuk baris baru)
    await expect(qtyText).toHaveText('2', { timeout: 5000 });

    // 3. Skenario 5: Pengubahan kuantitas item secara manual (+/-)
    const plusBtn = page.locator('button:has-text("+"), button:has(svg.lucide-plus)').first();
    await plusBtn.click();
    await page.waitForTimeout(500);
    await expect(qtyText).toHaveText('3', { timeout: 5000 });

    const minusBtn = page.locator('button:has-text("-"), button:has(svg.lucide-minus)').first();
    await minusBtn.click();
    await page.waitForTimeout(500);
    await expect(qtyText).toHaveText('2', { timeout: 5000 });

    // 4. Skenario 11: Kalkulasi kembalian ketika uang diterima kurang dari total tagihan
    // Cari input pembayaran tunai (biasanya input text terakhir di form kasir)
    const cashInput = page.getByRole('textbox').last(); // Input amountPaid
    await cashInput.fill('1.000');
    
    // Pastikan muncul peringatan kurang bayar
    await expect(page.locator('text=Kurang').first()).toBeVisible({ timeout: 5000 });
    
    // Tombol bayar harus bernilai "LENGKAPI DATA" atau disabled saat uang kurang
    const payBtn = page.locator('button:has-text("BAYAR Rp"), button:has-text("LENGKAPI DATA")');
    await expect(payBtn).toBeDisabled({ timeout: 5000 });

    // 5. Skenario 10: Kalkulasi kembalian otomatis
    // Kita isi pembayaran dengan nominal yang cukup (sangat besar untuk memastikan ada kembalian)
    await cashInput.fill('5.000.000');
    
    // Verifikasi kembalian muncul (teks Kembalian tanpa titik dua)
    await expect(page.locator('text=Kembalian').first()).toBeVisible({ timeout: 5000 });
    await expect(payBtn).toBeEnabled({ timeout: 5000 });

    // 6. Skenario 12: Pembuatan nomor invoice otomatis & checkout
    await payBtn.click();
    
    // InvoiceModal harus muncul
    await expect(page.locator('text=Transaksi Berhasil 🎉').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=No. Invoice').first()).toBeVisible({ timeout: 5000 });

    // 7. Skenario 13: Cetak struk ke printer thermal
    // Kita pastikan tombol Cetak/Unduh ada
    await expect(page.locator('text=Cetak Hardware').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Unduh PDF').first()).toBeVisible({ timeout: 5000 });

    // Tutup InvoiceModal (ambil tombol pertama di dalam .print-overlay yang merupakan tombol silang/close)
    const closeInvoiceBtn = page.locator('.print-overlay button').first();
    if (await closeInvoiceBtn.isVisible()) {
      await closeInvoiceBtn.click();
    }
  });

  test('Skenario 14: Fitur Cek Stok Cepat (Quick Stock Check) oleh Kasir', async ({ page }) => {
    // Tombol Cek Stok Cepat biasanya ada di POS atau sidebar
    // Mari navigasi ke POS dan cek apakah ada panel Quick Stock Check
    await expect(page.locator('input[placeholder="Cari produk atau kategori..."]')).toBeVisible({ timeout: 10000 });
    
    // Tunggu produk muncul di POS (ada produk default yang tampil tanpa pencarian)
    await page.waitForTimeout(1000);
    
    // Cek Stok cepat - pastikan ada setidaknya satu produk yang terlihat
    // (POS menampilkan semua produk secara default, cari produk Fordza apapun)
    await expect(page.locator('text=Fordza').first()).toBeVisible({ timeout: 10000 });
    
    // Tombol Quick Stock Check (🔍 Cek Stok) tersedia - gunakan getByRole untuk menghindari CSS selector error
    await expect(page.getByRole('button', { name: /Cek Stok/i }).first()).toBeVisible({ timeout: 5000 });
  });

  test('Skenario 15, 16, 17, 20: Riwayat Transaksi Shift Aktif, Cetak Ulang, & Void dengan PIN Admin', async ({ page }) => {
    // Navigasi ke Halaman Riwayat Transaksi
    await page.goto('/riwayat');
    await expect(page).toHaveURL(/\/riwayat/);

    // Skenario 15: Tampilan Riwayat Transaksi
    // Menggunakan heading selector untuk menghindari strict mode violation (ada 2 elemen teks "Riwayat Transaksi")
    await expect(page.getByRole('heading', { name: 'Riwayat Transaksi' })).toBeVisible({ timeout: 10000 });
    
    // Pilih invoice pertama
    const firstInvoiceRow = page.locator('table tbody tr').first();
    if (await firstInvoiceRow.count() > 0) {
      await firstInvoiceRow.click();
      await page.waitForTimeout(500);

      // Skenario 20: Cetak Ulang Struk
      await expect(page.locator('text=Cetak Ulang Struk').first()).toBeVisible({ timeout: 5000 });

      // Skenario 16 & 17: Void Transaksi dengan PIN Admin
      const voidBtn = page.locator('button:has-text("Void"), button:has-text("Batalkan")');
      if (await voidBtn.count() > 0 && await voidBtn.isEnabled()) {
        await voidBtn.click();
        
        // Modal Void terbuka, minta PIN Admin
        await expect(page.locator('text=Batalkan Transaksi (VOID)').first()).toBeVisible({ timeout: 5000 });

        // Skenario 17: PIN salah
        await page.fill('#pin', '000000');
        await page.fill('#reason', 'Tes pembatalan E2E salah PIN');
        await page.click('button:has-text("Konfirmasi VOID")');
        await expect(page.locator('text=/PIN tidak valid|PIN salah|Gagal/i').first()).toBeVisible({ timeout: 5000 });

        // Skenario 16: PIN benar (Admin PIN default: 123456)
        await page.fill('#pin', '123456');
        await page.fill('#reason', 'Tes pembatalan E2E PIN benar');
        await page.click('button:has-text("Konfirmasi VOID")');
        
        // Status berubah menjadi VOID
        await expect(page.locator('text=/berhasil dibatalkan|VOID|dibatalkan/i').first()).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('Skenario 18, 19: Tutup Shift Kasir (Audit Laci Kas & Logout)', async ({ page }) => {
    // Klik tombol Tutup Shift Laci di Sidebar
    await page.click('text=Tutup Shift Laci');

    // Dialog Tutup Shift terbuka
    await expect(page.locator('text=Tutup Laci & Akhiri Shift').first()).toBeVisible({ timeout: 10000 });

    // Skenario 19: Input kosong
    const submitCloseBtn = page.locator('button:has-text("TUTUP SHIFT & KELUAR")');
    await expect(submitCloseBtn).toBeDisabled({ timeout: 5000 });

    // Skenario 18: Input modal tutup shift yang valid
    await page.fill('#actualEndingCash', '1.500.000');
    await expect(submitCloseBtn).toBeEnabled({ timeout: 5000 });
    
    await submitCloseBtn.click();

    // Sukses menutup shift dan dialihkan ke login
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/login/);
  });
});
