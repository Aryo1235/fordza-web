// features/kasir/types.ts

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  category: string | null;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Transaction {
  id: string;
  invoiceNo: string;
  totalPrice: number;
  amountPaid: number;
  change: number;
  status: "PAID" | "VOID";
  createdAt: string;
  kasir?: {
    name?: string;
    username: string;
  };
  items: { id: string; productName: string; quantity: number; priceAtSale: number }[];
}
