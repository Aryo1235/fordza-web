const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.product.create({
      data: {
        id: 'test-id-1234',
        productCode: 'TEST',
        name: 'Test',
        price: 0, stock: 0, productType: 'shoes', gender: 'Man',
        categories: {
          create: [{ category: { connect: { id: 'invalid-category-id' } } }]
        }
      }
    });
  } catch (e) {
    console.log("META:", JSON.stringify(e.meta));
    console.log("MESSAGE:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
