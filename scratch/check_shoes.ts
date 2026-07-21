import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const products = await prisma.product.findMany({
    include: {
      detail: {
        include: {
          sizeTemplate: true
        }
      }
    }
  });

  console.log("=== All Products and Size Templates in DB ===");
  products.forEach(p => {
    console.log(`ID: ${p.id}`);
    console.log(`Code: ${p.productCode}`);
    console.log(`Name: ${p.name}`);
    console.log(`Type: ${p.productType}`);
    console.log(`Size Template Name: ${p.detail?.sizeTemplate?.name || "No Template"}`);
    console.log(`Size Template Type: ${p.detail?.sizeTemplate?.type || "N/A"}`);
    console.log(`Size Template Sizes: ${JSON.stringify(p.detail?.sizeTemplate?.sizes || [])}`);
    console.log(`Size Template Measurements: ${JSON.stringify(p.detail?.sizeTemplate?.measurements || null)}`);
    console.log(`Custom Measurements: ${JSON.stringify(p.detail?.customMeasurements || null)}`);
    console.log("-------------------------------------------");
  });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
