import HeroSection from "@/features/landing-page/HeroSection";
import BannerSection from "@/features/landing-page/BannerSection";
import ProductsSection from "@/features/landing-page/ProductsSection";

export default function PublicHomePage() {
  return (
    <main className="min-h-screen bg-zinc-50">
      {/* ── Hero Carousel ── */}
      <HeroSection />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* ── Banner Promo ── */}
        <BannerSection />

        {/* ── Populer · Terlaris · Terbaru ── */}
        <ProductsSection />
      </div>
    </main>
  );
}
