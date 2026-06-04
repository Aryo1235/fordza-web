const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.product.create({
      data: {
        id: 'test-id-12345',
        productCode: 'PROD-847', // existing code
        name: 'Test Duplicate',
        price: 0, stock: 0, productType: 'shoes', gender: 'Man',
        shortDescription: 'test'
      }
    });
  } catch (e) {
    console.log("META TARGET:", e.meta?.target);
    console.log("META TARGET TYPE:", Array.isArray(e.meta?.target) ? 'array' : typeof e.meta?.target);
    console.log("FULL META:", JSON.stringify(e.meta));
  } finally {
    await prisma.$disconnect();
  }
}
main();
