"use client";

import { Blots } from "@/components/ui/Blots";
import { Media } from "@/components/ui/Media";
import type { Category } from "@/lib/schemas";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";

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
  const reduced = useReducedMotion();
  const number = `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
  const subtitle = CATEGORY_SUBTITLES[category.slug] ?? "Авторская ручная работа";
  const textFrom = index % 2 === 0 ? -1 : 1;

  const text = (
    <motion.div
      initial={reduced ? undefined : { opacity: 0, x: textFrom * 45 }}
      whileInView={reduced ? undefined : { opacity: 1, x: 0 }}
      viewport={{ once: false, amount: 0.25 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="flex w-full flex-col justify-center px-4 py-4 md:px-8 lg:px-12 will-change-transform"
    >
      <span className="text-xs font-medium tracking-[0.22em] text-accent uppercase">
        {number}
      </span>
      <h2 className="mt-3 font-display text-2xl leading-tight text-ink sm:text-3xl md:text-4xl lg:text-5xl">
        {category.title}
      </h2>
      <p className="mt-2 text-sm font-medium text-clay md:text-base">
        {subtitle}
      </p>
      {intro ? (
        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted md:text-base">{intro}</p>
      ) : (
        <p className="mt-4 text-sm text-muted md:text-base">
          Коллекция включает {count} {plural(count)}, выполненных вручную из качественных материалов.
        </p>
      )}
      <div className="mt-7 flex items-center gap-5">
        <Link
          href={`/catalog/${category.slug}`}
          className="group inline-flex items-center gap-2.5 rounded-full border border-ink bg-transparent px-7 py-3 text-sm tracking-wide text-ink transition-all duration-300 hover:bg-ink hover:text-white"
        >
          <span>Смотреть изделия</span>
          <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </Link>
      </div>
    </motion.div>
  );

  const media = (
    <motion.div
      initial={reduced ? undefined : { opacity: 0, x: -textFrom * 45, scale: 0.96 }}
      whileInView={reduced ? undefined : { opacity: 1, x: 0, scale: 1 }}
      viewport={{ once: false, amount: 0.25 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex items-center justify-center p-4 md:p-6 will-change-transform"
    >
      {/* Акварельная клякса сзади */}
      <Blots variant={index} className="scale-110 opacity-70" />

      {/* Белая рамка со скруглениями */}
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-surface p-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-transform duration-500 hover:scale-[1.02] md:p-5">
        <Link
          href={`/catalog/${category.slug}`}
          aria-label={`Смотреть раздел «${category.title}»`}
          className="group relative block aspect-[4/5] w-full overflow-hidden rounded-xl bg-sand md:aspect-[3/4]"
        >
          <div className="tile-zoom absolute inset-0">
            <Media
              image={category.cover}
              sizes="(min-width: 1024px) 40vw, (min-width: 768px) 50vw, 100vw"
              priority={index === 0}
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-ink/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 backdrop-blur-[2px]">
            <span className="rounded-full bg-white/90 px-6 py-2.5 text-xs font-semibold tracking-widest text-ink uppercase shadow-md backdrop-blur-sm">
              Открыть раздел →
            </span>
          </div>
        </Link>
      </div>
    </motion.div>
  );

  return (
    <section
      aria-labelledby={`section-${category.slug}`}
      className="relative overflow-hidden py-10 md:py-16"
    >
      <div className="mx-auto grid w-full max-w-[1400px] items-center gap-8 px-5 md:grid-cols-2 md:gap-12 md:px-8">
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
