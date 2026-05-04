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

export const metadata: Metadata = {
  title: "Tentang Kami — FORDZA",
  description:
    "Kenali kisah di balik Fordza — brand sepatu premium lokal Indonesia yang lahir dari passion, keahlian tangan, dan cinta pada craft.",
};

// ── Data ────────────────────────────────────────────────────────────────────

const whyFordzaItems = [
  {
    icon: Gem,
    title: "Material Kulit Asli",
    desc: "Kulit asli berkualitas tinggi yang menjamin daya tahan, kenyamanan, dan tampilan elegan.",
    accent: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    icon: ShieldCheck,
    title: "Jaminan Kualitas",
    desc: "Setiap produk Fordza dilindungi oleh garansi penuh selama 6 bulan untuk cacat manufaktur.",
    accent: "bg-sky-50 text-sky-700 border-sky-200",
  },
  {
    icon: Hand,
    title: "Sentuhan Pengrajin Ahli",
    desc: "Dirakit secara manual dengan presisi oleh pengrajin lokal kami yang sangat berpengalaman.",
    accent: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    icon: Tag,
    title: "Harga yang Jujur",
    desc: "Nikmati sepatu berstandar premium dengan harga yang jauh lebih masuk akal dan terjangkau.",
    accent: "bg-rose-50 text-rose-700 border-rose-200",
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

// ── Component ────────────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FDFCFB]">

      {/* ── HERO ── */}
      <section className="relative bg-[#4A3B2E] overflow-hidden">
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-amber-400/10 translate-y-1/2 -translate-x-1/4 blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 text-center">
          <Badge className="mb-6 bg-amber-400/20 text-amber-400 border-amber-400/30 hover:bg-amber-400/30 text-xs font-black uppercase tracking-widest px-4 py-1.5">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Tentang Fordza
          </Badge>
          <h1
            className="text-5xl md:text-6xl lg:text-7xl font-black text-white italic tracking-tighter uppercase leading-none mb-6"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Craft Yang <span className="text-amber-400">Berbicara</span>
          </h1>
          <p className="text-zinc-300 text-lg md:text-2xl max-w-2xl mx-auto leading-relaxed">
            Fordza lahir dari satu keyakinan sederhana: sepatu yang dibuat dengan
            tangan dan cinta akan menemani Anda melewati ribuan perjalanan.
          </p>
        </div>
      </section>

      {/* ── CERITA FORDZA ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 lg:py-28">
        <div className="mb-8 lg:mb-10">
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
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-8 items-start">
          {/* Text side */}
          <div className="flex flex-col gap-3 text-[#4A3B2E]/70 md:text-lg leading-relaxed text-justify">
            <p>
              Fordza lahir dari passion untuk menghadirkan sepatu kulit berkualitas yang accessible untuk semua orang. Dimulai pada tahun 2019 di Bogor, kami percaya bahwa setiap orang berhak memiliki sepatu yang tidak hanya nyaman, tetapi juga tahan lama dan stylish.
            </p>
            <p>
              Kami berkomitmen untuk mempertahankan tradisi craftsmanship sambil terus berinovasi dalam desain. Setiap produk Fordza adalah hasil kolaborasi antara pengrajin berpengalaman dan desainer muda yang memahami kebutuhan pasar modern.
            </p>
            <blockquote className="border-l-4 border-amber-500 pl-4 py-1 italic font-semibold text-[#4A3B2E]">
              "Kualitas yang bertahan, gaya yang abadi."
            </blockquote>
            <p>
              Fordza adalah brand lokal yang berfokus pada produk kulit berkualitas, meliputi sepatu, sandal kulit, dan aksesori. Kami berdedikasi menghadirkan produk dengan material pilihan, pengerjaan yang detail, serta desain fungsional dengan harga yang tetap terjangkau. Setiap produk Fordza dirancang untuk memberikan kenyamanan, daya tahan, dan gaya yang dapat diandalkan dalam menunjang aktivitas Anda sehari-hari.
            </p>
          </div>

          {/* Visual side — stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4 mt-4 lg:mt-0">
            {[
              { num: "2019", label: "Tahun Berdiri", sub: "Sejak Bogor" },
              { num: "100+", label: "Model Desain", sub: "Terus bertambah" },
              { num: "12", label: "Pengrajin Ahli", sub: "Avg. 15 thn pengalaman" },
              { num: "100%", label: "Handcrafted", sub: "No shortcuts, ever." },
            ].map((s, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-[#e8d8c4] p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <p
                  className="text-4xl md:text-5xl lg:text-4xl  font-black text-[#4A3B2E] leading-none mb-1"
                  style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                >
                  {s.num}
                </p>
                <p className="text-sm md:text-base font-bold text-[#4A3B2E]">{s.label}</p>
                <p className="text-xs md:text-sm text-[#4A3B2E]/50 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Separator className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" />

      {/* ── MENGAPA FORDZA ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 lg:py-28">
        <div className="text-center mb-14">
          <p className="text-xs font-black uppercase tracking-widest text-[#4A3B2E]/40 mb-3">
            Keunggulan
          </p>
          <h2
            className="text-3xl md:text-5xl xl:text-6xl font-black text-[#4A3B2E] italic uppercase"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Mengapa <span className="text-amber-600">Fordza?</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5 lg:gap-6 xl:gap-4">
          {whyFordzaItems.map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-[#e8d8c4] p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col gap-4"
            >
              <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl border ${item.accent}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#4A3B2E] md:text-lg mb-1.5">{item.title}</h3>
                <p className="text-sm md:text-base text-[#4A3B2E]/60 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROSES PEMBUATAN ── */}
      <section className="bg-[#4A3B2E] py-16 md:py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-black uppercase tracking-widest text-amber-400/70 mb-3">
              Behind The Scenes
            </p>
            <h2
              className="text-3xl md:text-5xl xl:text-6xl font-black text-white italic uppercase"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              Proses <span className="text-amber-400">Pembuatan</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6">
            {processSteps.map((step, i) => (
              <div key={i} className="relative flex flex-col gap-4">

                <div className="">
                  <p
                    className="text-5xl md:text-7xl xl:text-8xl font-black text-white/10 leading-none mb-2"
                    style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                  >
                    {step.step}
                  </p>
                  <div className="w-10 h-1 bg-amber-400 rounded-full mb-4" />
                  <h3 className="font-bold text-white md:text-lg mb-2">{step.title}</h3>
                  <p className="text-sm md:text-base text-white/60 leading-relaxed ">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LOKASI & JAM BUKA ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 lg:py-28">
        <div className="text-center mb-14">
          <p className="text-xs font-black uppercase tracking-widest text-[#4A3B2E]/40 mb-3">
            Kunjungi Kami
          </p>
          <h2
            className="text-3xl md:text-5xl xl:text-6xl font-black text-[#4A3B2E] italic uppercase"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Lokasi & <span className="text-amber-600">Jam Buka</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 items-start">
          {/* Info Cards */}
          <div className="flex flex-col gap-5">
            {/* Address */}
            <div className="bg-white rounded-2xl border border-[#e8d8c4] p-6 shadow-sm flex gap-4">
              <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[#4A3B2E]/5 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-[#4A3B2E]" />
              </div>
              <div>
                <p className="font-bold text-[#4A3B2E] mb-1">Showroom & Workshop</p>
                <p className="text-sm text-[#4A3B2E]/60 leading-relaxed">
                  Jl. Raya Cibaduyut No. 123, Kec. Bojongloa Kidul,<br />
                  Bandung, Jawa Barat 40239
                </p>
              </div>
            </div>

            {/* Hours */}
            <div className="bg-white rounded-2xl border border-[#e8d8c4] p-6 shadow-sm flex gap-4">
              <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-700" />
              </div>
              <div className="w-full">
                <p className="font-bold text-[#4A3B2E] mb-3">Jam Operasional</p>
                <div className="flex flex-col gap-2 text-sm">
                  {[
                    { day: "Senin – Jumat", hours: "09.00 – 18.00 WIB", open: true },
                    { day: "Sabtu", hours: "09.00 – 16.00 WIB", open: true },
                    { day: "Minggu & Libur Nasional", hours: "Tutup", open: false },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-[#4A3B2E]/70">{row.day}</span>
                      <span className={`font-semibold ${row.open ? "text-[#4A3B2E]" : "text-rose-500"}`}>
                        {row.hours}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-white rounded-2xl border border-[#e8d8c4] p-6 shadow-sm flex gap-4">
              <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">
                <Phone className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <p className="font-bold text-[#4A3B2E] mb-2">Hubungi Kami</p>
                <div className="flex flex-col gap-1.5 text-sm">
                  <a
                    href="https://wa.me/6281234567890"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-green-700 font-semibold hover:underline"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    +62 812-3456-7890 (WhatsApp)
                  </a>
                  <a
                    href="https://instagram.com/fordza.id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-rose-600 font-semibold hover:underline"
                  >
                    <Instagram className="w-3.5 h-3.5" />
                    @fordza.id
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Google Maps Embed */}
          <div className="rounded-2xl overflow-hidden border border-[#e8d8c4] shadow-sm h-[340px] md:h-full md:min-h-[380px] lg:min-h-[440px]">
            <iframe
              title="Lokasi Fordza Bandung"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.8826!2d107.5836!3d-6.9483!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e68e9adf177bf8d%3A0x437398bb6a4a3b4e!2sCibaduyut%2C%20Bandung!5e0!3m2!1sid!2sid!4v1680000000000!5m2!1sid!2sid"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-[#fef4e8]/60 py-16 md:py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-black uppercase tracking-widest text-[#4A3B2E]/40 mb-3">
              Pertanyaan Umum
            </p>
            <h2
              className="text-3xl md:text-5xl xl:text-6xl font-black text-[#4A3B2E] italic uppercase"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              FAQ
            </h2>
          </div>

          <Accordion type="single" collapsible className="flex flex-col gap-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
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
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── CTA BOTTOM ── */}
      <section className="bg-[#4A3B2E] py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Award className="w-10 h-10 text-amber-400 mx-auto mb-4" />
          <h2
            className="text-2xl md:text-4xl xl:text-5xl font-black text-white italic uppercase mb-4"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Siap Memulai Perjalanan Anda?
          </h2>
          <p className="text-white/60 md:text-lg mb-8 max-w-xl mx-auto">
            Jelajahi koleksi terbaru kami atau kunjungi showroom kami langsung di Bandung.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-[#4A3B2E] font-bold px-8 py-3 rounded-xl transition-colors"
            >
              Lihat Koleksi <ChevronRight className="w-4 h-4" />
            </Link>
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-3 rounded-xl border border-white/20 transition-colors"
            >
              Hubungi Kami
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
