"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";

/** Предел курсорного параллакса в пикселях — надстройка, а не основа эффекта. */
const PARALLAX_MAX = 8;

type SplitRevealProps = {
  /** Декоративные слова на расходящихся половинах. */
  wordTop: string;
  wordBottom: string;
  children: ReactNode;
};

/**
 * Две половины экрана расходятся по вертикали по мере прокрутки секции, между
 * ними раскрывается содержимое. Источник анимации — прогресс скролла, а не
 * mousemove, поэтому эффект одинаково живой на десктопе и на телефоне.
 * Курсорный параллакс добавляется поверх только на устройствах с точным
 * указателем и не превышает 8px.
 *
 * Анимируются исключительно transform и opacity — ни одного свойства,
 * вызывающего перерасчёт layout.
 */
export function SplitReveal({ wordTop, wordBottom, children }: SplitRevealProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const topY = useTransform(scrollYProgress, [0, 0.72], ["0%", "-101%"]);
  const bottomY = useTransform(scrollYProgress, [0, 0.72], ["0%", "101%"]);
  const revealOpacity = useTransform(scrollYProgress, [0.16, 0.46], [0, 1]);
  const revealScale = useTransform(scrollYProgress, [0.16, 0.82], [0.96, 1]);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const parallaxX = useSpring(pointerX, { stiffness: 140, damping: 22, mass: 0.35 });
  const parallaxY = useSpring(pointerY, { stiffness: 140, damping: 22, mass: 0.35 });

  useEffect(() => {
    if (reduced) return;
    const stage = stageRef.current;
    if (!stage) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const onPointerMove = (event: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      pointerX.set(((event.clientX - rect.left) / rect.width - 0.5) * 2 * PARALLAX_MAX);
      pointerY.set(((event.clientY - rect.top) / rect.height - 0.5) * 2 * PARALLAX_MAX);
    };
    const onPointerLeave = () => {
      pointerX.set(0);
      pointerY.set(0);
    };

    stage.addEventListener("pointermove", onPointerMove);
    stage.addEventListener("pointerleave", onPointerLeave);
    return () => {
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [pointerX, pointerY, reduced]);

  // При запросе на уменьшение движения секция становится обычной: половины уже
  // разведены, содержимое видно сразу, sticky-растяжка не нужна.
  if (reduced) {
    return (
      <section className="bg-surface px-5 py-16 md:px-8 md:py-24">
        <p aria-hidden="true" className="font-display text-4xl leading-none md:text-6xl">
          {wordTop} {wordBottom}
        </p>
        <div className="mt-10">{children}</div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="relative h-[300vh] bg-surface">
      <div ref={stageRef} className="sticky top-0 flex h-svh items-center overflow-hidden">
        <motion.div
          style={{ opacity: revealOpacity, scale: revealScale, x: parallaxX, y: parallaxY }}
          className="w-full will-change-transform"
        >
          {children}
        </motion.div>

        <motion.div
          aria-hidden="true"
          style={{ y: topY }}
          className="pointer-events-none absolute inset-x-0 top-0 flex h-1/2 items-end justify-center border-b border-sand bg-bg will-change-transform"
        >
          <span className="translate-y-[0.12em] font-display text-[18vw] leading-[0.8] md:text-[13vw]">
            {wordTop}
          </span>
        </motion.div>

        <motion.div
          aria-hidden="true"
          style={{ y: bottomY }}
          className="pointer-events-none absolute inset-x-0 bottom-0 flex h-1/2 items-start justify-center bg-bg will-change-transform"
        >
          <span className="-translate-y-[0.18em] font-display text-[18vw] leading-[0.8] md:text-[13vw]">
            {wordBottom}
          </span>
        </motion.div>
      </div>
    </section>
  );
}
