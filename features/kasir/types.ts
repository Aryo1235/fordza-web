// features/kasir/types.ts

// Mewakili 1 varian warna dengan daftar SKU ukurannya
export interface ProductVariantForKasir {
  id: string;
  variantCode: string;
  color: string;
  material?: string | null;
  basePrice: number;
  comparisonPrice?: number | null;
  discountPercent?: number | null;
  skus: {
    id: string;
    size: string;
    stock: number;
    priceOverride?: number | null; // null = pakai basePrice
    finalPrice?: number;           // Harga setelah diskon promo
  }[];
  images: { url: string }[];
  
  // Data promo otomatis dari backend
  additionalDiscount?: number;
  promoName?: string | null;
  finalPrice?: number;
}

// Produk yang ditampilkan di grid POS
export interface Product {
  id: string;
  productCode: string | null;
  name: string;
  price: number;           // Harga terendah dari semua varian (untuk display)
  stock: number;           // Cached total
  imageUrl: string | null;
  category: string | null;
  hasVariants: boolean;    // TRUE jika produk punya varian (tampilkan modal pilih varian)
  variants: ProductVariantForKasir[];
}

// 1 item di keranjang belanja — sudah termasuk pilihan varian & SKU
export interface CartItem {
  // Data produk induk
  id: string;              // productId
  productCode: string | null;
  name: string;            // Misal: "Pantofel Fordza - Hitam / 42"
  imageUrl: string | null;
  category: string | null;

  // Data SKU yang dipilih
  price: number;           // Harga yang berlaku (priceOverride ?? basePrice)
  stock: number;           // Stok SKU yang dipilih
  quantity: number;
  discountAmount: number;  // Diskon nominal per item (Rp) - Sekarang otomatis dari Admin
  promoName: string | null; // Nama promo yang aktif
  comparisonPriceAtSale: number | null; // Harga gimmick (coretan) saat transaksi

  // Referensi varian & SKU
  variantId: string | null;
  variantColor: string | null;
  skuId: string | null;
  skuSize: string | null;
  variantCode: string | null;
}

export interface Transaction {
  id: string;
  invoiceNo: string;
  totalPrice: number;
  amountPaid: number;
  change: number;
  status: "PAID" | "VOID";
  customerName?: string;
  customerPhone?: string;
  createdAt: string;
  kasir?: {
    name?: string;
    username: string;
  };
  items: {
    id: string;
    productName: string;
    quantity: number;
    priceAtSale: number;
    discountAmount: number;
    promoName?: string | null;
    comparisonPriceAtSale?: number | null;
    variantColor?: string | null;
    skuSize?: string | null;
  }[];
}

// Payload yang dikirim ke API checkout
export interface CheckoutItem {
  productId: string;
  quantity: number;
  discountAmount: number;
  promoName?: string | null;
  comparisonPriceAtSale?: number | null;
  variantId?: string | null;
  skuId?: string | null;
}

export interface CheckoutPayload {
  items: CheckoutItem[];
  amountPaid: number;
  customerName?: string;
  customerPhone?: string;
}
