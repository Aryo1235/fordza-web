// src/lib/prisma.ts
import { PrismaClient } from "../app/generated/prisma/client";
import { Pool } from "pg"; // Berasal dari paket 'pg'
import { PrismaPg } from "@prisma/adapter-pg"; // Berasal dari paket '@prisma/adapter-pg'

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// 1. Siapkan koneksi ke Neon
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

// 2. Siapkan jembatan (Adapter)
const adapter = new PrismaPg(pool);

// 3. Buat Client dengan Jembatan tersebut
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter, // Wajib ada di Prisma 7
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
