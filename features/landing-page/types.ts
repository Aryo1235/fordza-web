/**
 * features/landing-page/types.ts
 * Semua type dan interface khusus untuk landing page publik.
 */

import type { Banner } from "@/features/banners/types";
import type { Product } from "@/features/products/types";

/* ── API Response types ── */

export interface PublicBannersResponse {
  success: boolean;
  data: Banner[];
}

export interface PublicProductsResponse {
  success: boolean;
  data: Product[];
}

/* ── Re-export supaya cukup import dari satu tempat ── */
export type { Banner, Product };
