"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePublicBanners } from "./hooks";
import type { Banner } from "@/features/banners/types";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const AUTOPLAY_MS = 7000;
const TRANSITION_MS = 700; // durasi cross-fade sama seperti HeroSection

/* ───────── Skeleton ───────── */
function BannerSkeleton() {
  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl"
      style={{ height: "clamp(160px, 35vw, 420px)" }}
    >
      <Skeleton className="h-full w-full rounded-2xl" />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="size-2 rounded-full" />
        ))}
      </div>
    </div>
  );
}

/* ───────── Empty state ───────── */
function BannerEmpty() {
  return (
    <div
      className="flex w-full items-center justify-center rounded-2xl border-2 border-dashed border-[var(--fordza-cream-dark)]"
      style={{ height: "clamp(140px, 28vw, 320px)" }}
    >
      <p className="text-sm text-[var(--muted-foreground)]">
        Belum ada banner promo aktif.
      </p>
    </div>
  );
}

/* ───────── Carousel — teknik stack absolute sama seperti HeroSection ───────── */
function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  /* ── Timer helpers ── */
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (banners.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % banners.length);
    }, AUTOPLAY_MS);
  }, [banners.length]);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTimer]);

  /* ── Navigate ── */
  const goTo = useCallback(
    (idx: number) => {
      if (transitioning || idx === current) return;
      setTransitioning(true);
      // Delay setCurrent agar gambar lama masih terlihat selama animasi dimulai
      setTimeout(() => {
        setCurrent(idx);
        setTransitioning(false);
      }, TRANSITION_MS);
      startTimer();
    },
    [transitioning, current, startTimer]
  );

  const banner = banners[current];

  /* ── Inner carousel markup ── */
  const carousel = (
    <div
      className="relative w-full overflow-hidden rounded-2xl select-none"
      style={{ height: "clamp(160px, 35vw, 420px)" }}
    >
      {/*
        Stack semua slide di posisi absolute, sama persis seperti HeroSection.
        Aktif → opacity-100 z-10 | Tidak aktif → opacity-0 z-0
        CSS transition duration dikontrol via style agar mudah diubah.
      */}
      {banners.map((b, i) => (
        <div
          key={b.id}
          aria-hidden={i !== current}
          className={cn(
            "absolute inset-0",
            i === current ? "opacity-100 z-10" : "opacity-0 z-0"
          )}
          style={{
            transition: `opacity ${TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          }}
        >
          <Image
            src={b.imageUrl}
            alt={b.title ?? `Banner promo ${i + 1}`}
            fill
            priority={i === 0}
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1280px"
          />
        </div>
      ))}

      {/* Gradient bawah supaya dots terbaca */}
      {banners.length > 1 && (
        <div
          className="absolute inset-x-0 bottom-0 h-16 pointer-events-none z-20"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 100%)",
          }}
        />
      )}

      {/* Dots — pill aktif seperti HeroSection */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.preventDefault();
                goTo(i);
              }}
              aria-label={`Banner ${i + 1}`}
              className={cn(
                "rounded-full transition-all duration-300",
                i === current
                  ? "w-5 h-2 bg-white"
                  : "size-2 bg-white/50 hover:bg-white/80"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );

  /* Bungkus Link jika ada linkUrl pada slide aktif */
  return banner.linkUrl ? (
    <Link href={banner.linkUrl} className="block w-full" tabIndex={-1}>
      {carousel}
    </Link>
  ) : (
    <div className="w-full">{carousel}</div>
  );
}

/* ───────── Section wrapper ───────── */
export default function BannerSection() {
  const { data, isLoading, isError } = usePublicBanners();

  const banners: Banner[] = data?.data
    ? [...(data.data as Banner[])].sort((a, b) => a.order - b.order)
    : [];

  return (
    <section
      id="banner-promo"
      aria-label="Banner Promo Fordza"
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10"
    >
      {/* Label */}
      <div className="mb-4 flex items-center gap-3">
        <span
          className="text-xs font-semibold tracking-[0.18em] uppercase"
          style={{ color: "var(--fordza-brown-light)" }}
        >
          Promo Terkini
        </span>
        <div
          className="flex-1 h-px"
          style={{ background: "var(--fordza-cream-dark)" }}
        />
      </div>

      {/* States */}
      {isLoading && <BannerSkeleton />}
      {isError && <BannerEmpty />}
      {!isLoading && !isError && banners.length === 0 && <BannerEmpty />}
      {!isLoading && !isError && banners.length > 0 && (
        <BannerCarousel banners={banners} />
      )}
    </section>
  );
}
