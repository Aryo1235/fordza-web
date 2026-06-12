# Penjelasan: Kenapa Middleware Menggunakan `console.warn` dan Bukan `app.log`?

Dokumen ini adalah referensi akademis dan teknis untuk menjelaskan arsitektur *logging* pada Middleware di aplikasi Fordza Web. Penjelasan ini sangat berguna untuk menjawab pertanyaan dosen penguji saat sidang skripsi terkait **"Mengapa penolakan token/sesi habis tidak tercatat di `app.log`?"**.

---

## 1. Perbedaan Lingkungan Eksekusi (Runtime)

Aplikasi Next.js modern tidak menjalankan semua kodenya di dalam mesin yang sama. Terdapat dua jenis mesin utama:

1. **Node.js Runtime**
   * Digunakan oleh semua *API Route* (`app/api/...`).
   * Memiliki akses penuh ke *File System* lokal server (modul `fs`).
   * Bisa membaca dan menulis file fisik seperti `app.log` di dalam hardisk server.
   * *Library* seperti `pino` (yang kita gunakan di `lib/logger.ts`) sangat bergantung pada Node.js Runtime.

2. **Edge Runtime**
   * Digunakan secara eksklusif oleh **Middleware** (`proxy.ts`).
   * Edge Runtime adalah lingkungan V8 JavaScript yang didesain agar sangat ringan dan super cepat sehingga bisa mencegat trafik masuk di level pinggiran (*edge server*) sebelum menyentuh aplikasi utama.
   * **Keterbatasan Utama:** Edge Runtime sama sekali **TIDAK memiliki akses ke File System lokal (fs)**.

## 2. Mengapa Middleware Tidak Bisa Menulis ke `app.log`?

Karena Middleware berjalan di Edge Runtime, jika kita memaksa mengimpor `logger.ts` ke dalam `proxy.ts`, aplikasi Next.js akan memunculkan *error* atau bahkan *crash* saat di-*build*. Middleware dilarang keras menyentuh ruang penyimpanan server.

Sebagai gantinya, jika ada permintaan dengan *token* yang tidak valid (Sesi Habis), Middleware akan langsung menendang pengunjung di "gerbang depan" tanpa pernah membukakan pintu ke "dalam gedung" (API Route).

Karena *request*-nya tidak pernah sampai ke *API Route*, maka tidak ada fungsi di Node.js yang mencatatnya ke dalam `app.log`.

## 3. Apakah `console.warn` Sudah Cukup Sebagai *Best Practice*?

**IYA, sangat cukup dan sangat lazim di dunia arsitektur *Serverless*.**

1. **Logging Bawaan JavaScript:** 
   Di dalam *Edge Runtime*, perintah `console.warn()` atau `console.log()` didukung secara *native*. Pesan penolakan akan dicetak secara *real-time* di layar Terminal/Console peladen (*stdout*), lengkap dengan `TraceID`. Ini sudah sah disebut sebagai proses *logging*.

2. **Mencegah Overhead Hardisk:**
   Kegagalan otentikasi (401 Unauthorized) akibat token yang kedaluwarsa adalah kejadian yang **sangat normal dan rutin** terjadi di *Front-end*. Jika jutaan kejadian "Token Habis" dicatat ke dalam satu *file text* `app.log`, ukuran *file* tersebut akan membengkak dengan cepat (*Log Spamming*) dan berisiko memenuhi kapasitas *hardisk* server.

3. **Batasan *Microservices*:**
   Jika kita bersikeras ingin mencatatnya ke `app.log`, kita harus membuat *Internal Webhook* di mana Middleware harus menembak API HTTP lain hanya untuk menulis ke *file*. Ini akan membuang-buang sumber daya jaringan (meningkatkan *Latency*) untuk operasi sepele.

## Kesimpulan (Kunci Jawaban Sidang)

> *"Arsitektur keamanan sistem kami dirancang dengan mendelegasikan validasi awal ke **Edge Middleware** demi performa maksimal. Karena **Edge Runtime** pada Next.js tidak memiliki hak akses ke File System (fs), pencatatan kegagalan sesi tidak disimpan ke dalam file fisik `app.log`, melainkan dialirkan melalui Standard Output (Console) server. Ini menjaga performa aplikasi tetap stabil dan mencegah pembengkakan memori server akibat log sesi yang kedaluwarsa."*
