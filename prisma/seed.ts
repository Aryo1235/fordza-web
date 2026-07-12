import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";

import { seedAdmin } from "@/prisma/admin-seed";
import { seedSizeTemplates } from "@/prisma/sizetemplate-seed";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("🌱 Mulai seeding...");

  await seedAdmin(prisma);
  await seedSizeTemplates(prisma);

  console.log("🎉 Seeding selesai");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });