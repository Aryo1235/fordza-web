# Laporan Progres & Perubahan Logika (Admin CMS Fordza Web)

**Tanggal Pembaruan Terakhir:** 28 Maret 2026
**Status Eksekusi:** ✅ Panel Admin CMS Frontend **SELESAI 100%**.
**Langkah Selanjutnya:** 🔜 Membangun Halaman E-Commerce Publik (Front-End Customer).

---

## 1. Ringkasan Pembangunan Admin CMS
Panel Admin (`app/(admin)/dashboard`) telah selesai dibangun dan terintegrasi penuh secara fungsional dengan rancangan Backend.

### Teknologi Frontend yang Digunakan
- **Framework:** Next.js (App Router)
- **UI & Styling:** Tailwind CSS, ShadCN UI, Lucide Icons. Warna utama: `#3C3025` (Cokelat Utama), `#FEF4E8` (Krem/Secondary), dan Putih.
- **State Management & Fetching:** TanStack Query (React Query) dan Axios.
- **Validasi Form:** React Hook Form disandingkan dengan Zod.
- **Efisiensi Cloud:** `browser-image-compression` untuk kompresi file gambar dari perangkat sebelum dikirim sebagai `FormData`.

### Routing (Akses Admin)
Seluruh rute Admin dibungkus dalam folder `app/(admin)`. Akses ini dilindungi secara *client-side* melalui pengecekan di root layout admin dan secara *server-side* (API) menggunakan MiddleWare + JWT (Access Token in Memory & Refresh Token via HttpOnly Cookie).

---

## 2. Rincian Modul & Fitur yang Selesai
Seluruh entitas database kini memiliki halaman manajemen secara GUI (Graphical User Interface) untuk Administrator:

1. **Dashboard Home**: Menampilkan ringkasan (Stats) total produk, kategori, rating, dll secara garis besar.
2. **Products (`/dashboard/products`)**:
   - DataTable lengkap dengan fitur pencarian dan Pagination.
   - Form Tambah & Edit bersifat dinamis (menggabungkan Pemilihan Category dan Size Template langsung dari Backend).
   - Pengaturan Gambar Real-Time: Fitur ImageUpload dengan dukungan file kompresi S3 secara *multiple*.
   - Aksi "Soft-Delete" (Mengubah produk menjadi tidak terdaftar/hide).
3. **Categories (`/dashboard/categories`)**:
   - List Kategori beserta gambar *thumbnail*.
   - Form Manajemen 1 gambar per Kategori.
4. **Banners (`/dashboard/banners`)**:
   - Untuk mengontrol slider raksasa yang nanti akan tampil di halaman depan website milik pelanggan (*Homepage Carousel*).
5. **Size Templates (`/dashboard/size-templates`)**:
   - Pembuatan dan pembaruan *Size Chart* berupa format *JSON List Input* (bisa mengatur panduan ukuran Insole sepatu maupun baju yang direkatkan ke Produk di masa mendatang).

---

## 3. Catatan PERUBAHAN LOGIKA Penting (Bugs Fixed)
> ⚠️ **BACA BAGIAN INI SAAT MELANJUTKAN PROYEK AGAR TIDAK BINGUNG LOGIKA API/KOMPONENNYA:**

### A. Penggunaan `<img />` Standar HTML
Sebelumnya kita menggunakan komponen `<Image />` bawaan `next/image` di file list (Tabel Produk, Kategori, Card Testimoni). Atas permintaan, seluruh komponen ini telah dilepas dan **digantikan dengan `<img />` HTML biasa** (`className="w-full h-full object-cover"`). Ini menghindari pemrosesan/kompresi server Next.js yang memberatkan jika banyak gambar eksternal.

### B. Mencegah Hilangnya Testimoni di Tabel CMS (Fixed `getAllAdmin`)
**Masalah Sebelumnya:** Jika Admin menonaktifkan Testimoni (*Switch* dari *ON* ke *OFF*), Testimoni tersebut menghilang dari layar Admin. Ini terjadi karena Admin salah menggunakan fungsi *query* `getAll()` yang mem-filter `isActive: true` (seharusnya fungsi `getAll()` hanya untuk website publik/pembeli).
**Penyelesaian Logika:** Membuat sebuah *method* baru di Backend bernama `TestimonialService.getAllAdmin()` yang mengambil **Semua data** *(baik Aktif maupun Nonaktif)*, lalu menggantikan rute di `api/admin/testimonials/route.ts` dengan *method* baru ini.

### C. Sinkronisasi Tipe Data Switch Testimoni
**Masalah Terdeteksi:** Pada halaman Moderasi Testimoni, *switch slider* "Tampilkan di Web?" sebelumnya gagal/tidak bisa diklik.
**Penyelesaian Logika:** Tombol *Switch* mencoba mengakses *property* `isApproved`, padahal kunci sebenarnya di dalam *Prisma Schema* E-Commerce kita adalah **`isActive`**. 
Variabel `isApproved` dari parameter telah dialihkan nama *payload*-nya secara benar untuk memanggil `item.isActive`.

### D. Fitur Testimoni: "Tambah Manual" (Combobox Produk)
Sesuai *request* mengenai ketiadaan transaksi E-Commerce bawaan, Admin kini **dapat merekap Testimoni (ulasan WhatsApp, dsb) secara manual dari CMS Admin**. 
**Penyelesaian Logika UI:** Karena tidak ada Library *Combobox* bawaan (seperti cmdk/Searchable Select milik ShadCN biasa), saya membuat ulang elemen **Searchable Select khusus dari `<Input>` List HTML secara Vanilla**. Pengguna (Admin) tinggal mengetik kata kunci "*Panto*", maka daftar sepatu pantofel yang menampung string "*Panto*" akan muncul menjadi kotak usulan menu *dropdown*.

### E. Mencegah Nomor Urutan Kategori Tabrakan (Unique Sequence Validation)
**Masalah Terdeteksi:** Jika ada 2 Kategori Produk yang diberikan Nomor Urutan (`order`) ke-1, *database* akan menampilkan barang-barang tersebut tidak pasti (*random* yang mana duluan masuk).
**Penyelesaian Logika Utama:**
1. **Validasi Reject API:** Saat Insert/Update, *Backend* (`CategoryService`) kini mencari apakah sudah ada Kategori lain dengan `order` angka tersebut. Jika ada, API melempar *throw Exception HTTP 400*, sehingga CMS UI akan menampilkan PopUp *(alert)* menolak: *"Urutan X sudah digunakan! Silakan cari urutan lain"*.
2. **Safety Net (Sortir Tambahan):** Saya menambahkan kode `orderBy: [{ order: "asc" }, { name: "asc" }]`. Andaikata pun entah bagaimana ada data `order` yang terekam ganda, maka baris *Category* akan disusun rapi secara sekunder bersumber abjad perhuruf namanya. Kategori "Aksesoris (1)" pasti mendahului "Sepatu (1)".

---

Proyek Anda ada dalam jalur yang sangat baik! Dokumen ini menjadi jejak referensi bagi Anda untuk melanjutkan tahap UI Website Front-End Publik nantinya.
