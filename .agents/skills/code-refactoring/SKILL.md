---
name: code-refactoring
description: "Panduan dan standar dalam melakukan refactoring kode untuk proyek Fordza Web (React, Next.js, TypeScript). Digunakan ketika Anda meminta AI untuk 'merapikan kode', 'refactor fungsi ini', atau 'buat kode ini cleaner'."
---

# Code Refactoring Skill

Skill ini membantu memastikan bahwa kode di proyek Fordza Web selalu ditulis ulang (refactored) menjadi kode yang "Clean", skalabel, efisien, dan mudah di-maintain. 

Setiap kali menjalankan perintah **Refactor**, terapkan aturan dan standar di bawah ini:

## 1. Prinsip Umum Clean Code (Solid & DRY)
- **Early Return (Guard Clauses):** Hindari blok `if/else` bersarang (nested). Gunakan return awal apabila kondisi pengecekan tidak terpenuhi.
- **DRY (Don't Repeat Yourself):** Jika kode yang diulang lebih dari 2 kali, pindahkan menjadi Helper Function atau Custom Hook (dalam konteks React).
- **Single Responsibility Principle:** Setiap fungsi / method HANYA boleh melakukan satu tugas secara eksklusif. Pisahkan pengolahan *business logic* (pengambilan data/kondisi) dari *presentation logic* (UI).

## 2. Standar TypeScript & Next.js
- Selalu gunakan *typing* (tipe interface/type) secara ketat. Hindari menggunakan tipe `any` dengan segala cara. Jika tipe belum diketahui dengan pasti, gunakan `unknown`.
- Gunakan optional chaining `?.` dan nullish coalescing `??` alih-alih mengecek value yang kosong berulang-ulang dengan logika dan/atau (`&&` atau `||` untuk perbandingan spesifik Null/Undefined).

## 3. Optimasi UI & React Framework
- **Pisahkan Hooks:** Pindahkan *business logic* state dan fungsi ke dalam `hooks.ts` terpisah bila komponen UI Anda sudah melewati ~100 baris.
- **Gunakan Pattern Shadcn UI Secara Konsisten:** Karena proyek ini menggunakan Shadcn, saat me-refactor *styling* pastikan kita memanfaatkan utilitas `cn()` via clsx/tailwind-merge untuk mengatasi clash di Tailwind CSS class.

## 4. Keamanan Saat Melakukan Refactor
Setiap modifikasi tidak boleh HANCUR atau mengubah fungsi yang sudah ada (no breaking changes).
- Pindahkan variabel statis atau dependensi *library* yang tidak mengandalkan status komputasi keluar dari area `export default function Component`.
- Jangan mengubah routing atau membuang import yang mungkin tersembunyi tanpa pemeriksaan berlapis.

## Panduan Respons
Saat kamu berhasil menerapkan refactoring ini:
1. Berikan rangkuman ringkas poin-poin yang dioptimalkan.
2. Tampilkan Before-After secara konseptual.
3. Lampirkan log *rendering* code/perubahan (jangan tampilkan seluruh panjang file kecuali diminta).
