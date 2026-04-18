"use client";

import { useEffect } from "react";
import { X, Trash2, Minus, Plus } from "lucide-react";
import { formatNumber, parseNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  discountAmount: number;
}

interface CartDrawerProps {
  items: CartItem[];
  onClose: () => void;
  onAdd: (productId: string) => void;
  onRemove: (productId: string) => void;
  onDelete: (productId: string) => void;
  onUpdateDiscount: (productId: string, discount: number) => void;
  amountPaid: number;
  onAmountPaidChange: (value: number) => void;
  customerName: string;
  onCustomerNameChange: (value: string) => void;
  customerPhone: string;
  onCustomerPhoneChange: (value: string) => void;
  onCheckout: () => void;
  isLoading: boolean;
  highlightedProductId?: string | null;
}

export default function CartDrawer({
  items,
  onClose,
  onAdd,
  onRemove,
  onDelete,
  onUpdateDiscount,
  amountPaid,
  onAmountPaidChange,
  customerName,
  onCustomerNameChange,
  customerPhone,
  onCustomerPhoneChange,
  onCheckout,
  isLoading,
  highlightedProductId = null,
}: CartDrawerProps) {
  const total = items.reduce(
    (sum, item) => sum + (item.price * item.quantity - item.discountAmount),
    0
  );
  const change = amountPaid - total;
  const remainingPayment = Math.max(total - amountPaid, 0);
  const hasInvalidDiscount = items.some((item) => item.discountAmount > item.price * item.quantity || item.discountAmount < 0);
  const canCheckout = !isLoading && total > 0 && amountPaid >= total && !hasInvalidDiscount;

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    // Lock page scroll while drawer is open so only cart items scroll.
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-xl shadow-2xl h-[88dvh] max-h-[88dvh] flex flex-col min-h-0 overflow-hidden">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-stone-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b shrink-0">
          <h3 className="font-semibold text-stone-800">Keranjang ({items.length} produk)</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3 space-y-4">
          {items.length === 0 ? (
            <p className="text-center text-stone-400 py-8 text-sm">Keranjang kosong</p>
          ) : (
            items.map((item) => (
              <div
                key={item.productId}
                className={`flex flex-col gap-2 pb-3 border-b border-stone-100 last:border-0 rounded-md transition-colors ${
                  highlightedProductId === item.productId ? "bg-amber-50/70" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">{item.name}</p>
                    <p className="text-xs text-stone-500">Rp {item.price.toLocaleString("id-ID")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onRemove(item.productId)}
                      className="h-9 w-9"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                    <Button
                      size="icon"
                      onClick={() => onAdd(item.productId)}
                      disabled={item.quantity >= item.stock}
                      className="h-9 w-9 bg-[#3C3025] hover:bg-[#5a4a38] text-white"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="text-sm font-semibold w-24 text-right text-[#3C3025]">
                    <p>Rp {(item.price * item.quantity).toLocaleString("id-ID")}</p>
                    {item.discountAmount > 0 && (
                      <p className="text-[11px] text-red-500">- Rp {item.discountAmount.toLocaleString("id-ID")}</p>
                    )}
                  </div>
                  <button
                    onClick={() => onDelete(item.productId)}
                    className="text-red-400 hover:text-red-600 ml-1 p-1"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Discount Input */}
                <div className="flex items-center gap-2 pl-2">
                   <Label className="text-[10px] text-stone-500 uppercase font-semibold">Diskon</Label>
                   <Input 
                      type="text"
                      placeholder="0"
                      value={formatNumber(item.discountAmount)}
                      onChange={(e) => onUpdateDiscount(item.productId, parseNumber(e.target.value))}
                      className="h-8 text-xs w-32 bg-white border-stone-200 flex-none"
                   />
                </div>
                {item.discountAmount > item.price * item.quantity && (
                  <p className="text-[11px] text-red-500 pl-2">
                    Diskon melebihi subtotal item.
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer: Customer Info + Total + Bayar */}
        {items.length > 0 && (
          <div className="border-t px-4 py-4 space-y-4 bg-stone-50/50 shrink-0">
            {/* Customer Data Section */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] text-stone-500 uppercase font-bold">Nama Pelanggan</Label>
                <Input 
                  placeholder="Opsional"
                  value={customerName}
                  onChange={(e) => onCustomerNameChange(e.target.value)}
                  className="h-9 text-xs bg-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-stone-500 uppercase font-bold">No. HP</Label>
                <Input 
                  placeholder="Opsional"
                  value={customerPhone}
                  onChange={(e) => onCustomerPhoneChange(e.target.value)}
                  className="h-9 text-xs bg-white"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-stone-200">
              <div className="flex justify-between font-bold text-base">
                <span>Total Tagihan</span>
                <span className="text-[#3C3025]">Rp {total.toLocaleString("id-ID")}</span>
              </div>
              
              <div>
                <Label className="text-xs text-stone-500 mb-1">Nominal Bayar</Label>
                <Input
                  type="text"
                  value={formatNumber(amountPaid)}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^[0-9.]*$/.test(val)) {
                      onAmountPaidChange(parseNumber(val));
                    }
                  }}
                  placeholder="0"
                  className="bg-white h-11 text-lg font-bold"
                />
                {amountPaid >= total && total > 0 && (
                  <p className="text-xs text-green-600 mt-1 font-medium bg-green-50 px-2 py-1 rounded">
                    Kembalian: Rp {change.toLocaleString("id-ID")}
                  </p>
                )}
                {amountPaid > 0 && amountPaid < total && (
                  <p className="text-xs text-red-500 mt-1">
                    Kurang bayar Rp {remainingPayment.toLocaleString("id-ID")}
                  </p>
                )}
                {hasInvalidDiscount && (
                  <p className="text-xs text-red-500 mt-1">
                    Cek diskon item, ada yang melebihi subtotal.
                  </p>
                )}
              </div>
            </div>

            <Button
              onClick={onCheckout}
              disabled={!canCheckout}
              className={`w-full py-7 text-base font-bold shadow-lg ${
                canCheckout
                  ? "bg-[#3C3025] hover:bg-[#5a4a38] text-white"
                  : "bg-stone-200 text-stone-500"
              }`}
            >
              {isLoading
                ? "Memproses transaksi..."
                : canCheckout
                  ? `Konfirmasi Bayar Rp ${total.toLocaleString("id-ID")}`
                  : amountPaid < total
                    ? `Kurang Rp ${remainingPayment.toLocaleString("id-ID")}`
                    : "Lengkapi data pembayaran"}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
