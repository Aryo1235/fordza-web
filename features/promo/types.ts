// features/promo/types.ts

export type PromoType = "PERCENTAGE" | "NOMINAL";
export type PromoTarget = "GLOBAL" | "CATEGORY" | "PRODUCT";

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
