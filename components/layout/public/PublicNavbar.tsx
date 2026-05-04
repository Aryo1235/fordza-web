"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, ShoppingBag, ChevronRight } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navLinks = [
  { label: "Beranda", href: "/" },
  { label: "Produk", href: "/products" },
  { label: "Kategori", href: "/categories" },
  { label: "Promo", href: "/products?filter=promo" },
  { label: "Tentang", href: "/about" },
];

export default function PublicNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header
      className="sticky inset-x-0 top-0 z-50"
      style={{ background: "var(--fordza-brown)" }}
    >
      <div className="mx-auto flex h-15 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* ── Logo ── */}
        <Link
          href="/"
          className="flex items-center gap-2"
          aria-label="Fordza Home"
        >
          {/* icon mark */}
          <div className="flex size-7 items-center justify-center rounded-md bg-white/15">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="size-4 text-[var(--fordza-cream)]"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z" />
            </svg>
          </div>
          <span
            className="text-xl font-bold tracking-wide"
            style={{
              color: "var(--fordza-cream)",
              fontFamily: "var(--font-playfair), Georgia, serif",
              fontStyle: "italic",
              letterSpacing: "0.04em",
            }}
          >
            Fordza
          </span>
        </Link>

        {/* ── Desktop Nav Links ── */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-150 text-white/70 hover:text-white hover:bg-white/10"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* ── Desktop CTA ── */}
        <div className="hidden lg:flex items-center gap-3">
          <Button
            asChild
            size="sm"
            className="rounded-lg font-semibold text-[var(--fordza-brown)] bg-[var(--fordza-cream)] hover:bg-white transition-colors duration-200"
          >
            <Link href="/products">
              <ShoppingBag className="size-3.5 mr-1.5" />
              Belanja
            </Link>
          </Button>
        </div>

        {/* ── Tablet / Mobile: Hamburger ── */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              aria-label="Buka menu"
              className="lg:hidden flex items-center justify-center size-9 rounded-lg text-white/80 hover:bg-white/10 transition-colors duration-150"
            >
              {/* 3-line hamburger icon matching Figma */}
              <div className="flex flex-col gap-[5px]">
                <span className="block h-[2px] w-5 rounded-full bg-white" />
                <span className="block h-[2px] w-5 rounded-full bg-white" />
                <span className="block h-[2px] w-5 rounded-full bg-white" />
              </div>
            </button>
          </SheetTrigger>

          {/* ── Mobile Drawer ── */}
          <SheetContent
            side="right"
            className="w-[280px] sm:w-[320px] p-0 flex flex-col border-l-0"
            style={{ background: "var(--fordza-brown)" }}
          >
            <SheetTitle className="sr-only">Menu Navigasi Fordza</SheetTitle>

            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2"
              >
                <span
                  className="text-xl font-bold"
                  style={{
                    color: "var(--fordza-cream)",
                    fontFamily: "var(--font-playfair), Georgia, serif",
                    fontStyle: "italic",
                    letterSpacing: "0.04em",
                  }}
                >
                  Fordza
                </span>
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="size-8 flex items-center justify-center rounded-lg text-white/60 hover:bg-white/10 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Drawer Links */}
            <nav className="flex flex-col flex-1 px-3 py-5 gap-0.5 overflow-y-auto">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-xl px-4 py-3.5 text-white/80 font-medium hover:bg-white/10 hover:text-white transition-colors duration-150 group text-sm"
                >
                  <span>{link.label}</span>
                  <ChevronRight className="size-4 text-white/30 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all duration-150" />
                </Link>
              ))}

              <Separator className="my-4 bg-white/10" />

              <Button
                asChild
                className="mx-1 rounded-xl font-bold text-[var(--fordza-brown)] bg-[var(--fordza-cream)] hover:bg-white h-11"
              >
                <Link href="/products" onClick={() => setOpen(false)}>
                  <ShoppingBag className="size-4 mr-2" />
                  Belanja Sekarang
                </Link>
              </Button>
            </nav>

            {/* Drawer Footer */}
            <div className="px-5 py-4 border-t border-white/10">
              <p className="text-xs text-white/30 text-center">
                © 2025 Fordza · Premium Menswear
              </p>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
