import { prisma } from "./lib/prisma";

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
  } catch (e: any) {
    console.log("--- PRISMA ERROR ---");
    console.log("CODE:", e.code);
    console.log("META:", JSON.stringify(e.meta, null, 2));
    console.log("MESSAGE:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
