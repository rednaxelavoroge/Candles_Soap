import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Каталог поставляется уже обработанным (WebP, 1600px по длинной стороне),
    // поэтому оптимизатору достаточно узкого набора ширин.
    formats: ["image/webp"],
    deviceSizes: [375, 640, 828, 1080, 1200, 1600],
    imageSizes: [96, 160, 256, 384],
  },
};

export default nextConfig;
