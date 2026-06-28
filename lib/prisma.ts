// src/lib/prisma.ts
import { PrismaClient } from "../app/generated/prisma/client"; // Pastikan path ini sesuai dengan output yang dihasilkan oleh generator Prisma
import { Pool } from "pg"; // Berasal dari paket 'pg'
import { PrismaPg } from "@prisma/adapter-pg"; // Berasal dari paket '@prisma/adapter-pg'

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// 1. Siapkan koneksi ke database
const connectionString = process.env.DATABASE_URL;

// Konfigurasi pool berbeda tergantung mode deployment:
// - Standalone (VPS/PM2): proses long-running, pool bisa lebih besar
// - Serverless (Vercel): setiap invocation bisa spawn pool baru, batasi ke 1
const isServerless = process.env.VERCEL === "1";
const pool = new Pool({
  connectionString,
  max: isServerless ? 1 : 10,         // Max koneksi paralel
  idleTimeoutMillis: 10000,           // Tutup koneksi idle setelah 10 detik
  connectionTimeoutMillis: 10000,     // Gagal cepat jika DB tidak bisa dihubungi dalam 10 detik
});

// 2. Siapkan jembatan (Adapter)
const adapter = new PrismaPg(pool);

// 3. Buat Client dengan Jembatan tersebut
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter, // Wajib ada di Prisma 7
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
