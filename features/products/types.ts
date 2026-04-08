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
  careInstructions?: string | null;
  material?: string | null;
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

export interface Product {
  id: string;
  name: string;
  shortDescription: string;
  price: number | string;
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
