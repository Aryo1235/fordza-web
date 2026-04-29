import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format angka ke Rupiah (IDR) */
export function formatRupiah(price: string | number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(price));
}

/** Format angka ke string dengan pemisah ribuan (titik) */
export function formatNumber(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num) || num === 0) return "0";
  return num.toLocaleString("id-ID");
}

/** Hapus pemisah ribuan dan kembalikan tipe number */
export function parseNumber(value: string): number {
  const cleanValue = value.replace(/\./g, "");
  const num = parseInt(cleanValue, 10);
  return isNaN(num) ? 0 : num;
}
