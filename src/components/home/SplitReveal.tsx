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
  wordLeft: string;
  wordRight: string;
  children: ReactNode;
};

/**
 * Две половины экрана расходятся в стороны по мере прокрутки секции, между
 * ними раскрывается содержимое. Источник анимации — прогресс скролла, а не
 * mousemove, поэтому эффект одинаково живой на десктопе и на телефоне.
 * Курсорный параллакс добавляется поверх только на устройствах с точным
 * указателем и не превышает 8px.
 *
 * Половины расходятся именно влево и вправо: «мне не нравится, что оно наверх
 * и вниз поднимается, я бы хотела, чтобы по диагонали ушло — „ручная“ в одну
 * сторону, „работа“ в другую». Диагональ задаётся тем, что левое слово стоит
 * выше середины, а правое ниже: слова уходят по разным углам и не режутся
 * краем половины.
 *
 * Анимируются исключительно transform и opacity — ни одного свойства,
 * вызывающего перерасчёт layout.
 */
export function SplitReveal({ wordLeft, wordRight, children }: SplitRevealProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const leftX = useTransform(scrollYProgress, [0, 0.72], ["0%", "-101%"]);
  const rightX = useTransform(scrollYProgress, [0, 0.72], ["0%", "101%"]);
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
          {wordLeft} {wordRight}
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

        {/* Левая половина: слово прижато к правому краю и поднято над серединой. */}
        <motion.div
          aria-hidden="true"
          style={{ x: leftX }}
          className="pointer-events-none absolute inset-y-0 left-0 flex w-1/2 items-center justify-end border-r border-sand bg-bg will-change-transform"
        >
          <span className="-translate-y-[0.42em] pr-[0.06em] font-display text-[15vw] leading-[0.8] md:text-[11vw]">
            {wordLeft}
          </span>
        </motion.div>

        {/* Правая половина: слово у левого края и опущено — вместе выходит диагональ. */}
        <motion.div
          aria-hidden="true"
          style={{ x: rightX }}
          className="pointer-events-none absolute inset-y-0 right-0 flex w-1/2 items-center justify-start bg-bg will-change-transform"
        >
          <span className="translate-y-[0.42em] pl-[0.06em] font-display text-[15vw] leading-[0.8] md:text-[11vw]">
            {wordRight}
          </span>
        </motion.div>
      </div>
    </section>
  );
}
