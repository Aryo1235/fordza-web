"use client";

import { useState, useMemo } from "react";
import { Search, ShoppingCart, Trash2, Minus, Plus, PanelRightClose, PanelRight } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import { formatNumber, parseNumber, cn } from "@/lib/utils";
import { ProductCard, CartDrawer, InvoiceModal, AdminPinModal, useKasirProducts, useCheckout, type Product, type CartItem } from "@/features/kasir";
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
  
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [isCartVisible, setIsCartVisible] = useState(true); // Desktop cart visibility

  const { 
    data: productsData, 
    isLoading: loading, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useKasirProducts(debouncedSearch);

  const checkoutMutation = useCheckout();
  const { state } = useSidebar();
  const isSidebarCollapsed = state === "collapsed";
  
  const products = useMemo(() => {
    return productsData?.pages.flatMap((page) => page.data) || [];
  }, [productsData]);

  // Cart helpers
  const getQuantity = (productId: string) =>
    cart.find((c) => c.id === productId)?.quantity ?? 0;

  const addToCart = (product: Product) => {
    setCart((prev: CartItem[]) => {
      const existing = prev.find((c: CartItem) => c.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.warning(`Stok ${product.name} hanya tersisa ${product.stock}`);
          return prev;
        }
        return prev.map((c: CartItem) =>
          c.id === product.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { ...product, quantity: 1, discountAmount: 0 }];
    });
  };

  const updateDiscount = (productId: string, discount: number) => {
    setCart((prev) => 
      prev.map((c) => c.id === productId ? { ...c, discountAmount: discount } : c)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev: CartItem[]) => {
      const existing = prev.find((c: CartItem) => c.id === productId);
      if (!existing) return prev;
      if (existing.quantity === 1) return prev.filter((c: CartItem) => c.id !== productId);
      return prev.map((c: CartItem) =>
        c.id === productId ? { ...c, quantity: c.quantity - 1 } : c
      );
    });
  };

  const deleteFromCart = (productId: string) => {
    setCart((prev: CartItem[]) => prev.filter((c: CartItem) => c.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setAmountPaid(0);
  };

  const totalPrice = cart.reduce((s: number, c: CartItem) => s + (c.price * c.quantity - c.discountAmount), 0);
  const totalDiscount = cart.reduce((s: number, c: CartItem) => s + c.discountAmount, 0);
  const totalItems = cart.reduce((s: number, c: CartItem) => s + c.quantity, 0);
  const change = amountPaid - totalPrice;

  const handleCheckout = async () => {
    if (cart.length === 0 || amountPaid < totalPrice || isSubmitting) return;

    // 🔐 KEAMANAN: Cek ambang batas diskon (300rb)
    if (totalDiscount > 300000) {
      setShowPinModal(true);
      return;
    }

    executeCheckout();
  };

  const executeCheckout = (authPin?: string) => {
    setIsSubmitting(true);
    checkoutMutation.mutate({
      items: cart.map((c: CartItem) => ({ 
        productId: c.id, 
        quantity: c.quantity,
        discountAmount: c.discountAmount 
      })),
      amountPaid,
      customerName,
      customerPhone,
      // Jika butuh validasi PIN admin di server-side, kirim PIN-nya
      ...(authPin && { adminPin: authPin }) 
    }, {
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
        const errorMsg = err.response?.data?.message || err.message || "Gagal memproses transaksi";
        toast.error(errorMsg);
        setIsSubmitting(false);
      }
    });
  };

  return (
    <div className="flex h-full overflow-hidden bg-white">
      {/* ===== LEFT: Product Grid ===== */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Interactive Header */}
        <div className="px-4 py-3 bg-white border-b border-stone-100 flex items-center gap-4">
          <SidebarTrigger className="text-stone-500 hover:bg-stone-100" />
          
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
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
              "hidden md:flex text-stone-500 hover:bg-stone-100",
              !isCartVisible && "text-amber-600 bg-amber-50 shadow-sm"
            )}
            title={isCartVisible ? "Sembunyikan Keranjang" : "Tampilkan Keranjang"}
          >
            {isCartVisible ? <PanelRightClose /> : <PanelRight />}
          </Button>
        </div>

        <div className={cn(
          "flex-1 overflow-y-auto p-4",
          cart.length > 0 && "pb-24 md:pb-4"
        )}>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-stone-200 animate-pulse rounded aspect-square" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-stone-400">
              <Search className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">Tidak ada produk ditemukan</p>
            </div>
          ) : (
            <>
              <div className={cn(
                "grid gap-3 transition-all duration-300",
                // Base: 2 columns mobile
                "grid-cols-2",
                // Tablet: Adapt to sidebar
                isSidebarCollapsed ? "md:grid-cols-3 lg:grid-cols-4" : "md:grid-cols-2 lg:grid-cols-3",
                // Large Desktop: Adapt to cart visibility
                !isCartVisible 
                  ? (isSidebarCollapsed ? "xl:grid-cols-6" : "xl:grid-cols-5")
                  : (isSidebarCollapsed ? "xl:grid-cols-5" : "xl:grid-cols-4")
              )}>
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    quantityInCart={getQuantity(product.id)}
                    onAdd={() => addToCart(product)}
                    onRemove={() => removeFromCart(product.id)}
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
                    {isFetchingNextPage ? "Memuat..." : "Tampilkan Lebih Banyak"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ===== RIGHT: Sticky Cart (Desktop only) ===== */}
      {isCartVisible && (
        <aside
          className="hidden md:flex flex-col w-80 flex-shrink-0 border-l border-stone-100 bg-white overflow-hidden transition-all duration-300 animate-in slide-in-from-right"
        >
          {/* Cart Header */}
          <div className="px-4 py-4 border-b flex items-center justify-between bg-[#3C3025] text-white">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              <span className="font-bold text-sm tracking-tight">Keranjang Belanja</span>
              {totalItems > 0 && (
                <span className="bg-amber-400 text-[#3C3025] text-[10px] font-black px-1.5 py-0.5 rounded-full">
                  {totalItems}
                </span>
              )}
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-white/60 hover:text-red-300 transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-stone-300">
              <ShoppingCart className="w-12 h-12 mb-2" />
              <p className="text-sm">Keranjang kosong</p>
              <p className="text-xs mt-1">Klik produk untuk menambahkan</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((item) => (
                <div key={item.id} className="bg-stone-50 rounded-sm p-3 border border-stone-100 space-y-2.5 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-bold text-stone-800 leading-tight line-clamp-2 flex-1">
                      {item.name}
                    </p>
                    <button
                      onClick={() => deleteFromCart(item.id)}
                      className="text-stone-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => removeFromCart(item.id)}
                        className="w-7 h-7 bg-white"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-xs font-black w-5 text-center text-stone-700">{item.quantity}</span>
                      <Button
                        size="icon"
                        onClick={() => addToCart(item)}
                        disabled={item.quantity >= item.stock}
                        className="w-7 h-7 bg-[#3C3025] hover:bg-[#5a4a38] text-white"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-xs font-black text-[#3C3025]">
                        Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                      </p>
                      {item.discountAmount > 0 && (
                        <p className="text-[10px] text-red-500 font-bold">
                          - Rp {item.discountAmount.toLocaleString("id-ID")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Desktop Item Discount Input */}
                  <div className="flex items-center gap-2 pt-1 border-t border-stone-100">
                    <span className="text-[9px] font-bold text-stone-400 uppercase">Diskon:</span>
                    <Input 
                      type="text"
                      className="h-6 text-[10px] px-2 bg-white/50 border-stone-200"
                      placeholder="Rp 0"
                      value={formatNumber(item.discountAmount)}
                      onChange={(e) => updateDiscount(item.id, parseNumber(e.target.value))}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer: Bayar */}
        {cart.length > 0 && (
          <div className="border-t px-4 py-4 space-y-3 bg-white">
            {/* Desktop Customer CRM Inputs */}
            <div className="space-y-2 pb-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-black text-stone-400">Customer</Label>
                  <Input 
                    placeholder="Nama" 
                    className="h-8 text-xs bg-stone-50/50"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-black text-stone-400">No. HP</Label>
                  <Input 
                    placeholder="08..." 
                    className="h-8 text-xs bg-stone-50/50"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between font-black text-sm pt-2 border-t">
              <span>Total Belanja</span>
              <span className="text-amber-700 text-lg">Rp {totalPrice.toLocaleString("id-ID")}</span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] text-stone-400 uppercase font-black">Nominal Bayar (Rp)</Label>
              <Input
                type="text"
                value={formatNumber(amountPaid)}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^[0-9.]*$/.test(val)) {
                    setAmountPaid(parseNumber(val));
                  }
                }}
                placeholder="0"
                className="bg-stone-50 h-10 text-base font-bold"
              />
              {amountPaid > 0 && amountPaid >= totalPrice && (
                <div className="flex justify-between items-center text-xs text-green-700 mt-1 font-bold bg-green-50 px-2 py-1.5 rounded">
                  <span>Kembalian:</span>
                  <span>Rp {change.toLocaleString("id-ID")}</span>
                </div>
              )}
              {amountPaid > 0 && amountPaid < totalPrice && (
                <p className="text-[10px] text-red-500 mt-1">
                   ⚠️ Kurang: Rp {(totalPrice - amountPaid).toLocaleString("id-ID")}
                </p>
              )}
            </div>
            <Button
              onClick={handleCheckout}
              disabled={checkoutMutation.isPending || isSubmitting || amountPaid < totalPrice || cart.length === 0}
              className="w-full py-6 text-sm font-bold bg-[#3C3025] hover:bg-[#5a4a38] text-white"
            >
              {checkoutMutation.isPending || isSubmitting ? "⏳ Memproses..." : `💳 Bayar — Rp ${totalPrice.toLocaleString("id-ID")}`}
            </Button>
          </div>
        )}
      </aside>
    )}

      {/* ===== Mobile Floating Bar ===== */}
      {cart.length > 0 && (
        <button
          onClick={() => setShowCartDrawer(true)}
          className="md:hidden fixed bottom-4 left-4 right-4 z-30 flex items-center justify-between px-4 py-3.5 text-white text-sm font-bold rounded-sm shadow-xl"
          style={{ backgroundColor: "#3C3025" }}
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            <span>Keranjang ({totalItems})</span>
          </div>
          <span>Rp {totalPrice.toLocaleString("id-ID")}</span>
        </button>
      )}

      {/* ===== Mobile Cart Drawer ===== */}
      {showCartDrawer && (
        <CartDrawer
          items={cart.map((c: CartItem) => ({
            productId: c.id,
            name: c.name,
            price: c.price,
            quantity: c.quantity,
            stock: c.stock,
            discountAmount: c.discountAmount,
          }))}
          onClose={() => setShowCartDrawer(false)}
          onAdd={(id: string) => { const p = products.find((x: Product) => x.id === id); if (p) addToCart(p); }}
          onRemove={removeFromCart}
          onDelete={deleteFromCart}
          onUpdateDiscount={updateDiscount}
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
