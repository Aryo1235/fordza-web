"use client";

import { X, Trash2, Minus, Plus } from "lucide-react";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

interface CartDrawerProps {
  items: CartItem[];
  onClose: () => void;
  onAdd: (productId: string) => void;
  onRemove: (productId: string) => void;
  onDelete: (productId: string) => void;
  amountPaid: number;
  onAmountPaidChange: (value: number) => void;
  onCheckout: () => void;
  isLoading: boolean;
}

export default function CartDrawer({
  items,
  onClose,
  onAdd,
  onRemove,
  onDelete,
  amountPaid,
  onAmountPaidChange,
  onCheckout,
  isLoading,
}: CartDrawerProps) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const change = amountPaid - total;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-xl shadow-2xl max-h-[80vh] flex flex-col">
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
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {items.length === 0 ? (
            <p className="text-center text-stone-400 py-8 text-sm">Keranjang kosong</p>
          ) : (
            items.map((item) => (
              <div key={item.productId} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">{item.name}</p>
                  <p className="text-xs text-stone-500">
                    Rp {item.price.toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onRemove(item.productId)}
                    className="w-7 h-7 flex items-center justify-center rounded-sm border border-stone-300 hover:bg-stone-100"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                  <button
                    onClick={() => onAdd(item.productId)}
                    disabled={item.quantity >= item.stock}
                    className="w-7 h-7 flex items-center justify-center rounded-sm text-white disabled:opacity-40"
                    style={{ backgroundColor: "#3C3025" }}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-sm font-semibold w-24 text-right" style={{ color: "#3C3025" }}>
                  Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                </p>
                <button
                  onClick={() => onDelete(item.productId)}
                  className="text-red-400 hover:text-red-600 ml-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer: Total + Bayar */}
        {items.length > 0 && (
          <div className="border-t px-4 py-4 space-y-3">
            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span style={{ color: "#3C3025" }}>Rp {total.toLocaleString("id-ID")}</span>
            </div>
            <div>
              <label className="text-xs text-stone-500 mb-1 block">Nominal Bayar</label>
              <input
                type="number"
                value={amountPaid || ""}
                onChange={(e) => onAmountPaidChange(Number(e.target.value))}
                placeholder="Masukkan jumlah uang..."
                className="w-full border border-stone-300 rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1"
                style={{ focusRingColor: "#3C3025" } as any}
              />
              {amountPaid >= total && (
                <p className="text-xs text-green-600 mt-1 font-medium">
                  Kembalian: Rp {change.toLocaleString("id-ID")}
                </p>
              )}
            </div>
            <button
              onClick={onCheckout}
              disabled={isLoading || amountPaid < total}
              className="w-full py-3 text-sm font-bold text-white rounded-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#3C3025" }}
            >
              {isLoading ? "Memproses..." : `💳 Bayar Rp ${total.toLocaleString("id-ID")}`}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
