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
  const subtotal = items.reduce((sum, item) => sum + Number(item.price ?? 0) * item.quantity, 0);
  const totalDiscount = items.reduce((sum, item) => sum + Number((item as any).lineDiscount ?? 0), 0);

  const itemDiscountTotal = items.reduce((sum, item) => {
    const minP = Number(item.promoMinPurchase ?? 0);
    const isGlobalNominal = item.promoTargetType === "GLOBAL" && Number(item.promoDiscountPercent ?? 0) === 0;
    if (minP > 0 || isGlobalNominal) return sum;
    return sum + Number((item as any).lineDiscount ?? 0);
  }, 0);

  const promoDiscountTotal = items.reduce((sum, item) => {
    const minP = Number(item.promoMinPurchase ?? 0);
    const isGlobalNominal = item.promoTargetType === "GLOBAL" && Number(item.promoDiscountPercent ?? 0) === 0;
    if (minP > 0 || isGlobalNominal) {
      return sum + Number((item as any).lineDiscount ?? 0);
    }
    return sum;
  }, 0);

  const total = subtotal - totalDiscount;
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
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-xl shadow-2xl h-[90dvh] max-h-[90dvh] flex flex-col overflow-hidden">
        {/* Handle + Header */}
        <div className="flex justify-center pt-2 pb-0.5 shrink-0">
          <div className="w-10 h-1 bg-stone-300 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-3 pb-1.5 shrink-0">
          <h3 className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">
            Keranjang <span className="text-stone-400">({items.length})</span>
          </h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 p-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable items */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-1 space-y-1.5">
          {items.length === 0 ? (
            <p className="text-center text-stone-400 py-6 text-xs">Keranjang kosong</p>
          ) : (
            items.map((item) => {
              const itemKey = item.skuId ? `${item.id}-${item.skuId}` : item.id;
              const itemPrice = Number(item.price ?? 0);
              const discountAmt = Number(item.discountAmount ?? 0);
              const minP = Number(item.promoMinPurchase ?? 0);
              const meetsRequirement = minP > 0 ? subtotal >= minP : true;
              const isPercentage = Number(item.promoDiscountPercent ?? 0) > 0;

              let lineDiscount = 0;
              let lineDiscountAmt = 0;
              if (discountAmt > 0) {
                if (isPercentage) {
                  lineDiscountAmt = discountAmt * item.quantity;
                  lineDiscount = meetsRequirement ? discountAmt * item.quantity : 0;
                } else {
                  lineDiscountAmt = discountAmt;
                  lineDiscount = meetsRequirement ? discountAmt : 0;
                }
              }

              return (
                <div key={itemKey} className={`flex items-start gap-1.5 pb-2 border-b border-stone-100 last:border-0 ${highlightedProductId === itemKey ? "bg-amber-50/50 -mx-1.5 px-1.5 rounded" : ""}`}>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-stone-800 truncate">{item.name}</p>
                    {item.variantCode && (
                      <p className="text-[9px] text-stone-400 font-mono">{item.variantCode} · {item.variantColor}/{item.skuSize}</p>
                    )}
                    <p className="text-[10px] text-stone-500">Rp {itemPrice.toLocaleString("id-ID")}</p>
                    {discountAmt > 0 && lineDiscount > 0 && (
                      <p className="text-[9px] text-red-500 font-bold">{item.promoName || "Promo"} -Rp{lineDiscount.toLocaleString("id-ID")}</p>
                    )}
                  </div>
                  {/* Quantity */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => onRemove(item.id, item.skuId || undefined)} className="w-7 h-7 flex items-center justify-center rounded border border-stone-200 text-stone-500 hover:bg-stone-100"><Minus className="w-3 h-3" /></button>
                    <span className="w-5 text-center text-[11px] font-bold">{item.quantity}</span>
                    <button onClick={() => onAdd(item.id, item.skuId || undefined)} disabled={item.quantity >= item.stock} className="w-7 h-7 flex items-center justify-center rounded bg-[#3C3025] text-white hover:bg-[#5a4a38] disabled:opacity-30"><Plus className="w-3 h-3" /></button>
                  </div>
                  {/* Total */}
                  <div className="text-right w-20 shrink-0">
                    <p className="text-[11px] font-bold text-[#3C3025]">Rp{(itemPrice * item.quantity).toLocaleString("id-ID")}</p>
                    {lineDiscount > 0 && <p className="text-[9px] text-red-500">-Rp{lineDiscount.toLocaleString("id-ID")}</p>}
                  </div>
                  {/* Delete */}
                  <button onClick={() => onDelete(item.id, item.skuId || undefined)} className="text-stone-300 hover:text-red-500 p-0.5 shrink-0">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer — PINDAHKAN scroll ke atas, footer FIXED */}
        <div className="shrink-0 border-t border-stone-200 bg-white px-3 pt-2 pb-3 space-y-2">
          {/* Customer */}
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Nama" value={customerName} onChange={(e) => onCustomerNameChange(e.target.value)} className="h-8 text-[11px] px-2 rounded border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400" />
            <input placeholder="08..." value={customerPhone} onChange={(e) => onCustomerPhoneChange(e.target.value)} className="h-8 text-[11px] px-2 rounded border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400" />
          </div>

          {/* Breakdown + Payment in grid */}
          <div className="flex items-start gap-3">
            {/* Left: breakdown */}
            <div className="flex-1 min-w-0 space-y-0.5 text-[10px]">
              <div className="flex justify-between text-stone-500">
                <span>Subtotal</span>
                <span>Rp{subtotal.toLocaleString("id-ID")}</span>
              </div>
              {itemDiscountTotal > 0 && (
                <div className="flex justify-between text-stone-400">
                  <span>Diskon</span>
                  <span>-Rp{itemDiscountTotal.toLocaleString("id-ID")}</span>
                </div>
              )}
              {promoDiscountTotal > 0 && (
                <div className="flex justify-between text-red-500 font-bold bg-red-50/50 rounded px-1">
                  <span>Promo</span>
                  <span>-Rp{promoDiscountTotal.toLocaleString("id-ID")}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-stone-800 text-[13px] pt-1 border-t border-stone-300 mt-1">
                <span>Total</span>
                <span className="text-[#3C3025]">Rp{total.toLocaleString("id-ID")}</span>
              </div>
            </div>

            {/* Right: payment + button */}
            <div className="w-[160px] shrink-0 space-y-1.5">
              {/* Payment method pills */}
              <div className="flex gap-1">
                {(["CASH", "DEBIT", "QRIS"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => onPaymentMethodChange?.(m)}
                    className={cn(
                      "flex-1 h-7 text-[9px] font-bold rounded uppercase tracking-wider transition-all",
                      paymentMethod === m
                        ? "bg-[#3C3025] text-white"
                        : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
              {/* Amount input */}
              <input
                type="text"
                value={formatNumber(amountPaid)}
                onChange={(e) => { const v = e.target.value; if (/^[0-9.]*$/.test(v)) onAmountPaidChange(parseNumber(v)); }}
                disabled={paymentMethod !== "CASH"}
                placeholder="0"
                className={cn(
                  "w-full h-8 text-sm font-black text-right px-2 rounded border border-stone-300 bg-white focus:outline-none focus:ring-1 focus:ring-stone-500",
                  paymentMethod !== "CASH" && "bg-stone-50 text-stone-400"
                )}
              />
              {paymentMethod === "CASH" && amountPaid > 0 && (
                <div className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded text-center", amountPaid >= total ? "text-green-700 bg-green-50" : "text-red-500 bg-red-50")}>
                  {amountPaid >= total ? `Kembali Rp${change.toLocaleString("id-ID")}` : `Kurang Rp${remainingPayment.toLocaleString("id-ID")}`}
                </div>
              )}
            </div>
          </div>

          {/* Pay button — ALWAYS at bottom */}
          <Button
            onClick={onCheckout}
            disabled={!canCheckout}
            className={cn(
              "w-full h-10 text-xs font-black tracking-widest rounded-lg transition-all",
              canCheckout
                ? "bg-[#3C3025] hover:bg-[#5a4a38] text-white shadow-lg active:scale-[0.98]"
                : "bg-stone-200 text-stone-400"
            )}
          >
            {isLoading ? "PROSES..." : canCheckout ? `BAYAR Rp${total.toLocaleString("id-ID")}` : "LENGKAPI"}
          </Button>
        </div>
      </div>
    </>
  );
}