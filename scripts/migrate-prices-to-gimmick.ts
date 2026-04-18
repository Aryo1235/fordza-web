// scripts/migrate-prices-to-gimmick.ts
import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("🚀 Starting Price Migration (Flipping BasePrice to Gimmick)...");

  const variants = await prisma.productVariant.findMany({
    include: { skus: true },
  });

  console.log(`Found ${variants.length} variants to process.`);

  for (const variant of variants) {
    const oldBasePrice = Number(variant.basePrice);
    const discount = variant.discountPercent || 0;
    
    // Hitung harga jual asli (yang selama ini terhitung di FE/POS)
    const newBasePrice = discount > 0 ? oldBasePrice * (1 - discount / 100) : oldBasePrice;
    
    // Harga dasar lama menjadi harga gimmick (coret)
    const newComparisonPrice = discount > 0 ? oldBasePrice : null;

    console.log(`Variant ${variant.variantCode}: ${oldBasePrice} (-${discount}%) -> Jual: ${newBasePrice}, Gimmick: ${newComparisonPrice}`);

    await prisma.productVariant.update({
      where: { id: variant.id },
      data: {
        basePrice: newBasePrice,
        comparisonPrice: newComparisonPrice,
      },
    });

    // Proses SKU overrides
    for (const sku of variant.skus) {
      if (sku.priceOverride) {
        const oldOverride = Number(sku.priceOverride);
        const newOverride = discount > 0 ? oldOverride * (1 - discount / 100) : oldOverride;
        
        await prisma.productSku.update({
          where: { id: sku.id },
          data: {
            priceOverride: newOverride,
          },
        });
      }
    }
  }

  // Update cached Product prices
  const products = await prisma.product.findMany({
    include: { variants: true },
  });

  for (const product of products) {
    if (product.variants.length > 0) {
      const minPrice = Math.min(...product.variants.map(v => Number(v.basePrice)));
      await prisma.product.update({
        where: { id: product.id },
        data: { price: minPrice },
      });
    }
  }

  console.log("✅ Price Migration Completed Successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
