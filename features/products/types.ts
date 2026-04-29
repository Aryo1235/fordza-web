// features/products/types.ts
// Semua interface & type yang terkait fitur produk

export interface ProductImage {
  id: string;
  url: string;
  key?: string | null;
}

export interface ProductCategory {
  category: {
    id: string;
    name: string;
    imageUrl?: string;
  };
}

export interface ProductDetail {
  description: string;
  notes?: string | null;
  material?: string | null;
  upper?: string | null;
  lining?: string | null;
  insole?: string | null;
  closureType?: string | null;
  outsole?: string | null;
  origin?: string | null;
  sizeTemplateId?: string | null;
  sizeTemplate?: {
    id: string;
    name: string;
    type: string;
    sizes: string[];
  } | null;
}

export interface ProductSku {
  id: string;
  size: string;
  stock: number;
  priceOverride?: number | null; // null = pakai basePrice varian
  finalPrice?: number | null;   // Harga akhir setelah diskon promo
  isActive: boolean;
  variantId: string;
}

export interface ProductVariant {
  id: string;
  variantCode: string;
  color: string;
  basePrice: number;
  comparisonPrice?: number | null;
  highestPrice?: number | null;         // Harga tertinggi untuk dicoret (Gimmick vs Asli)
  finalPrice?: number | null;           // Harga setelah diskon promo
  discountPercent?: number | null;
  totalDiscountPercent?: number | null; // Agregasi Gimmick % + Promo %
  promoDiscountPercent?: number | null; // Diskon promo murni
  promoName?: string | null;            // Nama promo aktif
  isPromoConditional?: boolean;         // Flag jika butuh minPurchase
  isActive: boolean;
  skus: ProductSku[];
  images: ProductImage[];
}

export interface Product {
  id: string;
  productCode: string;
  name: string;
  shortDescription: string;
  price?: number | string | null;
  finalPrice?: number | null;           // Harga termurah dari varian (setelah promo)
  highestPrice?: number | null;         // Harga tertinggi untuk referensi coret lead
  totalDiscountPercent?: number | null; // Diskon tertinggi untuk lencana kartu
  promoName?: string | null;            // Nama promo aktif (lead)
  stock: number;
  productType: string;
  gender: string;
  isPopular: boolean;
  isBestseller: boolean;
  isNew: boolean;
  isActive: boolean;
  avgRating: number;
  totalReviews: number;
  createdAt: string;
  images: ProductImage[];
  categories: ProductCategory[];
  variants: ProductVariant[];
  detail?: ProductDetail | null;
}

export interface ProductListMeta {
  totalItems: number;
  totalPage: number;
  currentPage: number;
  limit: number;
}

export interface ProductListResponse {
  success: boolean;
  data: Product[];
  meta: ProductListMeta;
}

export type ProductFilters = {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  gender?: string;
  isPopular?: boolean;
  isBestseller?: boolean;
  isNew?: boolean;
  minPrice?: number;
  maxPrice?: number;
};
