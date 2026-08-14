"use client";

import { useEffect } from "react";

/**
 * Плавный скролл. Framer Motion читает обычный scrollY, а Lenis именно его и
 * двигает, поэтому useScroll в секциях продолжает работать без интеграций.
 *
 * Библиотека подгружается динамически и уже после простоя: без неё страница
 * полностью рабочая, а в первую загрузку она добавляла блокирующий разбор
 * скрипта. При prefers-reduced-motion не грузим вовсе — остаётся нативный скролл.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let lenis: { raf: (time: number) => void; destroy: () => void } | null = null;
    let frame = 0;
    let cancelled = false;

    const start = async () => {
      const { default: Lenis } = await import("lenis");
      if (cancelled) return;

      lenis = new Lenis({
        duration: 1.05,
        easing: (t) => 1 - Math.pow(1 - t, 3),
        smoothWheel: true,
        // На тач-устройствах оставляем нативную инерцию: она плавнее и дешевле.
        syncTouch: false,
      });

      const raf = (time: number) => {
        lenis?.raf(time);
        frame = requestAnimationFrame(raf);
      };
      frame = requestAnimationFrame(raf);
    };

    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(start, { timeout: 1200 })
      : window.setTimeout(start, 300);

    return () => {
      cancelled = true;
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle as number);
      else window.clearTimeout(idle as number);
      cancelAnimationFrame(frame);
      lenis?.destroy();
    };
  }, []);

  return null;
}
