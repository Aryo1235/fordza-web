import { prisma } from "../lib/prisma";

async function test() {
  try {
    const product = await prisma.product.findFirst({
      where: { deletedAt: null },
      select: {
        id: true,
        detail: {
          select: {
            customSizes: true,
            customMeasurements: true,
          }
        }
      }
    });
    console.log("SUCCESS:", JSON.stringify(product, null, 2));
  } catch (error: any) {
    console.error("ERROR STACK:", error);
  } finally {
    process.exit(0);
  }
}

test();
