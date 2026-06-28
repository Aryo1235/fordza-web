"use client";
// features/promo/components/PromoHero.tsx

import { motion } from "framer-motion";
import { BadgePercent } from "lucide-react";

const headerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const headerItem = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

export function PromoHero() {
  return (
    <section className="bg-[#4A3B2E] pt-24 pb-20 px-4 relative overflow-hidden px-8">
      {/* Background Ornaments — identik dengan halaman kategori */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-amber-500/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />

      {/* Header teks — stagger fade-up */}
      <motion.div
        className="max-w-7xl mx-auto text-center relative z-10"
        variants={headerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Badge pill */}
        <motion.div
          variants={headerItem}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400/20 text-amber-400 rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-amber-400/30"
        >
          <BadgePercent className="w-4 h-4" />
          Penawaran Spesial
        </motion.div>

        {/* Judul */}
        <motion.h1
          variants={headerItem}
          className="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase mb-6 leading-none"
        >
          Promo &amp; <span className="text-amber-400">Diskon</span> Terbaik
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={headerItem}
          className="text-zinc-300 text-lg max-w-2xl mx-auto font-medium"
        >
          Koleksi pilihan Fordza dengan harga spesial — hanya untuk waktu terbatas.
          Jangan sampai ketinggalan kesempatan terbaik ini.
        </motion.p>
      </motion.div>
    </section>
  );
}
