import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {},
};

export default nextConfig;
