"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  PanelRightClose,
  PanelRight,
  Tag,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import { formatNumber, parseNumber, cn } from "@/lib/utils";
import {
  ProductCard,
  CartDrawer,
  InvoiceModal,
  AdminPinModal,
  useKasirProducts,
  useCheckout,
  type Product,
  type CartItem,
  type ProductVariantForKasir,
} from "@/features/kasir";
import { useSidebar } from "@/components/ui/sidebar";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function POSPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [amountPaid, setAmountPaid] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justAddedProductId, setJustAddedProductId] = useState<string | null>(
    null,
  );

  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [isCartVisible, setIsCartVisible] = useState(true); 
  const searchInputRef = useRef<HTMLInputElement>(null);
  const amountPaidInputRef = useRef<HTMLInputElement>(null);

  const {
    data: productsData,
    isLoading: loading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useKasirProducts(debouncedSearch);

  const checkoutMutation = useCheckout();
  const { state } = useSidebar();
  const isSidebarCollapsed = state === "collapsed";

  const products = useMemo(() => {
    return productsData?.pages.flatMap((page: any) => page.data || []).filter(Boolean) || [];
  }, [productsData]);

  // Cart helpers - Mendukung pengecekan kuantitas per SKU atau per Produk
  const getQuantity = (productId: string, skuId?: string) => {
    if (skuId) {
      return cart.find((c) => c.skuId === skuId)?.quantity ?? 0;
    }
    // Jika hanya cek per produk (misal untuk overlay badge total), akumulasikan semua variannya
    return cart
      .filter((c) => c.id === productId)
      .reduce((sum, c) => sum + c.quantity, 0);
  };

  const addToCart = (
    product: Product,
    variantId: string | null = null,
    variantColor: string | null = null,
    skuId: string | null = null,
    skuSize: string | null = null,
    priceAtSku?: number,
    stockAtSku?: number,
    variantCode?: string | null,
    // Tambahkan data promo
    promoName: string | null = null,
    additionalDiscount: number = 0,
    comparisonPrice: number | null = null
  ) => {
    // Kunci unik: productId + skuId (jika ada varian)
    const cartKey = skuId ? `${product.id}__${skuId}` : product.id;
    setJustAddedProductId(cartKey);

    const effectivePrice = priceAtSku ?? product.price;
    const effectiveStock = stockAtSku ?? product.stock;
    
    // Nama yang ditampilkan di keranjang (detail)
    const displayName = skuSize 
      ? `${product.name} - ${variantColor} / ${skuSize}` 
      : product.name;

    setCart((prev: CartItem[]) => {
      const existingIndex = prev.findIndex((c) => 
        skuId ? c.skuId === skuId : (c.id === product.id && !c.skuId)
      );

      if (existingIndex > -1) {
        const existing = prev[existingIndex];
        if (existing.quantity >= effectiveStock) {
          toast.warning(`Stok ${displayName} tidak mencukupi.`);
          return prev;
        }
        const updatedCart = [...prev];
        updatedCart[existingIndex] = { ...existing, quantity: existing.quantity + 1 };
        return updatedCart;
      }

      const newItem: CartItem = {
        id: product.id,
        productCode: product.productCode,
        name: product.name,
        imageUrl: product.imageUrl,
        category: product.category,
        price: effectivePrice,
        stock: effectiveStock,
        quantity: 1,
        discountAmount: additionalDiscount, // Otomatis dari Admin
        promoName: promoName,               // Nama Promo Admin
        comparisonPriceAtSale: comparisonPrice, // Harga Gimmick (Coretan asli)
        variantId,
        variantColor,
        skuId,
        skuSize,
        variantCode: variantCode || null
      };
      return [...prev, newItem];
    });
  };

  const removeFromCart = (productId: string, skuId?: string) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((c) => 
        skuId ? c.skuId === skuId : (c.id === productId && !c.skuId)
      );
      if (existingIndex === -1) return prev;

      const existing = prev[existingIndex];
      if (existing.quantity === 1) {
        return prev.filter((_, i) => i !== existingIndex);
      }

      const updatedCart = [...prev];
      updatedCart[existingIndex] = { ...existing, quantity: existing.quantity - 1 };
      return updatedCart;
    });
  };

  const deleteFromCart = (productId: string, skuId?: string) => {
    setCart((prev) => prev.filter((c) => 
      skuId ? c.skuId !== skuId : (c.id !== productId || !!c.skuId)
    ));
  };

  const clearCart = () => {
    setCart([]);
    setAmountPaid(0);
  };

  useEffect(() => {
    if (!justAddedProductId) return;
    const timeoutId = window.setTimeout(() => setJustAddedProductId(null), 500);
    return () => window.clearTimeout(timeoutId);
  }, [justAddedProductId]);

  const totalPrice = cart.reduce(
    (s: number, c: CartItem) => s + (c.price * c.quantity - c.discountAmount),
    0,
  );
  const totalDiscount = cart.reduce(
    (s: number, c: CartItem) => s + c.discountAmount,
    0,
  );
  const totalItems = cart.reduce((s: number, c: CartItem) => s + c.quantity, 0);
  const change = amountPaid - totalPrice;
  const remainingPayment = Math.max(totalPrice - amountPaid, 0);
  const hasInvalidDiscount = cart.some(
    (c) => c.discountAmount > c.price * c.quantity || c.discountAmount < 0,
  );
  const canCheckout =
    cart.length > 0 && amountPaid >= totalPrice && !hasInvalidDiscount;

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditable =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        !!target?.isContentEditable;

      if (event.key === "F2") {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (event.key === "F4") {
        event.preventDefault();
        if (window.innerWidth < 768) {
          setShowCartDrawer(true);
        }
        amountPaidInputRef.current?.focus();
        return;
      }

      if (
        event.key === "Enter" &&
        !isEditable &&
        canCheckout &&
        !isSubmitting &&
        !checkoutMutation.isPending
      ) {
        event.preventDefault();
        handleCheckout();
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [
    canCheckout,
    isSubmitting,
    checkoutMutation.isPending,
    totalDiscount,
    cart.length,
    amountPaid,
    totalPrice,
  ]);

  const handleCheckout = async () => {
    if (cart.length === 0 || amountPaid < totalPrice || isSubmitting) return;

    if (totalDiscount > 300000) {
      setShowPinModal(true);
      return;
    }

    executeCheckout();
  };

  const executeCheckout = (authPin?: string) => {
    setIsSubmitting(true);
    checkoutMutation.mutate(
      {
        items: cart.map((c: CartItem) => ({
          productId: c.id,
          quantity: c.quantity,
          discountAmount: c.discountAmount,
          promoName: c.promoName,
          comparisonPriceAtSale: c.comparisonPriceAtSale,
          variantId: c.variantId ?? undefined,
          skuId: c.skuId ?? undefined,
        })),
        amountPaid,
        customerName,
        customerPhone,
        ...(authPin && { adminPin: authPin }),
      },
      {
        onSuccess: (json) => {
          setInvoiceData(json.data);
          setShowCartDrawer(false);
          setShowPinModal(false);
          clearCart();
          setCustomerName("");
          setCustomerPhone("");
          toast.success("Transaksi berhasil!");
          setIsSubmitting(false);
        },
        onError: (err: any) => {
          const errorMsg =
            err.response?.data?.message ||
            err.message ||
            "Gagal memproses transaksi";
          toast.error(errorMsg);
          setIsSubmitting(false);
        },
      },
    );
  };

  return (
    <div className="flex h-full py-2 overflow-hidden bg-white">
      {/* ===== LEFT: Product Grid ===== */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Interactive Header */}
        <div className="px-4 py-3 bg-white border-b border-stone-100 flex items-center gap-4">
          <div className="text-stone-500 hover:bg-stone-100  rounded-full">
            <SidebarTrigger />
          </div>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              ref={searchInputRef}
              placeholder="Cari produk atau kategori..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-stone-50 border-none h-10 focus-visible:ring-1 focus-visible:ring-stone-200"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCartVisible(!isCartVisible)}
            className={cn(
              "hidden lg:flex text-stone-500 hover:bg-stone-100 h-10 w-10",
              !isCartVisible && "text-amber-600 bg-amber-50 shadow-sm",
            )}
            title={
              isCartVisible ? "Sembunyikan Keranjang" : "Tampilkan Keranjang"
            }
          >
            {isCartVisible ? <PanelRightClose /> : <PanelRight />}
          </Button>
        </div>

        <div
          className={cn(
            "flex-1 overflow-y-auto p-3 md:p-4",
            cart.length > 0 && "pb-32 md:pb-36 lg:pb-4",
          )}
        >
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 md:gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-stone-200 animate-pulse rounded aspect-square"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-stone-400">
              <Search className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">Tidak ada produk ditemukan</p>
            </div>
          ) : (
            <>
              <div
                className={cn(
                  "grid gap-2 md:gap-2.5 lg:gap-3 transition-all duration-300",
                  "grid-cols-2",
                  isSidebarCollapsed ? "md:grid-cols-4" : "md:grid-cols-3",
                  !isCartVisible
                    ? isSidebarCollapsed
                      ? "lg:grid-cols-5 xl:grid-cols-6"
                      : "lg:grid-cols-4 xl:grid-cols-5"
                    : isSidebarCollapsed
                      ? "lg:grid-cols-4 xl:grid-cols-5"
                      : "lg:grid-cols-3 xl:grid-cols-4",
                )}
              >
                {products.map((product: Product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    quantityInCart={(skuId) => product?.id ? getQuantity(product.id, skuId) : 0}
                    isJustAdded={!!product && (justAddedProductId === product.id || cart.some(c => c?.id === product.id && `${c.id}__${c.skuId}` === justAddedProductId))}
                    onAdd={addToCart}
                    onRemove={removeFromCart}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {hasNextPage && (
                <div className="mt-8 flex justify-center pb-8">
                  <Button
                    variant="outline"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="px-6"
                  >
                    {isFetchingNextPage
                      ? "Memuat..."
                      : "Tampilkan Lebih Banyak"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ===== RIGHT: Sticky Cart (Desktop only) ===== */}
      {isCartVisible && (
        <aside className="hidden lg:flex flex-col w-[340px] xl:w-[380px] shrink-0 border-l border-stone-100 bg-white overflow-hidden transition-all duration-300 animate-in slide-in-from-right min-h-0 h-dvh max-h-dvh">
          {/* Cart Header */}
          <div className="px-4 py-4 border-b flex items-center justify-between bg-[#3C3025] text-white shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              <span className="font-bold text-sm tracking-tight">
                Keranjang Belanja
              </span>
              {totalItems > 0 && (
                <span className="bg-amber-400 text-[#3C3025] text-[10px] font-black px-1.5 py-0.5 rounded-full">
                  {totalItems}
                </span>
              )}
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-white/60 hover:text-red-300 transition-colors flex items-center gap-1 text-[10px] font-black uppercase"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-stone-300">
                <ShoppingCart className="w-12 h-12 mb-2" />
                <p className="text-sm">Keranjang kosong</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => {
                   const itemKey = item.skuId ? `${item.id}__${item.skuId}` : item.id;
                   return (
                   <div
                    key={itemKey}
                    className={cn(
                      "bg-stone-50 rounded-lg p-3 border border-stone-100 space-y-1.5 shadow-sm transition-colors",
                      justAddedProductId === itemKey && "bg-amber-50/80 border-amber-200",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-stone-800 leading-tight truncate" title={item.name}>
                          {item.name}
                        </p>
                        {item.variantCode && (
                          <div className="flex items-center gap-1 mt-0.5 font-mono">
                            <span className="text-[8px] bg-white px-1 border border-stone-200 rounded text-stone-500 font-bold uppercase">{item.variantCode}</span>
                            <span className="text-[9px] text-stone-400 uppercase font-medium">{item.variantColor} / {item.skuSize}</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => deleteFromCart(item.id, item.skuId || undefined)}
                        className="text-stone-300 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeFromCart(item.id, item.skuId || undefined)}
                          className="h-8 w-8 bg-white border-stone-200"
                        >
                          <Minus className="w-3.5 h-3.5 text-stone-600" />
                        </Button>
                        <span className="text-xs font-black w-5 text-center text-stone-700">
                          {item.quantity}
                        </span>
                        <Button
                          size="icon"
                          onClick={() =>
                            addToCart(
                              { ...item, hasVariants: !!item.skuId, variants: [] },
                              item.variantId,
                              item.variantColor,
                              item.skuId,
                              item.skuSize,
                              item.price,
                              item.stock,
                              item.variantCode
                            )
                          }
                          disabled={item.quantity >= item.stock}
                          className="h-8 w-8 bg-[#3C3025] hover:bg-[#5a4a38] text-white"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      <div className="text-right">
                        <p className="text-[11px] font-black text-[#3C3025]">
                          Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                        </p>
                        {item.discountAmount > 0 && (
                          <p className="text-[10px] text-red-500 font-bold">
                            - Rp {item.discountAmount.toLocaleString("id-ID")}
                          </p>
                        )}
                      </div>
                    </div>

                    {item.discountAmount > 0 && (
                      <div className="flex items-center gap-2 pt-2 border-t border-stone-200/60 mt-1">
                        <Tag className="h-3 w-3 text-red-500" />
                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-tight">
                          {item.promoName || "Diskon Admin"} (-Rp {item.discountAmount.toLocaleString("id-ID")})
                        </span>
                      </div>
                    )}
                  </div>
                )})}
              </div>
            )}
          </div>

          {/* Footer: Bayar */}
          {cart.length > 0 && (
            <div className="border-t px-4 py-4 space-y-3 bg-stone-50/50 shrink-0">
              <div className="space-y-2 pb-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase font-black text-stone-400">
                      Customer
                    </Label>
                    <Input
                      placeholder="Nama"
                      className="h-8 text-xs bg-white border-stone-200"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase font-black text-stone-400">
                      No. HP
                    </Label>
                    <Input
                      placeholder="08..."
                      className="h-8 text-xs bg-white border-stone-200"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between font-bold text-sm pt-2 border-t border-stone-200">
                <span className="text-stone-500">Total Harga</span>
                <span className="text-[#3C3025] text-lg font-black italic">
                  Rp {totalPrice.toLocaleString("id-ID")}
                </span>
              </div>

              <div className="space-y-1.5 pt-1">
                <Label className="text-[9px] text-stone-400 uppercase font-black">
                  Uang Diterima (Rp)
                </Label>
                <Input
                  ref={amountPaidInputRef}
                  type="text"
                  value={formatNumber(amountPaid)}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^[0-9.]*$/.test(val)) {
                      setAmountPaid(parseNumber(val));
                    }
                  }}
                  className="bg-white h-10 text-base font-black border-stone-300"
                />
                {amountPaid > 0 && amountPaid >= totalPrice && (
                  <div className="flex justify-between items-center text-xs text-green-700 font-bold bg-green-50 px-2 py-1.5 rounded border border-green-100">
                    <span>Kembalian:</span>
                    <span>Rp {change.toLocaleString("id-ID")}</span>
                  </div>
                )}
                {amountPaid > 0 && amountPaid < totalPrice && (
                  <p className="text-[9px] text-red-500 font-bold bg-red-50 px-2 py-1 rounded">
                    Kurang Bayar Rp {remainingPayment.toLocaleString("id-ID")}
                  </p>
                )}
              </div>
              <Button
                onClick={handleCheckout}
                disabled={
                  checkoutMutation.isPending || isSubmitting || !canCheckout
                }
                className={cn(
                  "w-full py-6 text-sm font-black tracking-widest",
                  canCheckout
                    ? "bg-[#3C3025] hover:bg-[#5a4a38] text-white shadow-lg"
                    : "bg-stone-200 text-stone-400",
                )}
              >
                {checkoutMutation.isPending || isSubmitting
                  ? "MEMPROSES..."
                  : canCheckout
                    ? `BAYAR Rp ${totalPrice.toLocaleString("id-ID")}`
                    : "LENGKAPI DATA"}
              </Button>
            </div>
          )}
        </aside>
      )}

      {/* ===== Mobile + Tablet Floating Bar ===== */}
      {cart.length > 0 && (
        <button
          onClick={() => setShowCartDrawer(true)}
          className="lg:hidden fixed bottom-4 md:bottom-8 left-4 right-4 z-30 flex items-center justify-between px-4 py-4 text-white text-sm font-black italic rounded-xl shadow-2xl transition-transform active:scale-95"
          style={{ backgroundColor: "#3C3025" }}
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            <span>KERANJANG ({totalItems})</span>
          </div>
          <span>Rp {totalPrice.toLocaleString("id-ID")}</span>
        </button>
      )}

      {/* ===== Mobile Cart Drawer ===== */}
      {showCartDrawer && (
        <CartDrawer
          items={cart}
          onClose={() => setShowCartDrawer(false)}
          onAdd={(id, skuId) => {
            const p = products.find((x: Product) => x.id === id);
            if (!p) return;
            
            if (skuId) {
              const variant = p.variants.find((v: ProductVariantForKasir) => v.skus.some((s: any) => s.id === skuId));
              const sku = variant?.skus.find((s: any) => s.id === skuId);
              if (variant && sku) {
                // LOGIKA CERDAS: Gunakan finalPrice dan kalkulasi ulang diskon
                const originalPrice = sku.priceOverride ?? variant.basePrice;
                const finalPrice = (sku as any).finalPrice ?? originalPrice;
                const discountAmount = originalPrice - finalPrice;

                addToCart(
                  p, 
                  variant.id, 
                  variant.color, 
                  sku.id, 
                  sku.size, 
                  originalPrice, // Pakai harga asli agar diskon terbaca
                  sku.stock, 
                  variant.variantCode,
                  variant.promoName,
                  discountAmount,
                  variant.comparisonPrice || originalPrice
                );
              }
            } else {
              addToCart(p);
            }
          }}
          onRemove={removeFromCart}
          onDelete={deleteFromCart}
          amountPaid={amountPaid}
          onAmountPaidChange={setAmountPaid}
          customerName={customerName}
          onCustomerNameChange={setCustomerName}
          customerPhone={customerPhone}
          onCustomerPhoneChange={setCustomerPhone}
          onCheckout={handleCheckout}
          isLoading={checkoutMutation.isPending}
        />
      )}

      {/* Admin PIN Modal */}
      {showPinModal && (
        <AdminPinModal
          onSuccess={executeCheckout}
          onCancel={() => setShowPinModal(false)}
        />
      )}

      {/* Invoice Modal */}
      {invoiceData && (
        <InvoiceModal
          transaction={invoiceData}
          onClose={() => setInvoiceData(null)}
        />
      )}
    </div>
  );
}
