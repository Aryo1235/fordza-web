import Papa from "papaparse";

export interface BulkProductRow {
  productCode: string;
  name: string;
  shortDescription: string;
  productType: string;
  gender: string;
  categoryIds: string;
  sizeTemplateId: string;
  material: string;
  outsole?: string;
  insole?: string;
  closureType?: string;
  origin?: string;
  notes?: string;
  variantColor: string;
  variantCode: string;
  basePrice: string | number;
  comparisonPrice?: string | number;
  oversizePrice?: string | number;
  oversizeSizes?: string; // Comma separated sizes that use oversizePrice
  discountPercent?: string | number;
  sizes: string;
  stocks: string;
  isPopular?: string | boolean;
  isBestseller?: string | boolean;
  isNew?: string | boolean;
}

export interface BulkProduct {
  productCode: string;
  name: string;
  shortDescription: string;
  productType: string;
  gender: string;
  categoryIds: string[];
  sizeTemplateId: string;
  material: string;
  outsole?: string;
  insole?: string;
  closureType?: string;
  origin?: string;
  notes?: string;
  isPopular: boolean;
  isBestseller: boolean;
  isNew: boolean;
  variants: {
    color: string;
    variantCode: string;
    basePrice: number;
    comparisonPrice?: number | null;
    discountPercent?: number | null;
    skus: {
      size: string;
      stock: number;
      priceOverride?: number | null;
    }[];
  }[];
}

export const parseProductCsv = (file: File): Promise<BulkProduct[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse<BulkProductRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data;
        const productsMap = new Map<string, BulkProduct>();

        rows.forEach((row) => {
          if (!row.productCode || !row.name) return;

          let product = productsMap.get(row.productCode);
          if (!product) {
            product = {
              productCode: row.productCode,
              name: row.name,
              shortDescription: row.shortDescription,
              productType: row.productType as any,
              gender: row.gender || "Unisex",
              categoryIds: row.categoryIds ? row.categoryIds.split(",").map(id => id.trim()) : [],
              sizeTemplateId: row.sizeTemplateId,
              material: row.material,
              outsole: row.outsole,
              insole: row.insole,
              closureType: row.closureType,
              origin: row.origin,
              notes: row.notes,
              isPopular: String(row.isPopular) === "true",
              isBestseller: String(row.isBestseller) === "true",
              isNew: row.isNew === undefined ? true : String(row.isNew) === "true",
              variants: []
            };
            productsMap.set(row.productCode, product);
          }

          const basePrice = Number(row.basePrice) || 0;
          const comparisonPrice = row.comparisonPrice ? Number(row.comparisonPrice) : null;
          const oversizePrice = row.oversizePrice ? Number(row.oversizePrice) : null;
          const oversizeSizes = row.oversizeSizes ? row.oversizeSizes.split(",").map(s => s.trim()) : [];

          const sizes = row.sizes ? row.sizes.split(",").map(s => s.trim()) : [];
          const stocks = row.stocks ? row.stocks.split(",").map(s => Number(s.trim()) || 0) : [];

          const skus = sizes.map((size, index) => {
            const stock = stocks[index] || 0;
            const isOversize = oversizeSizes.includes(size);
            return {
              size,
              stock,
              priceOverride: isOversize ? oversizePrice : null
            };
          });

          product.variants.push({
            color: row.variantColor,
            variantCode: row.variantCode,
            basePrice,
            comparisonPrice,
            discountPercent: row.discountPercent ? Number(row.discountPercent) : null,
            skus
          });
        });

        resolve(Array.from(productsMap.values()));
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};
