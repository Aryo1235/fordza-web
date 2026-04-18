// features/products/types.ts
// Semua interface & type yang terkait fitur produk

export interface ProductImage {
  id: string;
  url: string;
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
  isActive: boolean;
  variantId: string;
}

export interface ProductVariant {
  id: string;
  variantCode: string;
  color: string;
  basePrice: number;
  comparisonPrice?: number | null;
  discountPercent?: number | null;
  isActive: boolean;
  skus: ProductSku[];
  images: { id: string; url: string }[];
}

export interface Product {
  id: string;
  productCode: string;
  name: string;
  shortDescription: string;
  price?: number | string | null;       // Nullable: fallback dari varian termurah
  discountPercent?: number | null;
  stock: number;                         // Cached total semua SKU
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
  variants: ProductVariant[];           // Daftar varian warna + SKU
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
};
