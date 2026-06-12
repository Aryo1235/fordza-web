import { prisma } from "./lib/prisma";
import { ProductService } from "./backend/services/products.service";

async function main() {
  try {
    // Make sure we have a product to update
    const product = await prisma.product.findFirst();
    if (!product) {
      console.log("No product found to update.");
      return;
    }
    
    console.log("Updating product:", product.id);
    await ProductService.update(product.id, {
      sizeTemplateId: "invalid-size-template-id-123",
      description: "Test description"
    });
    console.log("Update success (should not happen)");
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
