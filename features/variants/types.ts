// features/variants/types.ts
// Semua interface & type yang terkait fitur Varian dan SKU

/** 1 SKU = 1 kombinasi ukuran spesifik dalam sebuah varian warna */
export interface ProductSku {
  id: string;
  size: string;
  stock: number;
  priceOverride: number | null; // null = pakai basePrice varian
  isActive: boolean;
  variantId: string;
  createdAt?: string;
  updatedAt?: string;
}

/** 1 Varian = 1 warna produk (dengan material & harga dasar sendiri) */
export interface ProductVariant {
  id: string;
  variantCode: string;
  color: string;
  basePrice: number;
  comparisonPrice: number | null;
  highestPrice?: number | null;         // Harga tertinggi untuk dicoret
  finalPrice?: number | null;           // Harga bayar setelah promo
  totalDiscountPercent?: number | null; // Total % gabungan
  promoName?: string | null;            // Nama promo aktif
  isPromoConditional?: boolean;         // Flag syarat belanja minimal
  isActive: boolean;
  productId: string;
  skus: ProductSku[];
  images: VariantImage[];
  createdAt?: string;
  updatedAt?: string;
}

export interface VariantImage {
  id: string;
  url: string;
  key: string;
}

// --- Payload untuk API calls ---

export interface CreateVariantPayload {
  color: string;
  colorCode?: string | null;  // Suffix kode unik, cth: "HTM", "CKL" → variantCode: FDZ-001-HTM
  basePrice: number;
  comparisonPrice?: number | null;
  discountPercent?: number | null;
  isActive?: boolean;
  skus?: CreateSkuPayload[];
  images?: { url: string; key: string }[];
}

export interface UpdateVariantPayload {
  color?: string;
  colorCode?: string | null;
  basePrice?: number;
  comparisonPrice?: number | null;
  discountPercent?: number | null;
  isActive?: boolean;
  skus?: CreateSkuPayload[];
  images?: { url: string; key: string }[];
}

export interface CreateSkuPayload {
  size: string;
  stock: number;
  priceOverride?: number | null;
  isActive?: boolean;
}

export interface UpdateSkuPayload {
  stock?: number;
  priceOverride?: number | null;
  isActive?: boolean;
}
