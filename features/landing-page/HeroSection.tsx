"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/* ─────────────────────────────────────────
   Slide data — sesuai desain Figma
   ───────────────────────────────────────── */
const BG_SLIDES = [
  { id: 1, image: "/hero-shoes.png", alt: "Sepatu Premium" },
  { id: 2, image: "/hero-shirt.png", alt: "Kemeja Elegan" },
  { id: 3, image: "/hero-jacket.png", alt: "Jaket Kulit" },
];

const TEXT_SLIDES = [
  {
    heading: "Kenali Kualitas\nDi Setiap Langkah",
    sub: "Dibuat dengan keahlian tangan\npengrajin teliti",
  },
  {
    heading: "Gaya Formal\nTak Pernah Usang",
    sub: "Koleksi pakaian premium\nuntuk pria berkarakter",
  },
  {
    heading: "Percaya Diri\nDalam Setiap Momen",
    sub: "Outerwear eksklusif sebagai\nwujud kualitas terbaik",
  },
];

const AUTOPLAY_MS = 10500;

export default function HeroSection() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const goTo = useCallback(
    (idx: number) => {
      if (animating || idx === current) return;
      setAnimating(true);
      setTimeout(() => {
        setCurrent(idx);
        setAnimating(false);
      }, 700);
    },
    [animating, current]
  );

  /* Auto-play Carousel Gambar (Independen) */
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % BG_SLIDES.length);
    }, AUTOPLAY_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % BG_SLIDES.length);
    }, AUTOPLAY_MS);
  };

  const handleDot = (idx: number) => {
    goTo(idx);
    resetTimer();
  };

  return (
    <section
      id="hero"
      aria-label="Hero Carousel Fordza"
      className="relative w-full overflow-hidden"
      style={{ height: "clamp(420px, 55vw, 680px)" }}
    >
      {/* ── Background Image Stack (Layer Independen) ── */}
      {BG_SLIDES.map((s, i) => (
        <div
          key={s.id}
          className={cn(
            "absolute inset-0 transition-opacity duration-1000 ease-in-out",
            i === current ? "opacity-100 z-10" : "opacity-0 z-0"
          )}
          aria-hidden={i !== current}
        >
          <Image
            src={s.image}
            alt={s.alt}
            fill
            priority={i === 0}
            className="object-cover object-center"
            sizes="100vw"
          />
          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(20,13,5,0.85) 0%, rgba(30,20,10,0.55) 40%, transparent 80%)",
            }}
          />
        </div>
      ))}

      {/* ── Text Content (Typewriter Independen) ── */}
      <div className="relative z-20 flex h-full max-w-7xl mx-auto px-8 sm:px-14 lg:px-16  xl:px-10 items-center   pb-14 sm:pb-16 md:pb-20 lg:items-center lg:pb-0">
        <TypewriterOverlay />
      </div>
      {/* ── Carousel Dots ── */}
      <div className="absolute bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
        {BG_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => handleDot(i)}
            aria-label={`Carousel Ganti Latar ${i + 1}`}
            className={cn(
              "transition-all duration-300 rounded-full",
              i === current
                ? "w-5 h-2 bg-[var(--fordza-cream)]"
                : "size-2 bg-white/30 hover:bg-white/70"
            )}
          />
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   Typewriter Component (Lapisan Teks Independen)
   ───────────────────────────────────────── */
function TypewriterOverlay() {
  const [index, setIndex] = useState(0);
  const [displayHeading, setDisplayHeading] = useState("");
  const [displaySub, setDisplaySub] = useState("");
  const [phase, setPhase] = useState<"typing" | "idle" | "erasing">("typing");

  const slide = TEXT_SLIDES[index] || TEXT_SLIDES[0];
  const currentHeading = slide.heading;
  const currentSub = slide.sub;

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    // Kecepatan Mesin Tik
    const typeHeadingSpeed = 45; 
    const typeSubSpeed = 30; // Sub font kecil lebih cepat
    const idleDelay = 4000; 
    const eraseSpeed = 20; 

    if (phase === "typing") {
      if (displayHeading.length < currentHeading.length) {
        timeout = setTimeout(() => {
          setDisplayHeading(currentHeading.slice(0, displayHeading.length + 1));
        }, typeHeadingSpeed);
      } else if (displaySub.length < currentSub.length) {
        timeout = setTimeout(() => {
          setDisplaySub(currentSub.slice(0, displaySub.length + 1));
        }, typeSubSpeed);
      } else {
        timeout = setTimeout(() => setPhase("idle"), idleDelay);
      }
    } else if (phase === "idle") {
      setPhase("erasing");
    } else if (phase === "erasing") {
      if (displaySub.length > 0) {
        timeout = setTimeout(() => {
          setDisplaySub(currentSub.slice(0, displaySub.length - 1));
        }, eraseSpeed);
      } else if (displayHeading.length > 0) {
        timeout = setTimeout(() => {
          setDisplayHeading(currentHeading.slice(0, displayHeading.length - 1));
        }, eraseSpeed);
      } else {
        setIndex((i) => (i + 1) % TEXT_SLIDES.length);
        setPhase("typing");
      }
    }

    return () => clearTimeout(timeout);
  }, [displayHeading, displaySub, phase, currentHeading, currentSub]);

  // Logika Pemosisian Kursor (pindah dari H1 ke P secara mulus)
  const isTypingSub = displayHeading.length === currentHeading.length;
  const showCursorOnHeading = (!isTypingSub && phase === "typing") || (displaySub.length === 0 && phase === "erasing") || (displayHeading.length === 0);
  const showCursorOnSub = !showCursorOnHeading;

  return (
    <div className="flex flex-col px-1 sm:px-0 items-start gap-2 sm:gap-3 lg:gap-4 w-full max-w-[310px] sm:max-w-md md:max-w-xl lg:max-w-4xl">
      {/* Headline Typewriter */}
      <h1
        className="text-3xl sm:text-4xl md:text-5xl lg:text-[64px] font-black leading-[1.1] text-white w-full"
        style={{
          fontFamily: "var(--font-playfair), Georgia, serif",
          fontWeight: 800,
          textShadow: "0 4px 18px rgba(0,0,0,0.5)",
          whiteSpace: "pre-line",
          minHeight: "2.3em" // Ruang kaku disesuaikan dengan leading lebih rapat
        }}
      >
        {displayHeading}
        {showCursorOnHeading && (
          <span 
            className="inline-block align-bottom w-[3px] md:w-[4px] h-[0.9em] ml-1.5 md:ml-2 bg-[var(--fordza-cream)] shadow-[0_0_8px_rgba(235,215,190,0.8)]"
            style={{ animation: "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite" }}
          />
        )}
      </h1>

      {/* Sub dan CTA Button */}
      <div className="flex flex-col items-start gap-4 lg:gap-5 w-full">
        <p
          className="text-sm sm:text-base md:text-xl lg:text-3xl text-white/90 leading-snug lg:leading-[1.25] font-medium"
          style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            textShadow: "0 2px 4px rgba(0,0,0,0.5)",
            whiteSpace: "pre-line",
            minHeight: "2.6em" // Ruang disesuaikan dengan leading yang ditarik rapat
          }}
        >
          {displaySub}
          {showCursorOnSub && (
            <span 
              className="inline-block align-bottom w-[2px] md:w-[3px] h-[1em] ml-1 bg-white/70 shadow-[0_0_8px_rgba(255,255,255,0.5)]"
              style={{ animation: "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite" }}
            />
          )}
        </p>

        {/* Tombol CTA selalu tampil permanen (independen dari tulisan) */}
        <Button
          asChild
          className={cn(
            "rounded-md font-semibold text-xs sm:text-sm px-6 h-10 md:h-11 shadow-lg",
            "bg-[var(--fordza-brown)] text-[var(--fordza-cream)]",
            "border border-[var(--fordza-cream)]/40 hover:scale-105",
            "hover:bg-[var(--fordza-cream)] hover:text-[var(--fordza-brown)]",
            "transition-all duration-300"
          )}
        >
          <Link href="/products">Lihat Sepatu Kami</Link>
        </Button>
      </div>
    </div>
  );
}
