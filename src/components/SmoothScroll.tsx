"use client";

import Lenis from "lenis";
import { useEffect } from "react";

/**
 * Плавный скролл. Framer Motion читает обычный scrollY, а Lenis именно его и
 * двигает, поэтому useScroll в секциях продолжает работать без интеграций.
 * При prefers-reduced-motion не инициализируем вовсе — остаётся нативный скролл.
 */
export function SmoothScroll() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      // На тач-устройствах оставляем нативную инерцию: она плавнее и дешевле.
      syncTouch: false,
    });

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return null;
}
