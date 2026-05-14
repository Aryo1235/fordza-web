# Transaction Rollback Implementation Guide

## Overview
Prisma transactions ensure atomic operations - if any operation fails, all changes are rolled back.

## When to Use Transactions

### Critical Operations:
1. **Product Creation with Variants & SKUs**
   - Create product → Create variants → Create SKUs
   - If SKU creation fails, product and variants should rollback

2. **Checkout Transaction**
   - Create transaction → Create transaction items → Decrement stock → Update sales summary
   - If any step fails, everything should rollback

3. **Void Transaction**
   - Update transaction status → Restore stock → Update sales summary
   - Must be atomic

4. **Bulk Operations**
   - Bulk stock update
   - Bulk product import

## Usage Pattern

```typescript
// ✅ Good - Atomic operation
async function createProductWithVariants(data: any) {
  return await prisma.$transaction(async (tx) => {
    // All operations use tx instead of prisma
    const product = await tx.product.create({ data: productData });
    const variant = await tx.productVariant.create({ data: variantData });
    const sku = await tx.productSku.create({ data: skuData });
    
    return product;
  });
  // If any operation fails, all are rolled back automatically
}

// ❌ Bad - Partial data on failure
async function createProductWithVariants(data: any) {
  const product = await prisma.product.create({ data: productData });
  const variant = await prisma.productVariant.create({ data: variantData }); // Fails here
  // Product already created but variant failed - data inconsistency!
}
```

## Implementation Checklist

### Services to Update:
- [ ] ProductService.create() - Wrap product + variants + SKUs creation
- [ ] TransactionService.checkout() - Wrap transaction + items + stock decrement
- [ ] TransactionService.void() - Wrap status update + stock restore
- [ ] StockService.bulkUpdate() - Wrap multiple stock updates

### Example Implementation:

```typescript
// backend/services/transaction.service.ts
export const TransactionService = {
  async checkout(data: CheckoutData) {
    return await prisma.$transaction(async (tx) => {
      // 1. Create transaction
      const transaction = await tx.transaction.create({
        data: {
          invoiceNo: generateInvoiceNo(),
          totalPrice: data.totalPrice,
          // ...
        },
      });

      // 2. Create transaction items
      for (const item of data.items) {
        await tx.transactionItem.create({
          data: {
            transactionId: transaction.id,
            // ...
          },
        });

        // 3. Decrement stock
        await tx.productSku.update({
          where: { id: item.skuId },
          data: { stock: { decrement: item.quantity } },
        });

        // 4. Create stock log
        await tx.skuStockLog.create({
          data: {
            skuId: item.skuId,
            delta: -item.quantity,
            type: "SALE",
            // ...
          },
        });
      }

      // 5. Update sales summary
      await tx.skuSalesSummary.upsert({
        // ...
      });

      return transaction;
    });
    // If any step fails, everything rolls back
  },
};
```

## Testing Rollback

```typescript
// Force error to test rollback
await prisma.$transaction(async (tx) => {
  await tx.product.create({ data: productData });
  throw new Error("Test rollback"); // Product creation will be rolled back
});
```

## Notes
- Transactions have timeout (default: 5 seconds)
- For long-running operations, increase timeout:
  ```typescript
  await prisma.$transaction(async (tx) => {
    // operations
  }, {
    timeout: 10000, // 10 seconds
  });
  ```
- Avoid external API calls inside transactions
- Keep transactions as short as possible
