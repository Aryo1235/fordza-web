"use client";

import { useEffect } from "react";
import { X, Trash2, Minus, Plus } from "lucide-react";
import { cn, formatNumber, parseNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { type CartItem } from "../types";

interface CartDrawerProps {
  items: CartItem[];
  onClose: () => void;
  onAdd: (id: string, skuId?: string) => void;
  onRemove: (id: string, skuId?: string) => void;
  onDelete: (id: string, skuId?: string) => void;
  amountPaid: number;
  onAmountPaidChange: (value: number) => void;
  customerName: string;
  onCustomerNameChange: (value: string) => void;
  customerPhone: string;
  onCustomerPhoneChange: (value: string) => void;
  onCheckout: () => void;
  isLoading: boolean;
  highlightedProductId?: string | null;
  paymentMethod?: "CASH" | "DEBIT" | "QRIS";
  onPaymentMethodChange?: (method: "CASH" | "DEBIT" | "QRIS") => void;
}

export default function CartDrawer({
  items,
  onClose,
  onAdd,
  onRemove,
  onDelete,
  amountPaid,
  onAmountPaidChange,
  customerName,
  onCustomerNameChange,
  customerPhone,
  onCustomerPhoneChange,
  onCheckout,
  isLoading,
  highlightedProductId = null,
  paymentMethod = "CASH",
  onPaymentMethodChange,
}: CartDrawerProps) {
  // ✅ FIX: Hitung subtotal dulu untuk cek minPurchase dengan konversi tipe yang aman
  const subtotal = items.reduce((sum, item) => sum + Number(item.price ?? 0) * item.quantity, 0);
  
  console.log("🛒 [CartDrawer] Subtotal:", subtotal);
  console.log("🛒 [CartDrawer] Items:", items.map(item => ({
    name: item.name,
    price: Number(item.price ?? 0),
    qty: item.quantity,
    discountAmount: Number(item.discountAmount ?? 0),
    promoName: item.promoName,
    promoMinPurchase: Number(item.promoMinPurchase ?? 0),
  })));
  
  // ✅ Hitung diskon item langsung (non-conditional fixed + percentage)
  const itemDiscountTotal = items.reduce((sum, item) => {
    const discountAmt = Number(item.discountAmount ?? 0);
    const minP = Number(item.promoMinPurchase ?? 0);
    const isPercentage = Number(item.promoDiscountPercent ?? 0) > 0;
    const isConditionalFixed = minP > 0 && !isPercentage;
    
    if (discountAmt > 0 && !isConditionalFixed) {
      return sum + discountAmt * item.quantity;
    }
    return sum;
  }, 0);

  // ✅ Hitung diskon promo bersyarat (conditional fixed)
  const promoDiscountTotal = items.reduce((sum, item) => {
    const discountAmt = Number(item.discountAmount ?? 0);
    const minP = Number(item.promoMinPurchase ?? 0);
    const isPercentage = Number(item.promoDiscountPercent ?? 0) > 0;
    const isConditionalFixed = minP > 0 && !isPercentage;
    const meetsRequirement = minP > 0 ? subtotal >= minP : true;
    
    if (discountAmt > 0 && isConditionalFixed && meetsRequirement) {
      return sum + discountAmt;
    }
    return sum;
  }, 0);

  // ✅ FIX: Hitung total dengan validasi minPurchase
  const total = subtotal - itemDiscountTotal - promoDiscountTotal;
  
  console.log("🛒 [CartDrawer] Total setelah discount:", total);
  
  const change = amountPaid - total;
  const remainingPayment = Math.max(total - amountPaid, 0);
  const hasInvalidDiscount = items.some((item) => item.discountAmount > item.price * item.quantity || item.discountAmount < 0);
  const canCheckout = !isLoading && total > 0 && amountPaid >= total && !hasInvalidDiscount;

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      />

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-xl shadow-2xl h-[88dvh] max-h-[88dvh] flex flex-col min-h-0 overflow-hidden">
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-stone-300 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-b shrink-0">
          <h3 className="font-semibold text-stone-800">Keranjang ({items.length} produk)</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3 space-y-4">
          {items.length === 0 ? (
            <p className="text-center text-stone-400 py-8 text-sm">Keranjang kosong</p>
          ) : (
            items.map((item) => {
              const itemKey = item.skuId ? `${item.id}-${item.skuId}` : item.id;
              
              // Hitung diskon aktif berdasarkan minPurchase dengan konversi tipe yang aman
              const itemPrice = Number(item.price ?? 0);
              const discountAmt = Number(item.discountAmount ?? 0);
              const minP = Number(item.promoMinPurchase ?? 0);
              const meetsRequirement = minP > 0 ? subtotal >= minP : true;
              
              const isPercentage = Number(item.promoDiscountPercent ?? 0) > 0;
              const isConditionalFixed = minP > 0 && !isPercentage;
              
              let lineDiscount = 0;
              let lineDiscountAmt = 0;
              
              if (discountAmt > 0) {
                if (isConditionalFixed) {
                  lineDiscountAmt = discountAmt;
                  lineDiscount = meetsRequirement ? discountAmt : 0;
                } else {
                  lineDiscountAmt = discountAmt * item.quantity;
                  lineDiscount = meetsRequirement ? discountAmt * item.quantity : 0;
                }
              }

              return (
              <div
                key={itemKey}
                className={`flex flex-col gap-2 pb-3 border-b border-stone-100 last:border-0 rounded-md transition-colors ${
                  highlightedProductId === itemKey ? "bg-amber-50/70" : ""
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-stone-800 leading-tight mb-0.5 truncate" title={item.name}>{item.name}</p>
                    {item.variantCode && (
                       <div className="flex items-center gap-1.5 mb-1.5 font-mono">
                          <span className="text-[9px] bg-stone-100 px-1 rounded text-stone-500 font-bold uppercase">{item.variantCode}</span>
                          <span className="text-[10px] text-stone-400">{item.variantColor} / {item.skuSize}</span>
                       </div>
                    )}
                    <p className="text-xs text-stone-500 font-semibold">Rp {itemPrice.toLocaleString("id-ID")}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onRemove(item.id, item.skuId || undefined)}
                      className="h-8 w-8"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                    <Button
                      size="icon"
                      onClick={() => onAdd(item.id, item.skuId || undefined)}
                      disabled={item.quantity >= item.stock}
                      className="h-8 w-8 bg-[#3C3025] hover:bg-[#5a4a38] text-white"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="text-sm font-bold w-24 text-right text-[#3C3025]">
                    <p>Rp {(itemPrice * item.quantity).toLocaleString("id-ID")}</p>
                    {!isConditionalFixed && lineDiscount > 0 ? (
                      <p className="text-[11px] text-red-500">- Rp {lineDiscount.toLocaleString("id-ID")}</p>
                    ) : !isConditionalFixed && lineDiscountAmt > 0 ? (
                      <p className="text-[11px] text-stone-400 line-through">- Rp {lineDiscountAmt.toLocaleString("id-ID")}</p>
                    ) : null}
                  </div>
                  
                  <button
                    onClick={() => onDelete(item.id, item.skuId || undefined)}
                    className="text-red-300 hover:text-red-500 ml-1 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {discountAmt > 0 && (
                  <div className="flex items-center gap-2 pl-1">
                    <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tight ${
                      lineDiscount > 0
                        ? "bg-red-50 text-red-600"
                        : "bg-stone-100 text-stone-400"
                    }`}>
                      {item.promoName || "Promo Admin"}{" - "}
                      {isPercentage 
                        ? `Diskon ${Math.round(Number(item.promoDiscountPercent ?? 0))}% ` 
                        : isConditionalFixed
                          ? `Potongan Flat Rp ${discountAmt.toLocaleString("id-ID")} `
                          : `Potongan Rp ${discountAmt.toLocaleString("id-ID")} `
                      }
                      {isConditionalFixed
                        ? lineDiscount > 0
                          ? `(Aktif di Total)`
                          : `(Min. Rp ${minP.toLocaleString("id-ID")} - Belum Terpenuhi)`
                        : lineDiscount > 0
                          ? `(-Rp ${lineDiscount.toLocaleString("id-ID")})`
                          : `(Min. Rp ${minP.toLocaleString("id-ID")} - Belum Terpenuhi)`
                      }
                    </div>
                  </div>
                )}
              </div>
            )})
          )}
        </div>

        <div className="border-t px-4 py-4 space-y-4 bg-stone-50/50 shrink-0">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] text-stone-500 uppercase font-black">Pelanggan</Label>
              <Input 
                placeholder="Nama"
                value={customerName}
                onChange={(e) => onCustomerNameChange(e.target.value)}
                className="h-9 text-xs bg-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-stone-500 uppercase font-black">No. HP</Label>
              <Input 
                placeholder="08..."
                value={customerPhone}
                onChange={(e) => onCustomerPhoneChange(e.target.value)}
                className="h-9 text-xs bg-white"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-stone-200">
            {/* Breakdown */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-500 font-medium">
                <span>Subtotal</span>
                <span>Rp {subtotal.toLocaleString("id-ID")}</span>
              </div>
              {itemDiscountTotal > 0 && (
                <div className="flex justify-between text-stone-400 font-medium">
                  <span>Diskon Produk</span>
                  <span>- Rp {itemDiscountTotal.toLocaleString("id-ID")}</span>
                </div>
              )}
              {promoDiscountTotal > 0 && (
                <div className="flex justify-between text-red-500 font-semibold bg-red-50/50 px-1.5 py-1 rounded">
                  <span>Promo Bersyarat</span>
                  <span>- Rp {promoDiscountTotal.toLocaleString("id-ID")}</span>
                </div>
              )}
              
              <div className="flex justify-between font-bold text-sm pt-2 border-t border-stone-150">
                <span className="text-stone-500">Total Akhir</span>
                <span className="text-[#3C3025] text-base font-black">Rp {total.toLocaleString("id-ID")}</span>
              </div>
            </div>
            
            {/* Metode Pembayaran */}
            <div className="space-y-1.5">
              <Label className="text-[10px] text-stone-500 uppercase font-black">Metode Pembayaran</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["CASH", "DEBIT", "QRIS"] as const).map((method) => (
                  <Button
                    key={method}
                    type="button"
                    variant="outline"
                    onClick={() => onPaymentMethodChange?.(method)}
                    className={cn(
                      "h-9 text-xs font-bold transition-all rounded-lg",
                      paymentMethod === method
                        ? "bg-[#3C3025] text-white hover:bg-[#3C3025] border-transparent"
                        : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                    )}
                  >
                    {method}
                  </Button>
                ))}
              </div>
            </div>

            {/* Bayar Tunai */}
            <div className="space-y-1.5">
              <Label className="text-[10px] text-stone-500 uppercase font-black">
                {paymentMethod === "CASH" ? "Bayar Tunai (Rp)" : `Uang Diterima (${paymentMethod})`}
              </Label>
              <Input
                type="text"
                value={formatNumber(amountPaid)}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^[0-9.]*$/.test(val)) {
                    onAmountPaidChange(parseNumber(val));
                  }
                }}
                disabled={paymentMethod !== "CASH"}
                placeholder="0"
                className={cn(
                  "bg-white h-10 text-lg font-bold",
                  paymentMethod !== "CASH" && "bg-stone-50 text-stone-400 border-stone-200"
                )}
              />
              {paymentMethod === "CASH" && amountPaid >= total && total > 0 && (
                <div className="flex justify-between items-center text-xs text-green-700 font-bold bg-green-50 px-2 py-1.5 rounded">
                  <span>Kembalian:</span>
                  <span>Rp {change.toLocaleString("id-ID")}</span>
                </div>
              )}
              {paymentMethod === "CASH" && amountPaid > 0 && amountPaid < total && (
                <p className="text-[10px] text-red-500 font-bold">Kurang: Rp {remainingPayment.toLocaleString("id-ID")}</p>
              )}
            </div>
          </div>

          <Button
            onClick={onCheckout}
            disabled={!canCheckout}
            className={`w-full py-6 text-sm font-black tracking-wide ${
              canCheckout
                ? "bg-[#3C3025] hover:bg-[#5a4a38] text-white"
                : "bg-stone-200 text-stone-500"
            }`}
          >
            {isLoading
              ? "MEMPROSES..."
              : canCheckout
                ? `BAYAR Rp ${total.toLocaleString("id-ID")}`
                : "PENDING"}
          </Button>
        </div>
      </div>
    </>
  );
}
