# Peta Jalan (Roadmap) & Panduan Front-End Publik Fordza Web

Dokumen ini adalah cetak biru (Blueprint) kesatuan proyek untuk pengembangan tahap akhir, yaitu **Halaman Publik (Toko Online Eksternal)** yang akan dilihat oleh pembeli. 
Semua pondasi Backend dan Admin CMS sudah selesai, sehingga tahap ini murni berfokus pada UI/UX pelanggan.

---

## 🏗️ 1. Halaman yang Harus Dibangun (Pages)

### A. Homepage (`/`)
- **Hero Carousel Banner:** Mengambil gambar dari `/api/public/banners`. Klik gambar mengarah ke target URL masing-masing.
- **Kategori Unggulan:** Menampilkan deretan bundar/kotak kategori dari `/api/public/categories`.
- **Produk Terbaru/Hot:** Menampilkan 8-10 produk terbaru.

### B. Katalog Produk (`/products`)
- Grid layout untuk menampilkan daftar sepatu (2 kolom di HP, 4 kolom di Laptop).
- **Sistem Filter & Search:** Pengunjung bisa memfilter produk berdasarkan Kategori (`?categoryId=...`) dan nama (`?search=...`).
- **Pagination / Load More:** Menarik data dari `/api/public/products`.

### C. Detail Produk (`/products/[id]`)
- **Galeri Gambar Produk:** Gambar utama bisa di-swipe (HP) atau klik thumbnail (Desktop).
- **Informasi:** Nama, Harga (Format Rupiah), Deskripsi, Material.
- **Panduan Ukuran (Size Guide):** Mengambil data dari `SizeTemplate` milik produk tersebut untuk ditampilkan sebagai modal/tabel *popup* panjang tapak kaki.
- **Ulasan (Testimonials):** Menampilkan ulasan-ulasan valid terkait produk tersebut beserta rating bintang rata-rata.
- **Tombol Call-to-Action (CTA):** Tombol utama "Beli via WhatsApp".
- **Produk Serupa (Related):** Menampilkan daftar rekomendasi produk dari kategori yang sama di bagian bawah halaman.

### D. Halaman Kirim Testimoni (`/testimonials/new`)
- Form publik bagi pembeli yang ingin memberikan ulasan.
- Mengirim POST request ke `/api/admin/testimonials` (atau *endpoint public* serupa).
- **Flow:** Testimoni yang dikirim pelanggan akan default masuk ke status *Pending* (`isActive: false`). Nantinya Admin akan menyetujui (Approve) ulasan ini di CMS agar bisa tampil di web.

---

## 🛒 2. Alur Pembelian (WhatsApp Checkout Flow)
Karena website ini tidak menggunakan *Payment Gateway* atau sistem Keranjang (Add to Cart) internal, pesanan di-handle langsung ke WhatsApp Admin.

**Implementasi:**
Saat user menekan tombol "Beli via WhatsApp" di Detail Produk, tangkap Ukuran (Size) yang di-klik pengguna dan arahkan ke tab baru:
```javascript
const text = `Halo Admin Fordza. Saya ingin memesan:
👟 Produk: ${product.name}
📐 Ukuran: ${selectedSize}
💳 Harga: Rp. ${product.price.toLocaleString("id-ID")}

Apakah stok barang ini tersedia?`;

const waUrl = `https://wa.me/6281234567890?text=${encodeURIComponent(text)}`;
window.open(waUrl, "_blank");
```

---

## ⚠️ 3. Hal Penting yang Harus Diperhatikan (Gotchas)

### 🚀 A. Server-Side Rendering (SSR) & SEO
Sangat penting agar Fordza Web bisa ditemukan di halaman 1 Google!
- Jangan gunakan `"use client"` di halaman struktur utama seperti Detail Produk.
- Gunakan fitur Server Components dari Next.js App Router untuk *fetch* `/api/public/products/[id]`.
- Gunakan `generateMetadata()` di Next.js untuk membuat judul dinamis per sepatu (Cth `<title>Sepatu Pantofel Pria Keren - Fordza</title>`).

### 📱 B. Mobile First Design (Prioritas HP)
- Di Indonesia, 80% pembeli E-Commerce berbelanja lewat HP.
- Pastikan teks membesar dengan baik di layar kecil.
- Hindari tombol yang terlalu kecil (sulit diklik jari).
- Jadikan menu navigasi berbentuk *Hamburger/Drawer* Bottom Bar di HP.

### ⚡ C. Optimalisasi Gambar (Performance)
- Meski CMS membatasi kompresi ~200kb per gambar, meload 20 gambar sekaligus di Katalog akan sangat berat jika tidak dioptimalkan.
- Jika Anda membangun UI Katalog, terapkan teknik *Lazy Loading* (Gambar hanya di-load ketika pembeli men-scroll layar ke bawah). Jika Anda menggunakan tag `<img>` HTML, cukup tambahkan atribut `loading="lazy"`.

### 🎨 D. Konsistensi Brand
- Karena CMS menggunakan paduan warna `#3C3025` (Cokelat) dan `#FEF4E8` (Krem), bawalah bahasa (Aesthetic) warna mewah ini ke halaman Publik juga agar terlihat mahal, elegan, dan menumbuhkan rasa **kepercayaan (trust)** dari calon pembeli. 

---

**Kesimpulan:** 
Secara backend, database, dan control panel (Admin), proyek ini sudah komplit 100%. Fokus satu-satunya kedepan hanyalah "Melukis dan Menghias" ruangan pamer untuk tamu (Website Front-End), lalu menautkan data dari API yang sudah matang ini. 
Semoga sukses!
