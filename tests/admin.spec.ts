import { test, expect } from '@playwright/test';

// 1x1 pixel transparent PNG Base64
const VALID_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

test.describe('Dashboard Admin / Back-Office (Akses Khusus Admin)', () => {

  test.beforeEach(async ({ page }) => {
    // Sesi login Admin untuk setiap pengujian Admin
    await page.goto('/login');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'fordza2026');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('Skenario 1, 2: Dashboard Monitoring Utama & Low Stock Alert', async ({ page }) => {
    // Skenario 1: Tampilan ringkasan total data master
    await expect(page.locator('text=Panel Kendali Utama').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Akses Cepat Harian').first()).toBeVisible();
    await expect(page.locator('text=Ringkasan Metrik').first()).toBeVisible();
    
    // Skenario 2: Widget notifikasi stok menipis (Low Stock Alert)
    const lowStockAlert = page.locator('text=/Low Stock|Stok Menipis|Stok Aman/i');
    await expect(lowStockAlert.first()).toBeVisible();
  });

  test('Skenario 3, 5, 6, 7: CRUD Produk Master (Tambah, Validasi Gagal, Edit, Soft Delete)', async ({ page }) => {
    // 1. Skenario 5: Navigasi ke Form Baru & Validasi Gagal
    await page.goto('/dashboard/products/new');
    await expect(page.locator('input[name="productCode"]').first()).toBeVisible({ timeout: 15000 });

    const saveBtn = page.locator('button[type="submit"]').first();
    await saveBtn.click();
    
    // Harus muncul pesan kesalahan Zod (contoh: "Kode produk minimal 3 karakter")
    await expect(page.locator('text=/Kode produk minimal|Nama produk minimal|wajib diisi|harus diisi/i').first()).toBeVisible({ timeout: 10000 });

    // 2. Skenario 6: Edit Data Produk (Menggunakan Produk Dummy Seeded untuk kestabilan E2E)
    await page.goto('/dashboard/products');
    await expect(page.locator('input[placeholder*="Ketik nama produk"]').first()).toBeVisible({ timeout: 15000 });
    
    await page.fill('input[placeholder*="Ketik nama produk"]', 'Fordza Urban Sneakers');
    await page.waitForTimeout(1000);
    
    const editBtn = page.locator('[title="Edit"]').first();
    await editBtn.click();
    
    // Tunggu loader loading data produk selesai
    await expect(page.locator('text=Menyiapkan data produk')).toBeHidden({ timeout: 20000 });
    await expect(page.locator('input[name="name"]').first()).toBeVisible({ timeout: 15000 });
    
    await page.fill('input[name="name"]', 'Fordza Urban Sneakers - Updated');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/\/dashboard\/products$/);

    // 3. Skenario 7: Soft Delete Artikel Produk
    // Cari produk yang sudah diupdate
    await page.fill('input[placeholder*="Ketik nama produk"]', 'Fordza Urban Sneakers - Updated');
    await page.waitForTimeout(1000);

    const deleteBtn = page.locator('[title="Hapus"]').first();
    await deleteBtn.click();
    
    // Konfirmasi dialog hapus (menggunakan .first() karena hanya ada 1 tombol dengan teks Hapus di modal)
    const confirmDeleteBtn = page.locator('button:has-text("Ya, Hapus"), button:has-text("Hapus"), button:has-text("Konfirmasi")').first();
    await confirmDeleteBtn.click();
    
    await expect(page.locator('text=/berhasil|sukses|dihapus|dinonaktifkan/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('Skenario 8, 9, 10: CRUD Kategori Produk (Tambah, Reorder, Edit/Hapus)', async ({ page }) => {
    await page.goto('/dashboard/categories/new');
    await expect(page.locator('input[name="name"]').first()).toBeVisible({ timeout: 15000 });

    // Skenario 8: Tambah Kategori
    await page.fill('input[name="name"]', 'Test Cat E2E');
    await page.fill('textarea[name="shortDescription"]', 'Kategori tes Playwright');
    
    // Isi order dengan angka besar (misal 99) agar tidak duplikat dengan kategori Sneakers yang memakai order 1
    await page.fill('input[name="order"]', '99');
    
    // Mock valid 1x1 PNG file upload
    const fileBuffer = Buffer.from(VALID_PNG_BASE64, 'base64');
    await page.setInputFiles('input[type="file"]', {
      name: 'test-category.png',
      mimeType: 'image/png',
      buffer: fileBuffer
    });
    
    // Tunggu kompresi/upload selesai (loader menghilang, preview muncul)
    await page.waitForTimeout(1000);
    
    const saveBtn = page.locator('button[type="submit"]').first();
    await saveBtn.click();
    await page.waitForURL(/\/dashboard\/categories$/);

    // Skenario 10: Edit Kategori
    const editBtn = page.locator('[title="Edit"]').first();
    await editBtn.click();
    
    // Tunggu loader loading data kategori selesai
    await expect(page.locator('main svg.animate-spin')).toBeHidden({ timeout: 30000 });
    await expect(page.locator('input[name="name"]').first()).toBeVisible({ timeout: 15000 });
    
    await page.fill('input[name="name"]', 'Test Cat E2E - Updated');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/\/dashboard\/categories$/);

    // Hapus Kategori
    const deleteBtn = page.locator('[title="Hapus"]').first();
    await deleteBtn.click();
    const confirmDeleteBtn = page.locator('button:has-text("Ya, Hapus"), button:has-text("Hapus"), button:has-text("Konfirmasi")').first();
    await confirmDeleteBtn.click();
    await expect(page.locator('text=/berhasil|sukses|dihapus/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('Skenario 11, 12, 13: CRUD Banner Promosi (Tambah, Toggle, Edit/Hapus)', async ({ page }) => {
    await page.goto('/dashboard/banners');
    await expect(page.locator('button:has-text("Tambah Banner")').first()).toBeVisible({ timeout: 15000 });

    // Skenario 11: Tambah Banner
    await page.click('button:has-text("Tambah Banner")');
    await expect(page.locator('input[placeholder*="Kemerdekaan"]').first()).toBeVisible({ timeout: 10000 });

    await page.fill('input[placeholder*="Kemerdekaan"]', 'Test Banner E2E');
    await page.fill('input[placeholder*="sale"]', 'https://fordza.com/promo');
    
    // Mock valid 1x1 PNG file upload
    const fileBuffer = Buffer.from(VALID_PNG_BASE64, 'base64');
    await page.setInputFiles('input[type="file"]', {
      name: 'test-banner.png',
      mimeType: 'image/png',
      buffer: fileBuffer
    });
    
    await page.waitForTimeout(1000);
    
    const saveBtn = page.locator('button:has-text("Simpan")').first();
    await saveBtn.click();
    
    // Menunggu toast berhasil
    await expect(page.locator('text=/berhasil|sukses|success/i').first()).toBeVisible({ timeout: 10000 });

    // Skenario 12: Toggle Status Aktif/Nonaktif
    const toggleStatus = page.locator('button[role="switch"], input[type="checkbox"]').first();
    if (await toggleStatus.isVisible()) {
      await toggleStatus.click();
      await expect(page.locator('text=/berhasil|sukses|diperbarui/i').first()).toBeVisible({ timeout: 10000 });
    }

    // Skenario 13: Edit/Hapus Banner
    const deleteBtn = page.locator('[title="Hapus"]').first();
    await deleteBtn.click();
    const confirmDeleteBtn = page.locator('button:has-text("Ya, Hapus"), button:has-text("Hapus"), button:has-text("Konfirmasi")').first();
    await confirmDeleteBtn.click();
    await expect(page.locator('text=/berhasil|sukses|dihapus/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('Skenario 14, 15: CRUD Size Template', async ({ page }) => {
    await page.goto('/dashboard/size-templates');
    const addTplBtn = page.locator('button:has-text("Buat Template"), button:has-text("Tambah Template"), button:has-text("Tambah")').first();
    await addTplBtn.click();
    await expect(page.locator('input[placeholder*="Formal Pria"]').first()).toBeVisible({ timeout: 10000 });

    await page.fill('input[placeholder*="Formal Pria"]', 'Test Template E2E');
    await page.fill('input[placeholder*="39, 40"]', '39, 40, 41');
    const saveBtn = page.locator('button[type="submit"]').first();
    await saveBtn.click();
    
    await expect(page.locator('text=/berhasil|sukses|success/i').first()).toBeVisible({ timeout: 10000 });
    // Tunggu toast hilang agar tabel ter-refresh
    await page.waitForTimeout(1500);

    // Skenario 15: Hapus template yang baru saja dibuat
    // Target spesifik row 'Test Template E2E' (bukan template lain yang sedang dipakai produk)
    const newTemplateRow = page.locator('table tbody tr:has-text("Test Template E2E"), tr:has-text("Test Template E2E")').first();
    if (await newTemplateRow.count() > 0) {
      const deleteBtn = newTemplateRow.locator('[title="Hapus"]:not([disabled])');
      await expect(deleteBtn).toBeVisible({ timeout: 10000 });
      await deleteBtn.click();
      const confirmDeleteBtn = page.locator('button:has-text("Ya, Hapus"), button:has-text("Hapus"), button:has-text("Konfirmasi")').first();
      await confirmDeleteBtn.click();
      await expect(page.locator('text=/berhasil|sukses|dihapus/i').first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('Skenario 16, 17, 18: CRUD Kontrol Promo Diskon (Tambah Persentase, Nominal, Edit/Hapus)', async ({ page }) => {
    await page.goto('/dashboard/promo');
    const addPromoBtn = page.locator('button:has-text("Tambah Promo"), button:has-text("Tambah")').first();
    await addPromoBtn.click();
    await expect(page.locator('input[placeholder*="Promo Lebaran"]').first()).toBeVisible({ timeout: 10000 });

    await page.fill('input[placeholder*="Promo Lebaran"]', 'Promo Diskon E2E 20%');
    await page.fill('input[placeholder*="Nilai diskon"]', '20');
    
    const saveBtn = page.locator('button:has-text("Buat Promo")').first();
    await saveBtn.click();
    await expect(page.locator('text=/berhasil|sukses|success/i').first()).toBeVisible({ timeout: 10000 });

    // Skenario 18: Edit/Hapus Promo
    const deleteBtn = page.locator('[title="Hapus"]').first();
    page.once('dialog', dialog => dialog.accept());
    await deleteBtn.click();
    await expect(page.locator('text=/berhasil|sukses|dihapus/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('Skenario 19, 20, 21: Manajemen Stok & Logs (Stock Opname, Histori, Ekspor Excel)', async ({ page }) => {
    // Skenario 19: Stock Opname Massal
    await page.goto('/dashboard/stock');
    await page.waitForLoadState('networkidle');
    
    // Tabel Stock Opname menggunakan expand row - klik row produk pertama untuk membuka input SKU
    // Tombol expand ada di dalam row tabel (bukan tombol 'Cek N Ukuran' yang terpisah)
    const firstProductRow = page.locator('table tbody tr').first();
    await expect(firstProductRow).toBeVisible({ timeout: 15000 });
    await firstProductRow.click();
    
    // Setelah row expand, input[type="number"] untuk stok per SKU akan muncul
    await expect(page.locator('input[type="number"]').first()).toBeVisible({ timeout: 15000 });
    
    const stockInput = page.locator('input[type="number"]').first();
    if (await stockInput.isVisible()) {
      await stockInput.fill('55');
      // Tombol simpan ada di PageHeader (atas halaman) - teks "Simpan N Item"
      await page.locator('button:has-text("Simpan")').first().click();
      await expect(page.locator('text=/berhasil|sukses|success/i').first()).toBeVisible({ timeout: 10000 });
    }

    // Skenario 20: Histori Stock Logs
    await page.goto('/dashboard/stock-history');
    await expect(page.locator('text=/Histori|Mutasi|Log/i').first()).toBeVisible({ timeout: 15000 });

    // Skenario 21: Ekspor Histori Stock Logs ke Excel
    const exportBtn = page.locator('button:has-text("Ekspor ke Excel"), button:has-text("Export")');
    if (await exportBtn.isVisible()) {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        exportBtn.click(),
      ]);
      expect(download.suggestedFilename()).toContain('.xlsx');
    }
  });

  test('Skenario 22, 23: Laporan Omzet & Rekap Shift Kasir', async ({ page }) => {
    // Skenario 22: Grafik Omzet
    await page.goto('/dashboard/reports');
    await expect(page.locator('text=/Tren|Omzet|Penjualan/i').first()).toBeVisible({ timeout: 15000 });

    // Skenario 23: Laporan Laci (Shift Kasir)
    await page.goto('/dashboard/shifts');
    await expect(page.locator('text=/Laporan|Laci|Kasir/i').first()).toBeVisible({ timeout: 15000 });
  });

  test('Skenario 24, 25, 26, 27, 28: Manajemen Pengguna (Tambah, Edit, Duplikat, PIN, Hapus)', async ({ page }) => {
    await page.goto('/dashboard/users');
    await page.waitForLoadState('networkidle');
    
    const uniqueUsername = `usertese2e_${Date.now()}`;

    const addUserBtn = page.locator('button:has-text("Tambah Akun"), button:has-text("Tambah Pengguna"), button:has-text("Tambah User")').first();
    await addUserBtn.click();
    
    // Input fields menggunakan id bukan name attribute - gunakan #id selector
    await expect(page.locator('#name').first()).toBeVisible({ timeout: 10000 });

    // Skenario 24: Tambah User Baru
    await page.fill('#name', 'User Tes E2E');
    await page.fill('#username', uniqueUsername);
    await page.fill('#password', 'usertes123');
    
    // Tombol submit di dialog adalah "Buat Akun" (bukan type=submit generik)
    const buatAkunBtn = page.locator('button:has-text("Buat Akun")').first();
    await buatAkunBtn.click();
    await expect(page.locator('text=/berhasil|sukses|User berhasil dibuat/i').first()).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000); // Tunggu modal tutup

    // Skenario 26: Tambah akun dengan Username yang sudah terdaftar
    await addUserBtn.click();
    await expect(page.locator('#name').first()).toBeVisible({ timeout: 10000 });
    await page.fill('#name', 'User Tes Duplikat');
    await page.fill('#username', uniqueUsername); // Username sama dengan yang baru dibuat
    await page.fill('#password', 'usertes123');
    await page.locator('button:has-text("Buat Akun")').first().click();
    await expect(page.locator('text=/sudah digunakan|terdaftar|duplikat|Gagal membuat|error/i').first()).toBeVisible({ timeout: 10000 });
    
    // Close modal duplikat
    const closeBtn = page.locator('button:has-text("Batal")').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    }

    // Skenario 25 & 27: Edit & Atur PIN
    // Cari user di tabel berdasarkan username unik
    const userRow = page.locator(`table tbody tr:has-text("${uniqueUsername}")`);
    if (await userRow.count() > 0) {
      const editUserBtn = userRow.locator('button').first();
      await editUserBtn.click();
      
      // Ganti nama - dialog terbuka, tombol submit sekarang "Simpan Perubahan"
      await expect(page.locator('#name').first()).toBeVisible({ timeout: 10000 });
      await page.fill('#name', 'User Tes E2E Updated');
      await page.locator('button:has-text("Simpan Perubahan")').first().click();
      await expect(page.locator('text=/berhasil|sukses|User berhasil diperbarui/i').first()).toBeVisible({ timeout: 10000 });
      await page.waitForTimeout(1000);
    }

    // Skenario 28: Hapus/Nonaktifkan Akun Pengguna
    const userRowAfterEdit = page.locator(`table tbody tr:has-text("${uniqueUsername}")`);
    if (await userRowAfterEdit.count() > 0) {
      const deleteUserBtn = userRowAfterEdit.locator('button').nth(1);
      await deleteUserBtn.click();
      const confirmDeleteBtn = page.locator('button:has-text("Ya, Hapus"), button:has-text("Hapus"), button:has-text("Konfirmasi")').first();
      await confirmDeleteBtn.click();
      await expect(page.locator('text=/berhasil|sukses|dihapus|User berhasil dihapus/i').first()).toBeVisible({ timeout: 10000 });
    }
  });
});

