"use client";

import type { Metadata } from "next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Clock,
  Phone,
  Instagram,
  Award,
  Leaf,
  Hammer,
  Heart,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Gem,
  Tag,
  Hand,
} from "lucide-react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { FadeUpSection, StaggerList, StaggerItem } from "@/components/shared/animations";
import { SmoothScroll, Magnetic, Tilt3D } from "@/components/shared/premium-animations";

// ── Data ────────────────────────────────────────────────────────────────────

const whyFordzaItems = [
  {
    icon: Gem,
    title: "Material Kulit Asli",
    desc: "Kulit asli berkualitas tinggi yang menjamin daya tahan, kenyamanan, dan tampilan elegan.",
    accent: "bg-emerald-50 text-emerald-700 border-emerald-200",
    hover: { scale: 1.05, y: -10, boxShadow: "0 20px 25px -5px rgba(16, 185, 129, 0.1)" }
  },
  {
    icon: ShieldCheck,
    title: "Jaminan Kualitas",
    desc: "Setiap produk Fordza dilindungi oleh garansi penuh selama 6 bulan untuk cacat manufaktur.",
    accent: "bg-sky-50 text-sky-700 border-sky-200",
    hover: { rotate: 2, scale: 1.03, y: -5, boxShadow: "0 20px 25px -5px rgba(14, 165, 233, 0.1)" }
  },
  {
    icon: Hand,
    title: "Sentuhan Pengrajin Ahli",
    desc: "Dirakit secara manual dengan presisi oleh pengrajin lokal kami yang sangat berpengalaman.",
    accent: "bg-amber-50 text-amber-700 border-amber-200",
    hover: { x: 8, scale: 1.02, boxShadow: "0 20px 25px -5px rgba(245, 158, 11, 0.1)" }
  },
  {
    icon: Tag,
    title: "Harga yang Jujur",
    desc: "Nikmati sepatu berstandar premium dengan harga yang jauh lebih masuk akal dan terjangkau.",
    accent: "bg-rose-50 text-rose-700 border-rose-200",
    hover: { y: -12, rotate: -2, scale: 1.05, boxShadow: "0 20px 25px -5px rgba(225, 29, 72, 0.1)" }
  },
];

const processSteps = [
  {
    step: "01",
    title: "Pemilihan Kulit",
    desc: "Seleksi ketat kulit premium langsung dari penyamak Garut untuk kualitas terbaik.",
  },
  {
    step: "02",
    title: "Pola & Potong",
    desc: "Pola presisi hasil riset ergonomi untuk kenyamanan kaki yang maksimal.",
  },
  {
    step: "03",
    title: "Jahit & Rakit",
    desc: "Teknik jahit manual Goodyear Welt untuk konstruksi sepatu yang tangguh.",
  },
  {
    step: "04",
    title: "Finishing & QC",
    desc: "Pemeriksaan detail menyeluruh untuk memastikan kualitas sempurna di setiap pasang.",
  },
];

const faqs = [
  {
    q: "Apakah Fordza menerima custom order?",
    a: "Ya! Kami melayani custom order dengan minimum order 1 pasang. Konsultasikan pilihan material, warna, dan desain Anda melalui WhatsApp kami. Estimasi pengerjaan custom 3–4 minggu.",
  },
  {
    q: "Berapa lama pengiriman pesanan online?",
    a: "Untuk produk ready stock, kami proses dalam 1–2 hari kerja. Pengiriman ke seluruh Indonesia menggunakan JNE, Sicepat, atau J&T sesuai pilihan Anda. Estimasi 2–5 hari kerja tergantung lokasi.",
  },
  {
    q: "Bagaimana cara menentukan ukuran yang tepat?",
    a: "Kami menyarankan mengukur panjang kaki dalam satuan cm lalu mencocokkan dengan size chart kami. Jika ragu, hubungi CS kami — kami dengan senang hati membantu memilihkan size yang paling pas.",
  },
  {
    q: "Apakah sepatu Fordza bisa di-resole?",
    a: "Tentu! Salah satu keunggulan konstruksi Goodyear Welt adalah kemampuan resole berkali-kali tanpa merusak upper. Kami menyediakan layanan resole di workshop kami.",
  },
  {
    q: "Apa kebijakan pengembalian produk?",
    a: "Kami menerima pengembalian dalam 7 hari setelah barang diterima, selama produk belum dipakai dan masih dalam kondisi original. Cacat produksi ditanggung penuh oleh Fordza.",
  },
  {
    q: "Bagaimana cara merawat sepatu kulit Fordza?",
    a: "Gunakan sikat lembut untuk membersihkan debu, aplikasikan shoe cream atau conditioner setiap 2–4 minggu, dan simpan dengan shoe tree agar bentuk terjaga. Hindari paparan sinar matahari langsung.",
  },
];

/* ── Custom Animations ── */
const titleVariants = {
  hidden: { opacity: 0, y: 50 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }
  }
};

// ── Component ────────────────────────────────────────────────────────────────

export default function AboutPage() {
  const heroRef = useRef(null);
  const processRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacityText = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <SmoothScroll>
      <div className="min-h-screen bg-[#FDFCFB]">
        {/* ── HERO ── */}
        <section ref={heroRef} className="relative bg-[#4A3B2E] overflow-hidden">
          {/* Parallax Background Container */}
          <motion.div style={{ y: yBg }} className="absolute inset-0 w-full h-full">
            {/* Decorative orbs (animated float) */}
            <motion.div
              animate={{ y: [0, -30, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none"
            />
            <motion.div
              animate={{ y: [0, 40, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-amber-400/10 translate-y-1/2 -translate-x-1/4 blur-2xl pointer-events-none"
            />
          </motion.div>

          <motion.div style={{ opacity: opacityText }} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 text-center">
            <motion.div
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } }
              }}
            >
              <motion.div variants={titleVariants} className="inline-block">
                <Badge className="mb-6 bg-amber-400/20 text-amber-400 border-amber-400/30 hover:bg-amber-400/30 text-xs font-black uppercase tracking-widest px-4 py-1.5">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Tentang Fordza
                </Badge>
              </motion.div>

              <motion.h1
                variants={titleVariants}
                className="text-5xl md:text-6xl lg:text-7xl font-black text-white italic tracking-tighter uppercase leading-none mb-6 overflow-hidden"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
              >
                Craft Yang <span className="text-amber-400">Berbicara</span>
              </motion.h1>

              <motion.p
                variants={titleVariants}
                className="text-zinc-300 text-lg md:text-2xl max-w-2xl mx-auto leading-relaxed"
              >
                Fordza lahir dari satu keyakinan sederhana: sepatu yang dibuat
                dengan tangan dan cinta akan menemani Anda melewati ribuan
                perjalanan.
              </motion.p>
            </motion.div>
          </motion.div>
        </section>

        {/* ── CERITA FORDZA ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 lg:py-28 overflow-hidden">
          <FadeUpSection className="mb-8 lg:mb-10">
            <p className="text-xs font-black uppercase tracking-widest text-[#4A3B2E]/40 mb-3">
              Kisah Kami
            </p>
            <h2
              className="text-4xl md:text-5xl xl:text-6xl font-black text-[#4A3B2E] italic uppercase leading-tight"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              Dimulai dari <br className="hidden md:block lg:hidden" />
            </h2>
            <span
              className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-amber-600 italic uppercase leading-tight"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              Sebuah Workshop
            </span>
          </FadeUpSection>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-8 items-start">
            {/* Text side */}
            <StaggerList stagger={0.15} className="flex flex-col gap-4 text-[#4A3B2E]/70 md:text-lg leading-relaxed text-justify">
              <StaggerItem>
                Fordza lahir dari passion untuk menghadirkan sepatu kulit
                berkualitas yang accessible untuk semua orang. Dimulai pada tahun
                2019 di Bogor, kami percaya bahwa setiap orang berhak memiliki
                sepatu yang tidak hanya nyaman, tetapi juga tahan lama dan
                stylish.
              </StaggerItem>
              <StaggerItem>
                Kami berkomitmen untuk mempertahankan tradisi craftsmanship sambil
                terus berinovasi dalam desain. Setiap produk Fordza adalah hasil
                kolaborasi antara pengrajin berpengalaman dan desainer muda yang
                memahami kebutuhan pasar modern.
              </StaggerItem>
              <StaggerItem>
                <motion.blockquote
                  whileHover={{ scale: 1.02, x: 10 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className="border-l-4 border-amber-500 pl-5 py-2 my-2 italic font-semibold text-[#4A3B2E] bg-amber-50/50 rounded-r-xl"
                >
                  "Kualitas yang bertahan, gaya yang abadi."
                </motion.blockquote>
              </StaggerItem>
              <StaggerItem>
                Fordza adalah brand lokal yang berfokus pada produk kulit
                berkualitas, meliputi sepatu, sandal kulit, dan aksesori. Kami
                berdedikasi menghadirkan produk dengan material pilihan,
                pengerjaan yang detail, serta desain fungsional dengan harga yang
                tetap terjangkau.
              </StaggerItem>
            </StaggerList>

            {/* Visual side — stat cards */}
            <StaggerList stagger={0.1} className="grid grid-cols-2 gap-4 mt-4 lg:mt-0">
              {[
                { num: "2019", label: "Tahun Berdiri", sub: "Sejak Bogor" },
                { num: "100+", label: "Model Desain", sub: "Terus bertambah" },
                { num: "10rb+", label: "Pasang Terjual", sub: "Produk terbukti" },
                { num: "100%", label: "Handcrafted", sub: "No shortcuts, ever." },
              ].map((s, i) => (
                <StaggerItem key={i}>
                  <Tilt3D>
                    <motion.div
                      whileHover={{ y: -8, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                      className="bg-white rounded-2xl border border-[#e8d8c4] p-6 shadow-sm transition-all duration-300 h-full"
                    >
                      <p
                        className="text-4xl md:text-5xl lg:text-4xl font-black text-[#4A3B2E] leading-none mb-2"
                        style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                      >
                        {s.num}
                      </p>
                      <p className="text-sm md:text-base font-bold text-[#4A3B2E]">
                        {s.label}
                      </p>
                      <p className="text-xs md:text-sm text-[#4A3B2E]/50 mt-1">
                        {s.sub}
                      </p>
                    </motion.div>
                  </Tilt3D>
                </StaggerItem>
              ))}
            </StaggerList>
          </div>
        </section>

        <Separator className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" />

        {/* ── MENGAPA FORDZA ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 lg:py-28 overflow-hidden">
          <FadeUpSection className="text-center mb-14">
            <p className="text-xs font-black uppercase tracking-widest text-[#4A3B2E]/40 mb-3">
              Keunggulan
            </p>
            <h2
              className="text-3xl md:text-5xl xl:text-6xl font-black text-[#4A3B2E] italic uppercase"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              Mengapa <span className="text-amber-600">Fordza?</span>
            </h2>
          </FadeUpSection>

          <StaggerList stagger={0.1} className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5 lg:gap-6 xl:gap-4">
            {whyFordzaItems.map((item, i) => (
              <StaggerItem key={i}>
                <motion.div
                  whileHover={item.hover}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="bg-white rounded-2xl border border-[#e8d8c4] p-6 shadow-sm flex flex-col gap-4 h-full cursor-pointer transition-colors hover:border-amber-200"
                >
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-xl border ${item.accent}`}
                  >
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#4A3B2E] md:text-lg mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm md:text-base text-[#4A3B2E]/60 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerList>
        </section>

        {/* ── PROSES PEMBUATAN ── */}
        <section ref={processRef} className="bg-[#4A3B2E] py-16 md:py-20 lg:py-28 relative overflow-hidden">
          <motion.div
            animate={{ opacity: [0.03, 0.08, 0.03] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: "32px 32px",
            }}
          />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeUpSection className="text-center mb-14 md:mb-20">
              <p className="text-xs font-black uppercase tracking-widest text-amber-400/70 mb-3">
                Behind The Scenes
              </p>
              <h2
                className="text-3xl md:text-5xl xl:text-6xl font-black text-white italic uppercase"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
              >
                Proses <span className="text-amber-400">Pembuatan</span>
              </h2>
            </FadeUpSection>

            <div className="relative">
              {/* Desktop Timeline Line (Horizontal) - Only on LG */}
              <div className="relative mb-18 hidden lg:block">
                {/* Background Line */}
                <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/10 -translate-y-1/2" />
                {/* Animated Glowing Line */}
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: "100%" }}
                  viewport={{ once: false, amount: 0.5 }}
                  transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute top-1/2 left-0 h-[2px] bg-gradient-to-r from-amber-600 via-amber-400 to-white -translate-y-1/2 shadow-[0_0_15px_rgba(251,191,36,0.5)] z-20"
                />

                {/* Timeline Nodes - Grid aligned to 4 cols */}
                <div className="absolute top-1/2 left-0 w-full grid grid-cols-4 -translate-y-1/2 z-30    ">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="flex justify-center lg:justify-start lg:pl-1">
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: false, amount: 0.5 }}
                        transition={{ delay: 0.5 * i, duration: 0.5, type: "spring" }}
                        className="w-4 h-4 rounded-full bg-[#4A3B2E] border-2 border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)] "
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile/Tablet Timeline Line (Vertical) - On SM and MD */}
              <div className="absolute left-6 md:left-10 top-0 bottom-0 w-[2px] bg-white/10 lg:hidden overflow-hidden z-0  ">
                <motion.div
                  initial={{ height: 0 }}
                  whileInView={{ height: "100%" }}
                  viewport={{ once: false, amount: 0.1 }}
                  transition={{ duration: 3, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute top-0 left-0 w-full bg-gradient-to-b from-amber-600 via-amber-400 to-white shadow-[0_0_15px_rgba(251,191,36,0.5)]"
                />
              </div>

              <StaggerList stagger={0.4} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-16 md:gap-x-12 lg:gap-8 pl-14 md:pl-24 lg:pl-0 relative z-10 lg:pt-2">
                {processSteps.map((step, i) => (
                  <StaggerItem key={i}>
                    <motion.div
                      whileHover={{ y: -10 }}
                      className="relative flex flex-col gap-4 group"
                    >
                      {/* Vertical Mobile/Tablet Node */}
                      <motion.div
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: false, amount: 0.5 }}
                        transition={{ delay: 0.2 + (i * 0.1), type: "spring" }}
                        className="absolute -left-14 md:-left-22 top-6 md:top-8 w-4 h-4 rounded-full bg-[#4A3B2E] border-2 border-amber-400 lg:hidden shadow-[0_0_10px_rgba(251,191,36,0.8)] z-30"
                      />

                      {/* Angka Background beranimasi besar */}
                      <motion.p
                        className="text-6xl md:text-8xl xl:text-9xl font-black text-white/5 leading-none mb-2 absolute -top-8 -left-4 pointer-events-none transition-colors group-hover:text-amber-400/10"
                        style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                      >
                        {step.step}
                      </motion.p>

                      <div className="relative z-10 pt-4 md:pt-6">
                        {/* Status Indicator Line */}
                        <motion.div
                          className="w-1.5 h-1 lg:h-1 bg-amber-400 rounded-full mb-6 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                          initial={{ scaleY: 0, scaleX: 0 }}
                          whileInView={{ scaleY: 1, scaleX: 1 }}
                          viewport={{ once: false, amount: 0.5 }}
                          transition={{ duration: 0.6, delay: 0.4 * i }}
                        />
                        <h3 className="font-bold text-white text-2xl mb-4 group-hover:text-amber-400 transition-colors">
                          {step.title}
                        </h3>
                        <p className="text-sm md:text-base text-white/70 leading-relaxed font-medium">
                          {step.desc}
                        </p>
                      </div>
                    </motion.div>
                  </StaggerItem>
                ))}
              </StaggerList>
            </div>
          </div>
        </section>

        {/* ── LOKASI & JAM BUKA ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 lg:py-28 overflow-hidden">
          <FadeUpSection className="text-center mb-14">
            <p className="text-xs font-black uppercase tracking-widest text-[#4A3B2E]/40 mb-3">
              Kunjungi Kami
            </p>
            <h2
              className="text-3xl md:text-5xl xl:text-6xl font-black text-[#4A3B2E] italic uppercase"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              Lokasi & <span className="text-amber-600">Jam Buka</span>
            </h2>
          </FadeUpSection>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-10 items-stretch">
            {/* Info Cards */}
            <StaggerList stagger={0.15} className="flex flex-col gap-6">
              {/* Address */}
              <StaggerItem>
                <motion.div whileHover={{ x: 5 }} className="bg-white rounded-2xl border border-[#e8d8c4] p-6 shadow-sm flex gap-5 h-full">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#4A3B2E]/5 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-[#4A3B2E]" />
                  </div>
                  <div>
                    <p className="font-bold text-[#4A3B2E] text-lg mb-2">
                      Showroom & Workshop
                    </p>
                    <p className="text-sm text-[#4A3B2E]/70 leading-relaxed">
                      Jl.Raya Cilebut Kp, Jl. Bojong Sempu Samping Puri Kintamani
                      No.Rt.03/06, Cilebut Bar., Kec. Sukaraja
                      <br />
                      Kabupaten Bogor, Jawa Barat 16710
                    </p>
                  </div>
                </motion.div>
              </StaggerItem>

              {/* Hours */}
              <StaggerItem>
                <motion.div whileHover={{ x: 5 }} className="bg-white rounded-2xl border border-[#e8d8c4] p-6 shadow-sm flex gap-5 h-full">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-amber-700" />
                  </div>
                  <div className="w-full">
                    <p className="font-bold text-[#4A3B2E] text-lg mb-4">Jam Operasional</p>
                    <div className="flex flex-col gap-3 text-sm">
                      {[
                        { day: "Senin – Jumat", hours: "09.00 – 18.00 WIB", open: true },
                        { day: "Sabtu", hours: "09.00 – 16.00 WIB", open: true },
                        { day: "Minggu & Libur Nasional", hours: "Tutup", open: false },
                      ].map((row, i) => (
                        <div key={i} className="flex justify-between items-center border-b border-amber-50 pb-2 last:border-0 last:pb-0">
                          <span className="text-[#4A3B2E]/70 font-medium">{row.day}</span>
                          <span className={`font-bold ${row.open ? "text-[#4A3B2E]" : "text-rose-500"}`}>
                            {row.hours}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>

              {/* Contact */}
              <StaggerItem>
                <motion.div whileHover={{ x: 5 }} className="bg-white rounded-2xl border border-[#e8d8c4] p-6 shadow-sm flex gap-5 h-full">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                    <Phone className="w-6 h-6 text-green-700" />
                  </div>
                  <div>
                    <p className="font-bold text-[#4A3B2E] text-lg mb-3">Hubungi Kami</p>
                    <div className="flex flex-col gap-3 text-sm">
                      <a
                        href="https://wa.me/6281234567890"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-green-700 font-bold hover:text-green-600 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        +62 812-3456-7890 (WhatsApp)
                      </a>
                      <a
                        href="https://instagram.com/fordza.id"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-rose-600 font-bold hover:text-rose-500 transition-colors"
                      >
                        <Instagram className="w-4 h-4" />
                        @fordza.id
                      </a>
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>
            </StaggerList>

            {/* Google Maps Embed — Fade Up */}
            <FadeUpSection className="h-full min-h-[400px]">
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="rounded-3xl overflow-hidden border-4 border-white shadow-xl h-full w-full relative"
              >
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3964.0257200516207!2d106.7919373248397!3d-6.518428013725551!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69c3bac092f053%3A0x45d25143df867555!2sFordza%20Indonesia!5e0!3m2!1sid!2sid!4v1778065104282!5m2!1sid!2sid"
                  className="absolute inset-0 w-full h-full border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </motion.div>
            </FadeUpSection>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="bg-[#fef4e8]/60 py-16 md:py-20 lg:py-28 overflow-hidden">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeUpSection className="text-center mb-14">
              <p className="text-xs font-black uppercase tracking-widest text-[#4A3B2E]/40 mb-3">
                Pertanyaan Umum
              </p>
              <h2
                className="text-3xl md:text-5xl xl:text-6xl font-black text-[#4A3B2E] italic uppercase"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
              >
                FAQ
              </h2>
            </FadeUpSection>

            <StaggerList stagger={0.08} className="flex flex-col gap-4">
              <Accordion type="single" collapsible className="flex flex-col gap-3">
                {faqs.map((faq, i) => (
                  <StaggerItem key={i}>
                    <AccordionItem
                      value={`faq-${i}`}
                      className="bg-white rounded-xl border border-[#e8d8c4] px-6 shadow-sm data-[state=open]:shadow-md transition-shadow"
                    >
                      <AccordionTrigger className="font-semibold md:text-lg text-[#4A3B2E] text-left hover:no-underline py-5">
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-[#4A3B2E]/70 md:text-base leading-relaxed pb-5">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  </StaggerItem>
                ))}
              </Accordion>
            </StaggerList>
          </div>
        </section>

        {/* ── CTA BOTTOM ── */}
        <section className="relative bg-[#4A3B2E] py-20 overflow-hidden">
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-40 -right-40 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"
          />
          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
            <FadeUpSection>
              <motion.div
                whileHover={{ rotate: 360, scale: 1.2 }}
                transition={{ duration: 0.8 }}
                className="inline-block"
              >
                <Award className="w-12 h-12 text-amber-400 mx-auto mb-6" />
              </motion.div>
              <h2
                className="text-3xl md:text-4xl xl:text-5xl font-black text-white italic uppercase mb-4"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
              >
                Siap Memulai Perjalanan Anda?
              </h2>
              <p className="text-white/60 md:text-lg mb-10 max-w-xl mx-auto font-medium">
                Jelajahi koleksi terbaru kami atau kunjungi showroom kami langsung
                di Bogor.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Magnetic>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      href="/products"
                      className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-[#4A3B2E] font-bold px-8 py-3.5 rounded-xl transition-colors w-full sm:w-auto"
                    >
                      Lihat Koleksi <ChevronRight className="w-4 h-4" />
                    </Link>
                  </motion.div>
                </Magnetic>
                <Magnetic>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <a
                      href="https://wa.me/6281234567890"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-3.5 rounded-xl border border-white/20 transition-colors w-full sm:w-auto"
                    >
                      Hubungi Kami
                    </a>
                  </motion.div>
                </Magnetic>
              </div>
            </FadeUpSection>
          </div>
        </section>
      </div>
    </SmoothScroll>
  );
}
