"use client";

import { useState, useMemo } from "react";
import { Search, ShoppingCart, Trash2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import { ProductCard, CartDrawer, InvoiceModal, useKasirProducts, useCheckout, type Product, type CartItem } from "@/features/kasir";

export default function POSPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [amountPaid, setAmountPaid] = useState(0);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [showCartDrawer, setShowCartDrawer] = useState(false);

  const { 
    data: productsData, 
    isLoading: loading, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useKasirProducts(debouncedSearch);

  const checkoutMutation = useCheckout();
  
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
      return [...prev, { ...product, quantity: 1 }];
    });
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

  const totalPrice = cart.reduce((s: number, c: CartItem) => s + c.price * c.quantity, 0);
  const totalItems = cart.reduce((s: number, c: CartItem) => s + c.quantity, 0);
  const change = amountPaid - totalPrice;

  const handleCheckout = () => {
    if (cart.length === 0) return toast.warning("Keranjang masih kosong");
    if (amountPaid < totalPrice) return toast.warning("Nominal pembayaran kurang");

    checkoutMutation.mutate({
      items: cart.map((c: CartItem) => ({ productId: c.id, quantity: c.quantity })),
      amountPaid,
    }, {
      onSuccess: (json) => {
        setInvoiceData(json.data);
        setShowCartDrawer(false);
        clearCart();
        toast.success("Transaksi berhasil!");
      },
      onError: (err: any) => {
        toast.error(err.message || "Gagal memproses transaksi");
      }
    });
  };

  return (
    <div className="flex h-screen md:h-[calc(100vh-0px)] overflow-hidden">
      {/* ===== LEFT: Product Grid ===== */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search Bar */}
        <div className="px-4 pt-4 pb-3 bg-stone-50 border-b border-stone-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Cari nama produk atau kategori..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-stone-300 rounded-sm text-sm focus:outline-none focus:border-stone-500 bg-white"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
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
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
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
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="px-6 py-2 text-sm font-semibold text-stone-600 border border-stone-300 rounded-sm hover:bg-stone-100 disabled:opacity-50 transition-colors"
                  >
                    {isFetchingNextPage ? "Memuat..." : "Tampilkan Lebih Banyak"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ===== RIGHT: Sticky Cart (Desktop only) ===== */}
      <aside
        className="hidden md:flex flex-col w-80 flex-shrink-0 border-l border-stone-200 bg-white overflow-hidden"
      >
        {/* Cart Header */}
        <div className="px-4 py-4 border-b flex items-center justify-between" style={{ backgroundColor: "#3C3025" }}>
          <div className="flex items-center gap-2 text-white">
            <ShoppingCart className="w-4 h-4" />
            <span className="font-semibold text-sm">Keranjang</span>
            {totalItems > 0 && (
              <span className="bg-amber-400 text-[#3C3025] text-xs font-bold px-1.5 py-0.5 rounded-full">
                {totalItems}
              </span>
            )}
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-white/60 hover:text-red-300 transition-colors flex items-center gap-1 text-xs"
            >
              <Trash2 className="w-3 h-3" />
              Kosongkan
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
                <div key={item.id} className="bg-stone-50 rounded-sm p-2.5 border border-stone-100">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-xs font-semibold text-stone-800 leading-tight line-clamp-2 flex-1">
                      {item.name}
                    </p>
                    <button
                      onClick={() => deleteFromCart(item.id)}
                      className="text-stone-300 hover:text-red-500 flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-6 h-6 flex items-center justify-center border border-stone-300 rounded-sm hover:bg-stone-200"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => addToCart(item)}
                        disabled={item.quantity >= item.stock}
                        className="w-6 h-6 flex items-center justify-center rounded-sm text-white disabled:opacity-40"
                        style={{ backgroundColor: "#3C3025" }}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs font-bold" style={{ color: "#3C3025" }}>
                      Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer: Bayar */}
        {cart.length > 0 && (
          <div className="border-t px-4 py-4 space-y-3 bg-white">
            <div className="flex justify-between font-bold text-sm">
              <span>Total Belanja</span>
              <span style={{ color: "#3C3025" }}>Rp {totalPrice.toLocaleString("id-ID")}</span>
            </div>
            <div>
              <label className="text-xs text-stone-500 block mb-1">Nominal Bayar (Rp)</label>
              <input
                type="number"
                value={amountPaid || ""}
                onChange={(e) => setAmountPaid(Number(e.target.value))}
                placeholder="Masukkan nominal..."
                className="w-full border border-stone-300 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-stone-500"
              />
              {amountPaid > 0 && amountPaid >= totalPrice && (
                <p className="text-xs text-green-600 mt-1 font-medium">
                  Kembalian: Rp {change.toLocaleString("id-ID")}
                </p>
              )}
              {amountPaid > 0 && amountPaid < totalPrice && (
                <p className="text-xs text-red-500 mt-1">
                  Kurang: Rp {(totalPrice - amountPaid).toLocaleString("id-ID")}
                </p>
              )}
            </div>
            <button
              onClick={handleCheckout}
              disabled={checkoutMutation.isPending || amountPaid < totalPrice || cart.length === 0}
              className="w-full py-3 text-sm font-bold text-white rounded-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
              style={{ backgroundColor: "#3C3025" }}
            >
              {checkoutMutation.isPending ? "⏳ Memproses..." : `💳 Bayar — Rp ${totalPrice.toLocaleString("id-ID")}`}
            </button>
          </div>
        )}
      </aside>

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
          }))}
          onClose={() => setShowCartDrawer(false)}
          onAdd={(id: string) => { const p = products.find((x: Product) => x.id === id); if (p) addToCart(p); }}
          onRemove={removeFromCart}
          onDelete={deleteFromCart}
          amountPaid={amountPaid}
          onAmountPaidChange={setAmountPaid}
          onCheckout={handleCheckout}
          isLoading={checkoutMutation.isPending}
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
