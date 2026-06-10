"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { useLogin } from "@/features/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const loginSchema = z.object({
  username: z.string().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

type LoginForm = z.infer<typeof loginSchema>;

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
} as const;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginForm) => {
    login.mutate(data);
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex items-stretch antialiased selection:bg-[#3C3025] selection:text-[#FEF4E8]">
      
      {/* Visual Showcase Panel (Tablet & Desktop: md and above) */}
      <div className="hidden md:flex md:w-[40%] lg:w-1/2 relative overflow-hidden bg-[#2A1F16] flex-col justify-between p-8 lg:p-12 text-[#FEF4E8]">
        {/* Background Image with Dark Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-40 transition-transform duration-[10000ms] ease-out hover:scale-105"
          style={{ backgroundImage: `url('/images/login_showcase.png')` }}
        />
        {/* Decorative Grid/Noise Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#1E140C]/90 via-transparent to-[#3C3025]/50 z-10" />
        
        {/* Brand Header */}
        <div className="relative z-20 flex items-center gap-2 md:gap-3">
          <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-xl bg-[#FEF4E8] text-[#3C3025] font-black text-lg md:text-xl shadow-md">
            F
          </div>
          <span className="font-black uppercase tracking-widest text-[10px] md:text-xs">Fordza Craft</span>
        </div>

        {/* Center Quote (Playfair Serif Font) */}
        <div className="relative z-20 max-w-lg space-y-4 md:space-y-6 my-auto">
          <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black leading-tight font-serif italic text-amber-50">
            &ldquo;Tuan Muda Punya Gaya&rdquo;
          </h2>
          <div className="h-1 w-12 bg-amber-500/80 rounded-full" />
          <p className="text-xs md:text-sm font-medium text-amber-100/70 leading-relaxed max-w-sm">
            Panel kontrol terintegrasi untuk mengelola inventaris produk, transaksi kasir, dan operasional harian Fordza.
          </p>
        </div>

        {/* Footer info */}
        <div className="relative z-20 text-[10px] md:text-xs font-semibold text-amber-100/40 uppercase tracking-widest flex items-center gap-2">
          <span>Fordza Admin System v3.0</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>

      {/* Form Panel (Responsive: full-width on mobile, 60% on tablet, 50% on desktop) */}
      <div className="w-full md:w-[60%] lg:w-1/2 flex items-center justify-center p-6 sm:p-10 md:p-12 lg:p-20 bg-[#FDFCFB] relative overflow-hidden">
        {/* Subtle background graphics for mobile to look premium */}
        <div 
          className="md:hidden absolute top-0 left-0 w-48 h-48 bg-amber-100/20 rounded-br-full -z-10"
          style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
        />
        <div className="md:hidden absolute bottom-0 right-0 w-64 h-64 bg-amber-50/30 rounded-tl-full -z-10" />

        <div className="w-full max-w-md space-y-8">
          
          {/* Header */}
          <div className="text-center md:text-left space-y-3">
            <div className="md:hidden inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#3C3025] text-[#FEF4E8] font-black text-xl mb-2">
              F
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-[#3C3025] tracking-tight font-sans">Fordza Portal</h1>
            <p className="text-sm text-stone-500 font-medium">
              Masukkan kredensial Admin atau Kasir Anda untuk masuk ke sistem.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200/80 shadow-sm relative overflow-hidden">
            <form onSubmit={handleSubmit(onSubmit)}>
              <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
                {login.isError && (
                  <motion.div variants={itemVariants} className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 shadow-sm">
                    <p className="text-sm font-semibold text-red-600">
                      {(login.error as any)?.response?.data?.message || "Username atau password salah"}
                    </p>
                  </motion.div>
                )}

                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-stone-400">Username</Label>
                  <Input
                    id="username"
                    placeholder="Masukkan username"
                    autoComplete="username"
                    {...register("username")}
                    className={cn(
                      "h-12 border-stone-200 focus:border-[#3C3025] focus:ring-1 focus:ring-[#3C3025] rounded-xl font-medium placeholder:text-stone-300",
                      errors.username ? "border-red-400 focus:border-red-400 focus:ring-red-400" : ""
                    )}
                  />
                  {errors.username && (
                    <p className="text-xs font-bold text-red-500 mt-1">{errors.username.message}</p>
                  )}
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-stone-400">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Masukkan password"
                      autoComplete="current-password"
                      {...register("password")}
                      className={cn(
                        "h-12 border-stone-200 focus:border-[#3C3025] focus:ring-1 focus:ring-[#3C3025] rounded-xl pr-10 font-medium placeholder:text-stone-300",
                        errors.password ? "border-red-400 focus:border-red-400 focus:ring-red-400" : ""
                      )}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs font-bold text-red-500 mt-1">{errors.password.message}</p>
                  )}
                </motion.div>

                <motion.div variants={itemVariants} className="pt-2">
                  <Button
                    type="submit"
                    className="w-full h-12 bg-[#3C3025] text-white hover:bg-[#5a4a38] transition-colors rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 duration-150"
                    disabled={login.isPending}
                  >
                    {login.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Memverifikasi...
                      </>
                    ) : (
                      "Masuk ke Panel"
                    )}
                  </Button>
                </motion.div>
              </motion.div>
            </form>
          </div>

          <p className="text-center text-xs text-stone-400 font-semibold tracking-wider uppercase">
            Fordza Admin &copy; 2026
          </p>
        </div>
      </div>
    </div>
  );
}
