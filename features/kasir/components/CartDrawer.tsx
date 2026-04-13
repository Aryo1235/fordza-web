"use client";

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
}: CartDrawerProps) {
  const total = items.reduce(
    (sum, item) => sum + (item.price * item.quantity - item.discountAmount),
    0
  );
  const change = amountPaid - total;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-stone-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <h3 className="font-semibold text-stone-800">Keranjang ({items.length} produk)</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {items.length === 0 ? (
            <p className="text-center text-stone-400 py-8 text-sm">Keranjang kosong</p>
          ) : (
            items.map((item) => (
              <div key={item.productId} className="flex flex-col gap-2 pb-3 border-b border-stone-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">{item.name}</p>
                    <p className="text-xs text-stone-500">
                      Rp {item.price.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onRemove(item.productId)}
                      className="w-7 h-7"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                    <Button
                      size="icon"
                      onClick={() => onAdd(item.productId)}
                      disabled={item.quantity >= item.stock}
                      className="w-7 h-7 bg-[#3C3025] hover:bg-[#5a4a38] text-white"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="text-sm font-semibold w-24 text-right" style={{ color: "#3C3025" }}>
                    <p>Rp {(item.price * item.quantity).toLocaleString("id-ID")}</p>
                    {item.discountAmount > 0 && (
                      <p className="text-[10px] text-red-500">- Rp {item.discountAmount.toLocaleString("id-ID")}</p>
                    )}
                  </div>
                  <button
                    onClick={() => onDelete(item.productId)}
                    className="text-red-400 hover:text-red-600 ml-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Discount Input */}
                <div className="flex items-center gap-2 pl-2">
                   <Label className="text-[10px] text-stone-400 uppercase font-bold">Diskon (Rp):</Label>
                   <Input 
                      type="text"
                      placeholder="0"
                      value={formatNumber(item.discountAmount)}
                      onChange={(e) => onUpdateDiscount(item.productId, parseNumber(e.target.value))}
                      className="h-7 text-xs w-32 bg-amber-50/30 border-amber-100 flex-none"
                   />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer: Customer Info + Total + Bayar */}
        {items.length > 0 && (
          <div className="border-t px-4 py-4 space-y-4 bg-stone-50/50">
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
                <span style={{ color: "#3C3025" }}>Rp {total.toLocaleString("id-ID")}</span>
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
              </div>
            </div>

            <Button
              onClick={onCheckout}
              disabled={isLoading || amountPaid < total || total <= 0}
              className="w-full py-7 text-base font-bold bg-[#3C3025] hover:bg-[#5a4a38] text-white shadow-lg"
            >
              {isLoading ? "Memproses..." : `💳 Konfirmasi & Bayar Rp ${total.toLocaleString("id-ID")}`}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
