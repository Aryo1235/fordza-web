import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb", // Set limit ke 5MB atau sesuai kebutuhanmu
    },
  },
};

export default nextConfig;
