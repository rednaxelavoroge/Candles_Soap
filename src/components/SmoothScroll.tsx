"use client";

import { useEffect } from "react";

/**
 * Премиальный плавный инерционный скролл в стиле Sansara и Novo.
 * Framer Motion считывает нативный scrollY, а Lenis плавно интерполирует движение,
 * создавая ощущение тяжести, мягкости и люксовой динамики.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // На мобильных устройствах оставляем нативный быстрый скролл без перехвата событий
    if (!window.matchMedia("(pointer: fine)").matches) return;
    // Админка — рабочая панель, а не витрина. Lenis перехватывает колесо мыши на всей
    // странице, и тогда не прокручиваются ни модальное окно, ни список тегов, ни textarea.
    if (window.location.pathname.startsWith("/admin")) return;

    let lenis: { raf: (time: number) => void; destroy: () => void } | null = null;
    let frame = 0;
    let cancelled = false;

    const start = async () => {
      try {
        const { default: Lenis } = await import("lenis");
        if (cancelled) return;

        lenis = new Lenis({
          duration: 1.2,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
          wheelMultiplier: 0.95,
          syncTouch: false,
        });

        const raf = (time: number) => {
          lenis?.raf(time);
          frame = requestAnimationFrame(raf);
        };
        frame = requestAnimationFrame(raf);
      } catch (e) {
        console.warn("Lenis smooth scroll disabled", e);
      }
    };

    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(start, { timeout: 800 })
      : window.setTimeout(start, 200);

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
