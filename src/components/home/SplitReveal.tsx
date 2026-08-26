"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

const PARALLAX_MAX = 8;

type SplitRevealProps = {
  wordLeft: string;
  wordRight: string;
  children: ReactNode;
};

/**
 * Молниеносное раскрытие шторки «Ручная работа» по диагонали при малейшем скролле.
 */
export function SplitReveal({ wordLeft, wordRight, children }: SplitRevealProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Молниеносный сдвиг шторки в первые же мгновения скролла
  const leftX = useTransform(scrollYProgress, [0.01, 0.35], ["0%", "-102%"]);
  const rightX = useTransform(scrollYProgress, [0.01, 0.35], ["0%", "102%"]);
  const revealOpacity = useTransform(scrollYProgress, [0.05, 0.25], [0, 1]);
  const revealScale = useTransform(scrollYProgress, [0.05, 0.35], [0.96, 1]);

  /*
    Страховка на случай, когда слежение за прокруткой молчит. Содержимое здесь
    проявляется по мере прохода секции: пока прокрутки нет — прозрачность 0.
    Если страница уже прокручена, а счётчик прохода так и остался на нуле,
    значит сигнал не доходит, и блок остался бы невидимым. Тогда показываем
    его как есть, без движения: лучше без анимации, чем пустой экран.
  */
  const [scrollBroken, setScrollBroken] = useState(false);

  useEffect(() => {
    if (reduced) return;
    let checked = false;
    const onScroll = () => {
      if (checked || window.scrollY < 40) return;
      checked = true;
      window.setTimeout(() => {
        if (scrollYProgress.get() === 0) setScrollBroken(true);
      }, 900);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [reduced, scrollYProgress]);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const parallaxX = useSpring(pointerX, { stiffness: 140, damping: 20, mass: 0.3 });
  const parallaxY = useSpring(pointerY, { stiffness: 140, damping: 20, mass: 0.3 });

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

  if (reduced) {
    return (
      <section className="bg-surface px-5 py-16 md:px-8 md:py-24">
        <p aria-hidden="true" className="font-display text-4xl leading-none text-ink md:text-6xl">
          {wordLeft} {wordRight}
        </p>
        <div className="mt-10">{children}</div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="relative h-[130vh] bg-surface">
      <div ref={stageRef} className="sticky top-0 flex h-svh items-center overflow-hidden">
        <motion.div
          style={
            scrollBroken
              ? { opacity: 1, scale: 1 }
              : { opacity: revealOpacity, scale: revealScale, x: parallaxX, y: parallaxY }
          }
          className="w-full will-change-transform"
        >
          {children}
        </motion.div>

        {/* Левая половина шторки */}
        <motion.div
          aria-hidden="true"
          style={scrollBroken ? { x: "-102%" } : { x: leftX }}
          className="pointer-events-none absolute inset-y-0 left-0 flex w-1/2 items-center justify-end border-r border-sand bg-bg will-change-transform shadow-[4px_0_24px_rgba(62,43,32,0.06)]"
        >
          <span className="-translate-y-[0.42em] pr-[0.06em] font-display text-[15vw] leading-[0.8] text-ink/90 select-none md:text-[11vw]">
            {wordLeft}
          </span>
        </motion.div>

        {/* Правая половина шторки */}
        <motion.div
          aria-hidden="true"
          style={scrollBroken ? { x: "102%" } : { x: rightX }}
          className="pointer-events-none absolute inset-y-0 right-0 flex w-1/2 items-center justify-start bg-bg will-change-transform shadow-[-4px_0_24px_rgba(62,43,32,0.06)]"
        >
          <span className="translate-y-[0.42em] pl-[0.06em] font-display text-[15vw] leading-[0.8] text-ink/90 select-none md:text-[11vw]">
            {wordRight}
          </span>
        </motion.div>
      </div>
    </section>
  );
}
