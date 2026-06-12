import * as XLSX from "xlsx";

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
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error("File data is empty");
        }
        
        // Membaca workbook menggunakan ArrayBuffer
        const workbook = XLSX.read(data, { type: "array" });
        
        // Mengambil nama sheet pertama
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Mengonversi sheet ke bentuk array of objects JSON
        const rows = XLSX.utils.sheet_to_json<BulkProductRow>(worksheet, { defval: "" });
        const productsMap = new Map<string, BulkProduct>();

        rows.forEach((row) => {
          const productCode = row.productCode ? String(row.productCode).trim() : "";
          const name = row.name ? String(row.name).trim() : "";
          
          if (!productCode || !name) return;

          let product = productsMap.get(productCode);
          if (!product) {
            const catIdsStr = row.categoryIds !== undefined && row.categoryIds !== null ? String(row.categoryIds) : "";
            product = {
              productCode,
              name,
              shortDescription: row.shortDescription ? String(row.shortDescription) : "",
              productType: row.productType ? String(row.productType).trim() : "shoes",
              gender: row.gender ? String(row.gender).trim() : "Unisex",
              categoryIds: catIdsStr ? catIdsStr.split(",").map(id => id.trim()) : [],
              sizeTemplateId: row.sizeTemplateId ? String(row.sizeTemplateId).trim() : "",
              material: row.material ? String(row.material) : "",
              outsole: row.outsole ? String(row.outsole) : undefined,
              insole: row.insole ? String(row.insole) : undefined,
              closureType: row.closureType ? String(row.closureType) : undefined,
              origin: row.origin ? String(row.origin) : undefined,
              notes: row.notes ? String(row.notes) : undefined,
              isPopular: String(row.isPopular) === "true",
              isBestseller: String(row.isBestseller) === "true",
              isNew: row.isNew === undefined || row.isNew === "" ? true : String(row.isNew) === "true",
              variants: []
            };
            productsMap.set(productCode, product);
          }

          const basePrice = Number(row.basePrice) || 0;
          const comparisonPrice = row.comparisonPrice ? Number(row.comparisonPrice) : null;
          const oversizePrice = row.oversizePrice ? Number(row.oversizePrice) : null;
          
          const oversizeSizesStr = row.oversizeSizes !== undefined && row.oversizeSizes !== null ? String(row.oversizeSizes) : "";
          const oversizeSizes = oversizeSizesStr ? oversizeSizesStr.split(",").map(s => s.trim()) : [];

          const sizesStr = row.sizes !== undefined && row.sizes !== null ? String(row.sizes) : "";
          const stocksStr = row.stocks !== undefined && row.stocks !== null ? String(row.stocks) : "";

          const sizes = sizesStr ? sizesStr.split(",").map(s => s.trim()) : [];
          const stocks = stocksStr ? stocksStr.split(",").map(s => Number(s.trim()) || 0) : [];

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
            color: row.variantColor ? String(row.variantColor).trim() : "Default",
            variantCode: row.variantCode ? String(row.variantCode).trim() : "",
            basePrice,
            comparisonPrice,
            discountPercent: row.discountPercent ? Number(row.discountPercent) : null,
            skus
          });
        });

        resolve(Array.from(productsMap.values()));
      } catch (err) {
        reject(err);
      }
    };
    
    reader.onerror = (err) => {
      reject(err);
    };
    
    reader.readAsArrayBuffer(file);
  });
};
