// features/promo/types.ts

export type PromoType = "PERCENTAGE" | "NOMINAL";
export type PromoTarget = "GLOBAL" | "CATEGORY" | "PRODUCT" | "VARIANT";

export interface Promo {
  id: string;
  name: string;
  description?: string | null;
  type: PromoType;
  value: number;
  targetType: PromoTarget;
  targetIds: string[];
  minPurchase: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  // Populated fields from backend resolution
  targets?: Array<{ id: string; name: string; code?: string }>;
  createdBy?: { name: string | null; username: string } | null;
  updatedBy?: { name: string | null; username: string } | null;
}

export interface CreatePromoInput {
  name: string;
  type: PromoType;
  value: number;
  targetType: PromoTarget;
  targetIds: string[];
  minPurchase?: number;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

/** Filter untuk halaman publik promo */
export interface PromoProductFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  search?: string;
}
