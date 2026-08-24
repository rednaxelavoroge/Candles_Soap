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
  // trailingSlash в выгрузке обязателен. Без него страницы ложатся файлами
  // catalog.html, а Apache на обычном хостинге по адресу /catalog такой файл
  // не найдёт — откроется только главная. С ним каждая страница становится
  // папкой с index.html, и сервер отдаёт её сам, без всяких правил.
  ...(isExport ? { output: "export" as const, trailingSlash: true } : {}),
  // Поддомен admin.annamanasaryan.art заведён ради одной страницы — панели.
  // Его корень уводит прямо в неё, чтобы не помнить хвост /admin.
  // В статической выгрузке правил перенаправления нет и быть не может:
  // там сервера нет, поэтому блок добавляется только для Vercel.
  ...(isExport
    ? {}
    : {
        async redirects() {
          return [
            {
              source: "/",
              has: [{ type: "host" as const, value: "admin.annamanasaryan.art" }],
              destination: "/admin",
              permanent: false,
            },
          ];
        },
      }),
  images: {
    unoptimized: isExport,
    formats: ["image/webp"],
    deviceSizes: [375, 640, 828, 1080, 1200, 1600],
    imageSizes: [96, 160, 256, 384],
  },
};

export default nextConfig;
