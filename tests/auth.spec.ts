import { test, expect } from '@playwright/test';

test.describe('Sistem Keamanan & Autentikasi (Login & Hak Akses)', () => {
  
  test('Skenario 5: Pengujian login dengan kolom username dan password dikosongkan', async ({ page }) => {
    await page.goto('/login');
    
    // Klik tombol Masuk tanpa mengisi form
    await page.click('button[type="submit"]');
    
    // Verifikasi pesan kesalahan validasi sisi klien
    await expect(page.locator('text=Username wajib diisi')).toBeVisible();
    await expect(page.locator('text=Password wajib diisi')).toBeVisible();
  });

  test('Skenario 3: Pengujian login dengan password yang tidak sesuai', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('#username', 'admin');
    await page.fill('#password', 'passwordsalah');
    await page.click('button[type="submit"]');
    
    // Verifikasi pesan galat dan tetap di halaman login
    await expect(page.locator('text=Username atau password salah')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('Skenario 4: Pengujian login dengan username yang tidak terdaftar', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('#username', 'userpalsu');
    await page.fill('#password', 'sembarangpass');
    await page.click('button[type="submit"]');
    
    // Verifikasi pesan galat generik
    await expect(page.locator('text=Username atau password salah')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('Skenario 1: Pengujian login akun Admin dengan kredensial yang valid', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('#username', 'admin');
    await page.fill('#password', 'fordza2026');
    await page.click('button[type="submit"]');
    
    // Redirect ke dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Verifikasi peranan ADMIN pada navigasi sidebar
    await expect(page.locator('text=ADMIN PANEL')).toBeVisible();
  });

  test('Skenario 2: Pengujian login akun Kasir dengan kredensial yang valid', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('#username', 'kasir');
    await page.fill('#password', 'fordza2026');
    await page.click('button[type="submit"]');
    
    // Redirect ke POS
    await expect(page).toHaveURL(/\/pos/);
    
    // Verifikasi modal Buka Shift otomatis terbuka jika belum ada shift aktif
    // Atau jika sudah ada shift, minimal berada di halaman POS
    await expect(page.locator('text=Kasir Panel')).toBeVisible();
  });

  test('Skenario 6: Pengujian pembatasan hak akses: Kasir mencoba mengakses URL Dashboard Admin secara paksa', async ({ page }) => {
    // Login sebagai kasir terlebih dahulu
    await page.goto('/login');
    await page.fill('#username', 'kasir');
    await page.fill('#password', 'fordza2026');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/pos/);
    
    // Coba paksa akses ke /dashboard
    await page.goto('/dashboard');
    
    // Deredirect kembali ke /pos (sesuai middleware)
    await expect(page).toHaveURL(/\/pos/);
  });

  test('Skenario 7: Pengujian pembatasan akses: pengguna yang belum login mencoba mengakses halaman terproteksi', async ({ page }) => {
    // Buka dashboard langsung tanpa login
    await page.goto('/dashboard');
    
    // Diarahkan ke halaman login
    await expect(page).toHaveURL(/\/login/);

    // Buka POS langsung tanpa login
    await page.goto('/pos');
    await expect(page).toHaveURL(/\/login/);
  });

  test('Skenario 8: Pengujian fungsionalitas tombol Keluar (Logout)', async ({ page }) => {
    // Login Admin
    await page.goto('/login');
    await page.fill('#username', 'admin');
    await page.fill('#password', 'fordza2026');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Klik logout
    await page.click('text=Keluar');
    
    // Diarahkan kembali ke login
    await expect(page).toHaveURL(/\/login/);
    
    // Pastikan tidak bisa balik lagi ke dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
