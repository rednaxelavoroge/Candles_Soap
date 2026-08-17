"use client";

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
  /** Необязательный текст раздела от заказчицы. */
  intro: string | null;
};

/**
 * Одна макросекция каталога: половина экрана с текстом, половина с кадром.
 *
 * Стороны чередуются через одну — так это устроено в черновике, который
 * заказчица показала: «слева написано, что это свечи, справа фотографии,
 * внизу следующее — слева мыло, справа фотографии».
 *
 * Половины съезжаются к середине, когда секция входит в экран, и разъезжаются
 * обратно, когда уходит. Прогресс берётся от прокрутки, поэтому движение идёт
 * в обе стороны и повторяется каждый раз: «у него плохо, что один раз оно
 * надвигается и всё, а я бы хотела вверх поднимаешь — оно опять идёт,
 * вверх, вниз, вверх, вниз».
 */
function CatalogSection({ category, index, total, count, intro }: SectionProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  // Секция проходит экран целиком: 0 — только показалась снизу,
  // 0.5 — стоит по центру, 1 — ушла за верх.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Текст приходит со своей стороны, кадр — с противоположной.
  const textFrom = index % 2 === 0 ? -1 : 1;

  const textX = useTransform(
    scrollYProgress,
    [0, 0.34, 0.66, 1],
    [`${textFrom * 62}%`, "0%", "0%", `${textFrom * 62}%`],
  );
  const mediaX = useTransform(
    scrollYProgress,
    [0, 0.34, 0.66, 1],
    [`${-textFrom * 62}%`, "0%", "0%", `${-textFrom * 62}%`],
  );
  const fade = useTransform(scrollYProgress, [0, 0.26, 0.74, 1], [0, 1, 1, 0]);

  const number = `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;

  const text = (
    <motion.div
      style={reduced ? undefined : { x: textX, opacity: fade }}
      className="flex w-full flex-col justify-center px-5 py-10 will-change-transform md:px-12 lg:px-20"
    >
      <p className="eyebrow">{number}</p>
      <h2 className="mt-4 font-display text-3xl leading-tight md:text-5xl lg:text-6xl">
        {category.title}
      </h2>
      {intro ? (
        <p className="mt-5 max-w-md text-sm leading-relaxed text-muted md:text-base">{intro}</p>
      ) : (
        <p className="mt-5 text-sm text-muted md:text-base">
          {count} {plural(count)}
        </p>
      )}
      <Link
        href={`/catalog/${category.slug}`}
        className="link-underline mt-8 inline-block self-start text-sm md:text-base"
      >
        Смотреть изделия →
      </Link>
    </motion.div>
  );

  const media = (
    <motion.div
      style={reduced ? undefined : { x: mediaX, opacity: fade }}
      className="relative w-full overflow-hidden rounded-md will-change-transform"
    >
      <Link
        href={`/catalog/${category.slug}`}
        aria-label={`Смотреть раздел «${category.title}»`}
        className="group relative block h-[44vh] w-full md:h-[72vh]"
      >
        <div className="tile-zoom absolute inset-0">
          <Media
            image={category.cover}
            sizes="(min-width: 768px) 50vw, 100vw"
            priority={index === 0}
          />
        </div>
      </Link>
    </motion.div>
  );

  return (
    <section
      ref={ref}
      aria-labelledby={`section-${category.slug}`}
      className="flex min-h-svh items-center overflow-hidden py-10 md:py-16"
    >
      <div className="grid w-full items-center gap-6 px-5 md:grid-cols-2 md:gap-10 md:px-8">
        {/* Кадр всегда идёт первым в разметке на узком экране: там половин нет,
            и фотография должна стоять над названием, а не под ним. */}
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
    <div>
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
