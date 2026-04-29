import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },

  images: {
    remotePatterns: [
      /**
       * Supabase Storage — digunakan untuk semua gambar produk, banner, dll.
       * Sesuai NEXT_PUBLIC_STORAGE_URL di .env
       */
      {
        protocol: "https",
        hostname: "bntdmjvmqhtpmsdaymil.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      /**
       * Supabase S3-compatible endpoint (fallback jika URL dari S3_ENDPOINT)
       */
      {
        protocol: "https",
        hostname: "bntdmjvmqhtpmsdaymil.storage.supabase.co",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
