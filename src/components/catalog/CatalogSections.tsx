"use client";

import { Blots } from "@/components/ui/Blots";
import { Media } from "@/components/ui/Media";
import type { Category } from "@/lib/schemas";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";

type SectionProps = {
  category: Category;
  index: number;
  total: number;
  count: number;
  intro: string | null;
};

const CATEGORY_SUBTITLES: Record<string, string> = {
  candles: "Свечи из соевого воска и авторские формы",
  soap: "Мыло ручной работы с натуральными маслами",
  gypsum: "Скульптурные подсвечники, шкатулки и блюда",
  sachet: "Деликатные восковые и льняные аромасаше",
  holders: "Фактурные подсвечники из гипса",
  boxes: "Рельефные шкатулки и коробочки",
  plates: "Декоративные подносы и тарелки",
  decor: "Предметы декора для уютного дома",
};

function CatalogSection({ category, index, total, count, intro }: SectionProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const textFrom = index % 2 === 0 ? -1 : 1;

  const textX = useTransform(
    scrollYProgress,
    [0, 0.35, 0.65, 1],
    [`${textFrom * 50}%`, "0%", "0%", `${textFrom * 50}%`],
  );
  const mediaX = useTransform(
    scrollYProgress,
    [0, 0.35, 0.65, 1],
    [`${-textFrom * 50}%`, "0%", "0%", `${-textFrom * 50}%`],
  );
  const scale = useTransform(scrollYProgress, [0, 0.35, 0.65, 1], [0.94, 1, 1, 0.94]);
  const fade = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0, 1, 1, 0]);

  const number = `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
  const subtitle = CATEGORY_SUBTITLES[category.slug] ?? "Авторская ручная работа";

  const text = (
    <motion.div
      style={reduced ? undefined : { x: textX, opacity: fade }}
      className="flex w-full flex-col justify-center px-5 py-8 md:px-12 lg:px-16 will-change-transform"
    >
      <span className="text-xs font-medium tracking-[0.22em] text-muted uppercase">
        {number}
      </span>
      <h2 className="mt-3 font-display text-3xl leading-tight text-ink md:text-5xl lg:text-6xl">
        {category.title}
      </h2>
      <p className="mt-3 text-sm font-medium text-accent md:text-base">
        {subtitle}
      </p>
      {intro ? (
        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted md:text-base">{intro}</p>
      ) : (
        <p className="mt-4 text-sm text-muted md:text-base">
          Коллекция включает {count} {plural(count)}, выполненных вручную из качественных материалов.
        </p>
      )}
      <div className="mt-8 flex items-center gap-6">
        <Link
          href={`/catalog/${category.slug}`}
          className="group inline-flex items-center gap-3 border border-ink bg-transparent px-7 py-3.5 text-sm tracking-wide text-ink transition-all duration-300 hover:bg-ink hover:text-white"
        >
          <span>Смотреть изделия</span>
          <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </Link>
      </div>
    </motion.div>
  );

  const media = (
    <motion.div
      style={reduced ? undefined : { x: mediaX, scale, opacity: fade }}
      className="relative flex items-center justify-center p-4 md:p-8 will-change-transform"
    >
      {/* Акварельная клякса сзади */}
      <Blots variant={index} className="scale-110 opacity-70" />

      {/* Белая рамка со скруглениями */}
      <div className="relative z-10 w-full max-w-lg rounded-xl bg-surface p-3 shadow-sm md:p-5">
        <Link
          href={`/catalog/${category.slug}`}
          aria-label={`Смотреть раздел «${category.title}»`}
          className="group relative block aspect-[4/5] w-full overflow-hidden rounded-lg bg-sand md:aspect-[3/4]"
        >
          <div className="tile-zoom absolute inset-0">
            <Media
              image={category.cover}
              sizes="(min-width: 1024px) 45vw, (min-width: 768px) 50vw, 100vw"
              priority={index === 0}
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-ink/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <span className="rounded-full bg-white/90 px-5 py-2 text-xs font-medium tracking-widest text-ink uppercase backdrop-blur-sm">
              Открыть раздел
            </span>
          </div>
        </Link>
      </div>
    </motion.div>
  );

  return (
    <section
      ref={ref}
      aria-labelledby={`section-${category.slug}`}
      className="relative flex min-h-[85vh] items-center overflow-hidden py-12 md:min-h-svh md:py-20"
    >
      <div className="mx-auto grid w-full max-w-[1500px] items-center gap-8 px-5 md:grid-cols-2 md:gap-12 md:px-8">
        <div className="contents md:hidden">{media}</div>

        {index % 2 === 0 ? (
          <>
            <span id={`section-${category.slug}`} className="sr-only">
              {category.title}
            </span>
            {text}
            <div className="hidden md:block">{media}</div>
          </>
        ) : (
          <>
            <div className="hidden md:block">{media}</div>
            {text}
          </>
        )}
      </div>
    </section>
  );
}

function plural(count: number) {
  const tail = count % 10;
  const hundred = count % 100;
  if (hundred >= 11 && hundred <= 14) return "изделий";
  if (tail === 1) return "изделие";
  if (tail >= 2 && tail <= 4) return "изделия";
  return "изделий";
}

export function CatalogSections({
  categories,
}: {
  categories: { category: Category; count: number; intro: string | null }[];
}) {
  return (
    <div className="divide-y divide-sand/40">
      {categories.map((entry, index) => (
        <CatalogSection
          key={entry.category.slug}
          category={entry.category}
          index={index}
          total={categories.length}
          count={entry.count}
          intro={entry.intro}
        />
      ))}
    </div>
  );
}
