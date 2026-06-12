"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/* ─────────────────────────────────────────
   Slide data
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
    sub: "Koleksi Sepatu premium\nuntuk pria berkarakter",
  },
  {
    heading: "Percaya Diri\nDalam Setiap Momen",
    sub: "Koleksi Sepatu premium\nsebagai wujud kualitas terbaik",
  },
];

/* ─────────────────────────────────────────
   Typewriter Speed Config
   ───────────────────────────────────────── */
const TYPE_SPEED    = 48;   // ms per char (mengetik)
const DELETE_SPEED  = 28;   // ms per char (menghapus)
const HOLD_DURATION = 2200; // ms berhenti sebelum hapus
const PAUSE_BETWEEN = 300;  // ms jeda antar fase

type Phase =
  | "typing-heading"
  | "pause-before-sub"
  | "typing-sub"
  | "holding"
  | "deleting-sub"
  | "pause-before-del-heading"
  | "deleting-heading"
  | "done";

/* ─────────────────────────────────────────
   Blinking Cursor
   ───────────────────────────────────────── */
function Cursor({ visible }: { visible: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-block",
        width: "3px",
        height: "0.82em",
        background: "rgba(255,255,255,0.9)",
        marginLeft: "3px",
        verticalAlign: "middle",
        borderRadius: "1px",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.08s",
      }}
    />
  );
}

/* ─────────────────────────────────────────
   Main Component
   ───────────────────────────────────────── */
export default function HeroSection() {
  const [current, setCurrent]               = useState(0);
  const [displayedHeading, setDisplayedHeading] = useState("");
  const [displayedSub, setDisplayedSub]         = useState("");
  const [phase, setPhase]                   = useState<Phase>("typing-heading");
  const [cursorOn, setCursorOn]             = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  /* Blinking cursor */
  useEffect(() => {
    const id = setInterval(() => setCursorOn((v) => !v), 530);
    return () => clearInterval(id);
  }, []);

  /* Reset saat slide berganti */
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setDisplayedHeading("");
    setDisplayedSub("");
    setPhase("typing-heading");
  }, [current]);

  /* Mesin typewriter utama */
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const fullHeading = TEXT_SLIDES[current].heading;
    const fullSub     = TEXT_SLIDES[current].sub;

    switch (phase) {

      /* ── Ketik heading ── */
      case "typing-heading":
        if (displayedHeading.length < fullHeading.length) {
          timerRef.current = setTimeout(() => {
            setDisplayedHeading(fullHeading.slice(0, displayedHeading.length + 1));
          }, TYPE_SPEED);
        } else {
          timerRef.current = setTimeout(() => setPhase("pause-before-sub"), PAUSE_BETWEEN);
        }
        break;

      /* ── Jeda sebelum ketik sub ── */
      case "pause-before-sub":
        timerRef.current = setTimeout(() => setPhase("typing-sub"), PAUSE_BETWEEN);
        break;

      /* ── Ketik sub ── */
      case "typing-sub":
        if (displayedSub.length < fullSub.length) {
          timerRef.current = setTimeout(() => {
            setDisplayedSub(fullSub.slice(0, displayedSub.length + 1));
          }, TYPE_SPEED);
        } else {
          timerRef.current = setTimeout(() => setPhase("holding"), PAUSE_BETWEEN);
        }
        break;

      /* ── Hold (tombol CTA muncul di sini) ── */
      case "holding":
        timerRef.current = setTimeout(() => setPhase("deleting-sub"), HOLD_DURATION);
        break;

      /* ── Hapus sub ── */
      case "deleting-sub":
        if (displayedSub.length > 0) {
          timerRef.current = setTimeout(() => {
            setDisplayedSub((prev) => prev.slice(0, -1));
          }, DELETE_SPEED);
        } else {
          timerRef.current = setTimeout(
            () => setPhase("pause-before-del-heading"),
            PAUSE_BETWEEN,
          );
        }
        break;

      /* ── Jeda sebelum hapus heading ── */
      case "pause-before-del-heading":
        timerRef.current = setTimeout(() => setPhase("deleting-heading"), PAUSE_BETWEEN);
        break;

      /* ── Hapus heading ── */
      case "deleting-heading":
        if (displayedHeading.length > 0) {
          timerRef.current = setTimeout(() => {
            setDisplayedHeading((prev) => prev.slice(0, -1));
          }, DELETE_SPEED);
        } else {
          /* Semua terhapus → slide berikutnya */
          timerRef.current = setTimeout(() => {
            setPhase("done");
            setCurrent((c) => (c + 1) % BG_SLIDES.length);
          }, PAUSE_BETWEEN);
        }
        break;

      case "done":
        break;
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase, displayedHeading, displayedSub, current]);

  /* Apakah cursor ada di heading vs sub */
  const cursorOnHeading =
    phase === "typing-heading" || phase === "deleting-heading";
  const cursorOnSub =
    phase === "pause-before-sub" ||
    phase === "typing-sub" ||
    phase === "holding" ||
    phase === "deleting-sub" ||
    phase === "pause-before-del-heading";

  /* Tombol CTA hanya muncul saat holding / menghapus */
  const showCTA =
    phase === "holding" ||
    phase === "deleting-sub" ||
    phase === "pause-before-del-heading" ||
    phase === "deleting-heading";

  return (
    <section
      id="hero"
      aria-label="Hero Carousel Fordza"
      className="relative w-full overflow-hidden"
      style={{ height: "clamp(420px, 55vw, 680px)" }}
    >
      {/* ── Background Image Stack ── */}
      {BG_SLIDES.map((s, i) => (
        <div
          key={s.id}
          className={cn(
            "absolute inset-0 transition-opacity duration-1000 ease-in-out",
            i === current ? "opacity-100 z-10" : "opacity-0 z-0",
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
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(20,13,5,0.88) 0%, rgba(30,20,10,0.6) 45%, transparent 82%)",
            }}
          />
        </div>
      ))}

      {/* ── Text Content ── */}
      <div className="relative z-20 flex h-full max-w-7xl mx-auto px-8 sm:px-14 lg:px-16 xl:px-10 items-center pb-14 sm:pb-16 md:pb-20 lg:items-center lg:pb-0">
        <div className="flex flex-col px-1 sm:px-0 items-start gap-5 sm:gap-6 lg:gap-8 w-full max-w-[310px] sm:max-w-md md:max-w-xl lg:max-w-4xl">

          {/* Heading */}
          <h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-[64px] font-black leading-[1.1] text-white w-full"
            style={{
              fontFamily: "var(--font-playfair), Georgia, serif",
              fontWeight: 800,
              textShadow: "0 4px 18px rgba(0,0,0,0.5)",
              whiteSpace: "pre-line",
              minHeight: "2.3em",
            }}
          >
            {displayedHeading}
            {cursorOnHeading && <Cursor visible={cursorOn} />}
          </h1>

          {/* Sub + CTA */}
          <div className="flex flex-col items-start gap-6 lg:gap-8 w-full">
            <p
              className="text-sm sm:text-base md:text-xl lg:text-3xl text-white/90 leading-snug lg:leading-[1.25] font-medium"
              style={{
                fontFamily: "var(--font-playfair), Georgia, serif",
                textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                whiteSpace: "pre-line",
                minHeight: "2em",
              }}
            >
              {displayedSub}
              {cursorOnSub && <Cursor visible={cursorOn} />}
            </p>

            {/* CTA — muncul saat holding / delete */}
            <div
              style={{
                opacity: showCTA ? 1 : 0,
                transform: showCTA ? "translateY(0)" : "translateY(14px)",
                transition: "opacity 0.45s ease, transform 0.45s ease",
                pointerEvents: showCTA ? "auto" : "none",
              }}
            >
              <Button
                asChild
                className={cn(
                  "rounded-md font-semibold text-xs sm:text-sm px-6 h-10 md:h-11 shadow-lg",
                  "bg-[var(--fordza-brown)] text-[var(--fordza-cream)]",
                  "border border-[var(--fordza-cream)]/40 hover:scale-105",
                  "hover:bg-[var(--fordza-cream)] hover:text-[var(--fordza-brown)]",
                  "transition-all duration-300",
                )}
              >
                <Link href="/products">Lihat Sepatu Kami</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Carousel Dots ── */}
      <div className="absolute bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
        {BG_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Carousel Ganti Latar ${i + 1}`}
            className={cn(
              "transition-all duration-300 rounded-full",
              i === current
                ? "w-5 h-2 bg-[var(--fordza-cream)]"
                : "size-2 bg-white/30 hover:bg-white/70",
            )}
          />
        ))}
      </div>
    </section>
  );
}
