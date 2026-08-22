import type { NextConfig } from "next";

/**
 * STATIC_EXPORT=1 собирает сайт папкой готовых файлов (out/), которую можно
 * положить на любой хостинг — в том числе российский. Нужно из-за того, что
 * vercel.app в России не открывается.
 *
 * Оптимизатор картинок при этом отключается: он работает на сервере, а в
 * статической выгрузке сервера нет. Каталог и так поставляется обработанным —
 * WebP, 1600px по длинной стороне, — поэтому терять нечего.
 */
const isExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(isExport ? { output: "export" as const } : {}),
  images: {
    unoptimized: isExport,
    formats: ["image/webp"],
    deviceSizes: [375, 640, 828, 1080, 1200, 1600],
    imageSizes: [96, 160, 256, 384],
  },
};

export default nextConfig;
