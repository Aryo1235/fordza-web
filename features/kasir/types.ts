// features/kasir/types.ts

export interface Product {
  id: string;
  productCode: string | null;
  name: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  category: string | null;
}

export interface CartItem extends Product {
  quantity: number;
  discountAmount: number; // Diskon nominal (Rp)
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
  }[];
}

export interface CheckoutItem {
  productId: string;
  quantity: number;
  discountAmount: number;
}

export interface CheckoutPayload {
  items: CheckoutItem[];
  amountPaid: number;
  customerName?: string;
  customerPhone?: string;
}
