const dotenv = require('dotenv');
dotenv.config();

const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../app/generated/prisma');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("=== DETAIL PRODUK & VARIAN ===");
  const products = await prisma.product.findMany({
    include: {
      variants: {
        include: {
          skus: true
        }
      }
    }
  });

  products.forEach(p => {
    console.log(`Product: ${p.name} | Price: ${p.price}`);
    p.variants.forEach(v => {
      console.log(`  - Variant: ${v.color} | BasePrice: ${v.basePrice} | CompPrice: ${v.comparisonPrice}`);
      v.skus.forEach(s => {
        console.log(`    * Size: ${s.size} | Stock: ${s.stock} | Override: ${s.priceOverride}`);
      });
    });
  });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
