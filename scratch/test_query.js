require("dotenv").config();
const { PrismaClient } = require("../app/generated/prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function run() {
  try {
    const templates = await prisma.sizeTemplate.findMany({
      include: {
        productDetails: {
          select: { id: true }
        }
      }
    });
    
    console.log("=== SIZE TEMPLATES IN DATABASE ===");
    for (const t of templates) {
      console.log(`- ID: ${t.id}`);
      console.log(`  Name: ${t.name}`);
      console.log(`  Type: ${t.type}`);
      console.log(`  Product count in productDetails: ${t.productDetails.length}`);
      
      // Also check if any products are linked in the database directly
      const linkedProducts = await prisma.productDetail.count({
        where: { sizeTemplateId: t.id }
      });
      console.log(`  Linked ProductDetail count (directly): ${linkedProducts}`);
    }
  } catch (error) {
    console.error("Error executing query:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

run();
