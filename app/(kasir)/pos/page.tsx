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
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "DEBIT" | "QRIS">("CASH");
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
  const [isPaymentExpanded, setIsPaymentExpanded] = useState(true);
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

  // Dynamic grid layout class based on sidebar collapse and cart visibility
  const gridClass = cn(
    "grid gap-2 md:gap-2.5 lg:gap-3 transition-all duration-300",
    isSidebarCollapsed && !isCartVisible
      ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4" // Both closed
      : isSidebarCollapsed || !isCartVisible
        ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3" // One closed
        : "grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2" // Both open
  );

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
    comparisonPrice: number | null = null,
    promoMinPurchase: number | null = null, // ✅ Tambah parameter
    promoDiscountPercent: number | null = null, // ✅ Tambah parameter persentase
    promoTargetType: string | null = null, // ✅ Tambah targetType
    isPromoConditional: boolean = false, // ✅ Tambah conditional
    promoType: "PERCENTAGE" | "NOMINAL" | null = null // ✅ Tambah promoType asli dari DB
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
        promoMinPurchase: promoMinPurchase, // ✅ Min purchase promo
        promoDiscountPercent: promoDiscountPercent, // ✅ Simpan persentase
        promoTargetType: promoTargetType, // ✅ Simpan targetType
        isPromoConditional: isPromoConditional, // ✅ Simpan conditional
        promoType: promoType, // ✅ Simpan promoType
        gimmickPriceAtSale: comparisonPrice, // Harga Gimmick (Coretan asli)
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


  // ─────────────────────────────────────────────────────────────────────
  // KALKULASI KERANJANG — Mencerminkan logika backend (2-fase):
  // FASE 1: Diskon level item (VARIANT/PRODUCT/CATEGORY)
  // FASE 2: Diskon GLOBAL dihitung sekali, diprorata ke item yang eligible
  // ─────────────────────────────────────────────────────────────────────

  // Subtotal kotor (tanpa diskon apapun) — basis untuk cek minPurchase
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum: number, c: CartItem) => sum + Number(c.price ?? 0) * c.quantity, 0);
  }, [cart]);

  // FASE 1 & FASE 2: Hitung diskon dengan prorasi dinamis untuk item-level bersyarat & global nominal
  const processedCart = useMemo(() => {
    // 1. Inisialisasi data item
    const itemsWithItemDiscount = cart.map((c: CartItem) => {
      const itemPrice = Number(c.price ?? 0);
      const discountAmt = Number(c.discountAmount ?? 0);
      const minP = Number(c.promoMinPurchase ?? 0);
      const isPercentage = c.promoType === "PERCENTAGE";
      const targetType = c.promoTargetType;

      const itemSubtotal = itemPrice * c.quantity;
      let itemDiscount = 0;
      let isGlobalEligible = false;

      // Cek minPurchase untuk conditional promo level item
      const meetMinP = minP === 0 || cartSubtotal >= minP;

      // Bedakan promo global dengan item-level
      const isGlobal = targetType === "GLOBAL";
      const isItemConditionalNominal = targetType && !isGlobal && minP > 0 && !isPercentage;

      if (targetType && !isGlobal && !isItemConditionalNominal) {
        // Hitung langsung diskon non-conditional PERCENTAGE level item (per-item)
        if (meetMinP && isPercentage) {
          itemDiscount = (itemPrice * Number(c.promoDiscountPercent ?? 0) / 100) * c.quantity;
          itemDiscount = Math.min(itemDiscount, itemSubtotal);
        }
        // NOMINAL tanpa minPurchase tidak dihitung per-item di sini,
        // melainkan flat per-promo di langkah 2 (seperti conditional nominal)
      } else if (!targetType || isGlobal) {
        // Jika tidak ada promo sama sekali, atau promonya bertipe GLOBAL, berhak untuk promo global
        isGlobalEligible = true;
      }

      return {
        ...c,
        itemPrice,
        itemSubtotal,
        itemDiscount, // Menyimpan diskon sementara
        isGlobalEligible,
        netSubtotal: itemSubtotal, // Akan di-update setelah diskon final dihitung
        isPercentage,
        isGlobal,
        isItemConditionalNominal,
        meetMinP,
        minP,
      };
    });

    // 2. Hitung diskon item-level NOMINAL tanpa minPurchase (berkelompok per Promo Name)
    //    NOMINAL flat: diskon dihitung SEKALI per promo, lalu didistribusikan
    //    proporsional ke item-item yang cocok.
    const uniqueNominalPromoNames = Array.from(
      new Set(
        itemsWithItemDiscount
          .filter(i => i.promoName && i.promoTargetType && !i.isGlobal && !i.isPercentage && i.minP === 0)
          .map(i => i.promoName!)
      )
    );

    uniqueNominalPromoNames.forEach((pName) => {
      const matchingItems = itemsWithItemDiscount.filter(i => i.promoName === pName);
      const firstItem = matchingItems[0];
      const totalDiscountValue = Number(firstItem.discountAmount); // Potongan flat tunggal
      const totalMatchingSubtotal = matchingItems.reduce((sum, i) => sum + i.itemSubtotal, 0);

      if (matchingItems.length > 0 && totalMatchingSubtotal > 0) {
        const finalDiscount = Math.min(totalDiscountValue, totalMatchingSubtotal);
        let currentDistributed = 0;

        matchingItems.forEach((eligItem, idx) => {
          const isLast = idx === matchingItems.length - 1;
          let portion = 0;

          if (isLast) {
            portion = finalDiscount - currentDistributed;
          } else {
            portion = Math.round((eligItem.itemSubtotal / totalMatchingSubtotal) * finalDiscount);
          }

          portion = Math.min(portion, eligItem.itemSubtotal);
          eligItem.itemDiscount = portion;
          currentDistributed += portion;
        });
      }
    });

    // 3. Hitung diskon item-level conditional nominal (berkelompok per Promo Name)
    const uniqueConditionalPromoNames = Array.from(
      new Set(
        itemsWithItemDiscount
          .filter(i => i.isItemConditionalNominal && i.promoName)
          .map(i => i.promoName!)
      )
    );

    uniqueConditionalPromoNames.forEach((pName) => {
      const matchingItems = itemsWithItemDiscount.filter(i => i.promoName === pName);
      const firstItem = matchingItems[0];
      const minP = Number(firstItem.promoMinPurchase ?? 0);

      if (cartSubtotal >= minP) {
        const totalDiscountValue = Number(firstItem.discountAmount); // Potongan flat tunggal
        const totalMatchingSubtotal = matchingItems.reduce((sum, i) => sum + i.itemSubtotal, 0);

        if (matchingItems.length > 0 && totalMatchingSubtotal > 0) {
          const finalDiscount = Math.min(totalDiscountValue, totalMatchingSubtotal);
          let currentDistributed = 0;

          matchingItems.forEach((eligItem, idx) => {
            const isLast = idx === matchingItems.length - 1;
            let portion = 0;

            if (isLast) {
              portion = finalDiscount - currentDistributed;
            } else {
              portion = Math.round((eligItem.itemSubtotal / totalMatchingSubtotal) * finalDiscount);
            }

            portion = Math.min(portion, eligItem.itemSubtotal);
            eligItem.itemDiscount = portion;
            currentDistributed += portion;
          });
        }
      }
    });

    // Update netSubtotal setelah kalkulasi item-level promo selesai
    itemsWithItemDiscount.forEach(item => {
      item.netSubtotal = item.itemSubtotal - item.itemDiscount;
      if (item.itemDiscount > 0) {
        // Sekali item-level promo aktif, dia tidak berhak atas diskon global lagi
        item.isGlobalEligible = false;
      }
    });

    // 3. Hitung diskon GLOBAL (berkelompok) - Mendukung PERCENTAGE & NOMINAL
    const globalItem = itemsWithItemDiscount.find(i => i.isGlobal);
    if (globalItem && globalItem.meetMinP) {
      const eligibleItems = itemsWithItemDiscount.filter(i => i.isGlobalEligible && i.netSubtotal > 0);
      const totalEligibleSubtotal = eligibleItems.reduce((sum, i) => sum + i.netSubtotal, 0);

      // Hitung total diskon global SATU KALI untuk seluruh transaksi
      let totalGlobalDiscount = 0;
      if (globalItem.isPercentage) {
        totalGlobalDiscount = Math.round(totalEligibleSubtotal * Number(globalItem.promoDiscountPercent ?? 0) / 100);
      } else {
        totalGlobalDiscount = Number(globalItem.discountAmount);
      }

      if (eligibleItems.length > 0 && totalEligibleSubtotal > 0) {
        const finalGlobalDiscount = Math.min(totalGlobalDiscount, totalEligibleSubtotal);
        let currentDistributed = 0;

        eligibleItems.forEach((eligItem, idx) => {
          const isLast = idx === eligibleItems.length - 1;
          let portion = 0;

          if (isLast) {
            portion = finalGlobalDiscount - currentDistributed;
          } else {
            portion = Math.round((eligItem.netSubtotal / totalEligibleSubtotal) * finalGlobalDiscount);
          }

          portion = Math.min(portion, eligItem.netSubtotal);
          eligItem.itemDiscount += portion;
          eligItem.netSubtotal -= portion;
          currentDistributed += portion;
        });
      }
    }

    // Kembalikan data yang diformat dengan struktur CartItem final
    return itemsWithItemDiscount.map(item => {
      const discountAmt = Number(item.discountAmount ?? 0);
      const minP = Number(item.promoMinPurchase ?? 0);
      const isConditionalFixed = minP > 0 && !item.isPercentage;

      return {
        ...item,
        discountAmt,
        minP,
        isConditionalFixed,
        // discountAmount di sini menjadi total diskon baris (lineDiscount)
        lineDiscount: Math.min(Math.round(item.itemDiscount), item.itemSubtotal),
        lineDiscountAmt: Math.min(Math.round(item.itemDiscount), item.itemSubtotal),
      };
    });
  }, [cart, cartSubtotal]);

  // ✅ Hitung diskon item langsung (non-conditional fixed + percentage)
  const itemDiscountTotal = useMemo(() => {
    // Di POS, diskon produk adalah diskon level item non-conditional
    return processedCart.reduce((sum, c) => {
      const minP = Number(c.promoMinPurchase ?? 0);
      const isGlobalNominal = c.promoTargetType === "GLOBAL" && Number(c.promoDiscountPercent ?? 0) === 0;
      // Jika promo bersyarat atau global nominal, jangan masukkan ke diskon item reguler
      if (minP > 0 || isGlobalNominal) return sum;
      return sum + c.lineDiscount;
    }, 0);
  }, [processedCart]);

  // ✅ Hitung diskon promo bersyarat (conditional fixed + global nominal)
  const promoDiscountTotal = useMemo(() => {
    return processedCart.reduce((sum, c) => {
      const minP = Number(c.promoMinPurchase ?? 0);
      const isGlobalNominal = c.promoTargetType === "GLOBAL" && Number(c.promoDiscountPercent ?? 0) === 0;
      if (minP > 0 || isGlobalNominal) {
        return sum + c.lineDiscount;
      }
      return sum;
    }, 0);
  }, [processedCart]);

  // ✅ Hitung total harga final (subtotal - semua diskon)
  const totalPrice = useMemo(() => {
    return processedCart.reduce(
      (s: number, c) => s + (c.itemPrice * c.quantity - c.lineDiscount),
      0,
    );
  }, [processedCart]);

  // ✅ Hitung total diskon yang aktif
  const totalDiscount = useMemo(() => {
    return processedCart.reduce(
      (s: number, c) => s + c.lineDiscount,
      0,
    );
  }, [processedCart]);

  const totalItems = cart.reduce((s: number, c: CartItem) => s + c.quantity, 0);
  const change = amountPaid - totalPrice;
  const remainingPayment = Math.max(totalPrice - amountPaid, 0);
  const hasInvalidDiscount = cart.some(
    (c) => c.discountAmount > c.price * c.quantity || c.discountAmount < 0,
  );
  const canCheckout =
    cart.length > 0 && amountPaid >= totalPrice && !hasInvalidDiscount;

  // Auto-fill amountPaid when DEBIT or QRIS is selected, or when totalPrice changes
  useEffect(() => {
    if (paymentMethod !== "CASH") {
      setAmountPaid(totalPrice);
    }
  }, [paymentMethod, totalPrice]);

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
        // Kirim data item ke backend — backend akan menghitung ulang diskon
        // secara server-side menggunakan logika prorasi yang sudah diperbaiki.
        // discountAmount di sini hanya sebagai hints/referensi, backend mengabaikannya.
        items: processedCart.map((c) => ({
          productId: c.id,
          quantity: c.quantity,
          discountAmount: c.lineDiscount,
          promoName: c.lineDiscount > 0 ? c.promoName : null,
          gimmickPriceAtSale: c.gimmickPriceAtSale,
          variantId: c.variantId ?? undefined,
          skuId: c.skuId ?? undefined,
        })),
        amountPaid,
        customerName,
        customerPhone,
        paymentMethod,
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
            <div className={gridClass}>
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
              <div className={gridClass}>
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
                {processedCart.map((item) => {
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
                                item.variantCode,
                                item.promoName,
                                item.discountAmount,
                                item.gimmickPriceAtSale,
                                item.promoMinPurchase,
                                item.promoDiscountPercent
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
                            Rp {(item.itemPrice * item.quantity).toLocaleString("id-ID")}
                          </p>
                          {!item.isConditionalFixed && item.lineDiscount > 0 ? (
                            <p className="text-[10px] text-red-500 font-bold">
                              - Rp {item.lineDiscount.toLocaleString("id-ID")}
                            </p>
                          ) : !item.isConditionalFixed && item.lineDiscountAmt > 0 ? (
                            <p className="text-[10px] text-stone-400 line-through font-medium">
                              - Rp {item.lineDiscountAmt.toLocaleString("id-ID")}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      {item.discountAmt > 0 && (
                        <div className="flex items-center gap-2 pt-2 border-t border-stone-200/60 mt-1">
                          <Tag className={`h-3 w-3 ${item.lineDiscount > 0 ? "text-red-500" : "text-stone-400"}`} />
                          <span className={`text-[10px] font-bold uppercase tracking-tight ${item.lineDiscount > 0 ? "text-red-500" : "text-stone-400"
                            }`}>
                            {item.promoName || "Diskon Admin"}{" - "}
                            {item.isPercentage
                              ? `Diskon ${Math.round(Number(item.promoDiscountPercent ?? 0))}% `
                              : item.isConditionalFixed
                                ? `Potongan Flat Rp ${item.discountAmt.toLocaleString("id-ID")} `
                                : `Potongan Rp ${item.discountAmt.toLocaleString("id-ID")} `
                            }
                            {item.isConditionalFixed
                              ? item.lineDiscount > 0
                                ? `(Aktif: -Rp ${item.lineDiscount.toLocaleString("id-ID")})`
                                : `(Min. Rp ${item.minP.toLocaleString("id-ID")} - Belum Terpenuhi)`
                              : item.lineDiscount > 0
                                ? `(-Rp ${item.lineDiscount.toLocaleString("id-ID")})`
                                : `(Min. Rp ${item.minP.toLocaleString("id-ID")} - Belum Terpenuhi)`
                            }
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer: Bayar */}
          {cart.length > 0 && (
            <div className="border-t px-4 py-4 space-y-4 bg-stone-50/50 shrink-0">
              <div className="space-y-2 pb-1">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs uppercase font-black text-stone-500">
                      Customer
                    </Label>
                    <Input
                      placeholder="Nama"
                      className="h-10 text-sm bg-white border-stone-200"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs uppercase font-black text-stone-500">
                      No. HP
                    </Label>
                    <Input
                      placeholder="08..."
                      className="h-10 text-sm bg-white border-stone-200"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Breakdown compact */}
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0 space-y-0.5 text-[10px]">
                  <div className="flex justify-between text-stone-500">
                    <span>Subtotal</span>
                    <span>Rp{cartSubtotal.toLocaleString("id-ID")}</span>
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
                    <span className="text-[#3C3025]">Rp{totalPrice.toLocaleString("id-ID")}</span>
                  </div>
                </div>

                {/* Right: payment collapse-toggle */}
                <div className="w-[160px] shrink-0">
                  <button
                    onClick={() => setIsPaymentExpanded(!isPaymentExpanded)}
                    className="w-full flex items-center justify-between h-7 text-[10px] font-bold text-stone-500 uppercase tracking-wider hover:text-stone-700 transition-colors border border-stone-200 rounded px-2"
                  >
                    <span>Bayar</span>
                    <svg className={`w-3 h-3 transition-transform ${isPaymentExpanded ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>

              {isPaymentExpanded && (
                <>
                  {/* Payment method pills */}
                  <div className="flex gap-1">
                    {(["CASH", "DEBIT", "QRIS"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setPaymentMethod(m)}
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
                    ref={amountPaidInputRef}
                    type="text"
                    value={formatNumber(amountPaid)}
                    onChange={(e) => { const v = e.target.value; if (/^[0-9.]*$/.test(v)) setAmountPaid(parseNumber(v)); }}
                    disabled={paymentMethod !== "CASH"}
                    placeholder="0"
                    className={cn(
                      "w-full h-8 text-sm font-black text-right px-2 rounded border border-stone-300 bg-white focus:outline-none focus:ring-1 focus:ring-stone-500",
                      paymentMethod !== "CASH" && "bg-stone-50 text-stone-400"
                    )}
                  />
                  {paymentMethod === "CASH" && amountPaid > 0 && (
                    <div className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded text-center", amountPaid >= totalPrice ? "text-green-700 bg-green-50" : "text-red-500 bg-red-50")}>
                      {amountPaid >= totalPrice ? `Kembali Rp${change.toLocaleString("id-ID")}` : `Kurang Rp${remainingPayment.toLocaleString("id-ID")}`}
                    </div>
                  )}
                  <Button
                    onClick={handleCheckout}
                    disabled={checkoutMutation.isPending || isSubmitting || !canCheckout}
                    className={cn(
                      "w-full h-10 text-xs font-black tracking-widest rounded-lg transition-all",
                      canCheckout
                        ? "bg-[#3C3025] hover:bg-[#5a4a38] text-white shadow-lg active:scale-[0.98]"
                        : "bg-stone-200 text-stone-400"
                    )}
                  >
                    {checkoutMutation.isPending || isSubmitting ? "PROSES..." : canCheckout ? `BAYAR Rp${totalPrice.toLocaleString("id-ID")}` : "LENGKAPI"}
                  </Button>
                </>
              )}
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
                // LOGIKA CERDAS: Gunakan diskon potensial dari promo
                const originalPrice = sku.priceOverride ?? variant.basePrice;
                const promoPercent = variant.promoDiscountPercent ?? 0;
                const discountAmount = promoPercent > 0
                  ? (originalPrice * promoPercent) / 100
                  : (variant.additionalDiscount ?? 0);



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
                  variant.comparisonPrice || originalPrice,
                  variant.promoMinPurchase || null, // ✅ Pass promoMinPurchase
                  variant.promoDiscountPercent || null, // ✅ Pass promoDiscountPercent
                  variant.promoTargetType || null, // ✅ Pass targetType
                  variant.isPromoConditional || false, // ✅ Pass conditional
                  variant.promoType || null // ✅ Pass promoType
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
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
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
