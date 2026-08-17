"use client";

import { Blots } from "@/components/ui/Blots";
import { Media } from "@/components/ui/Media";
import { getCategory, getProductsByCategory } from "@/lib/content";
import type { Category } from "@/lib/schemas";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";

type ShowcaseItem = {
  category: Category;
  number: string;
  subtitle: string;
  description: string;
  imageSrc?: string;
};

const SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    category: {
      slug: "soap",
      title: "Декоративное мыло ручной работы",
      cover: {
        src: "/covers/WhatsApp Image 2026-08-17 at 17.16.26.jpeg",
        width: 1200,
        height: 1200,
        blurDataURL: "data:image/webp;base64,UklGRmoAAABXRUJQVlA4IF4AAAAQAgCdASoQABAAA4BaJQBOgB5yvee2+JmAAP7xgZmx93D1yuh1poQDv8SKgSD2KslLmWHDvQO+ISH2tZ+ysc68InCHH3jETPjYDZtUhCIu7Zj9GWbvQHIiQ/K1wAAA",
        alt: "Декоративное мыло ручной работы",
      },
      order: 1,
    },
    number: "01 / 04",
    subtitle: "Нежная пена и натуральные масла",
    description:
      "Мыло, вылитое вручную небольшими партиями — с добавлением растительных масел и мягким, обволакивающим ароматом. Изящные цветочные корзины и десертные композиции.",
  },
  {
    category: {
      slug: "candles",
      title: "Свечи ручной работы",
      cover: {
        src: "/covers/WhatsApp Image 2026-08-17 at 17.16.27.jpeg",
        width: 1200,
        height: 1200,
        blurDataURL: "data:image/webp;base64,UklGRlIAAABXRUJQVlA4IEYAAAAQAgCdASoQAAwAA4BaJYwCsAEKQonkllsAAP7NxITFdJeC0QlihEzm1AJ5a3YAMlYaxjLnIy9lhQQhnPo62W9tnRvhAAAA",
        alt: "Свечи ручной работы",
      },
      order: 2,
    },
    number: "02 / 04",
    subtitle: "Соевый воск и фитили из дерева",
    description:
      "Свечи из натурального соевого воска с деревянными фитилями, создающими уютное потрескивание. Тёплый живой свет, морские ракушки и чистый характер в каждой форме.",
  },
  {
    category: {
      slug: "sachet",
      title: "Аромасаше и ароматы",
      cover: {
        src: "/covers/WhatsApp Image 2026-08-17 at 17.15.51.jpeg",
        width: 1200,
        height: 1200,
        blurDataURL: "data:image/webp;base64,UklGRpQAAABXRUJQVlA4IIgAAABwAgCdASoQABAAA4BaJQBOgMUt4/0o65x9KGwAAP718aONpSfzx9y6h5v+X4vgyyZm7NW+X/QhsdaClbbZda92xiewNyLY/LXf3gdFz+koGO3FTbOoLOnJ75oSIpVdZOpPH/08NvlcFQe/jNrVkAJNc8u/d8fXY80BICsWlyS2wJps0agBQAAA",
        alt: "Аромасаше",
      },
      order: 3,
    },
    number: "03 / 04",
    subtitle: "Деликатный аромат для дома",
    description:
      "Льняные и восковые саше с сухими травами, цветами и эфирными маслами — деликатный ненавязчивый аромат для дома, спальни и гардероба.",
  },
  {
    category: {
      slug: "gypsum",
      title: "Изделия из гипса и интерьер",
      cover: {
        src: "/covers/WhatsApp Image 2026-08-17 at 17.16.26 (1).jpeg",
        width: 1200,
        height: 1200,
        blurDataURL: "data:image/webp;base64,UklGRmgAAABXRUJQVlA4IFwAAABQAgCdASoQABAAA4BaJQBOkGQCr9ZLHCeQzTAA/vV6uAKfVDiuCWPi+ww3ElRCZE7IjNlUlaxmh5lkrh7yKekh/ux269OZS+x5F2QxcqFMq7XtEiW7FeKUHIYAAA==",
        alt: "Изделия из гипса",
      },
      order: 4,
    },
    number: "04 / 04",
    subtitle: "Бархатистая текстура и скульптурность",
    description:
      "Фактурные подсвечники, рельефные шкатулки, раковины и подносы из архитектурного гипса. Чистая эстетика спокойных форм для вашего интерьера.",
  },
];

function ShowcaseSection({
  item,
  index,
}: {
  item: ShowcaseItem;
  index: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Текст и медиа приходят с противоположных сторон при скролле
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
  const scale = useTransform(scrollYProgress, [0, 0.35, 0.65, 1], [0.92, 1, 1, 0.92]);
  const opacity = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0, 1, 1, 0]);

  const categoryData = getCategory(item.category.slug) ?? item.category;
  const count = getProductsByCategory(item.category.slug).length;

  const textBlock = (
    <motion.div
      style={reduced ? undefined : { x: textX, opacity }}
      className="flex w-full flex-col justify-center px-4 py-8 md:px-10 lg:px-16 will-change-transform"
    >
      <span className="text-xs font-medium tracking-[0.22em] text-muted uppercase">
        {item.number}
      </span>
      <h3 className="mt-3 font-display text-3xl leading-tight text-ink md:text-5xl lg:text-6xl">
        {item.category.title}
      </h3>
      <p className="mt-3 text-sm font-medium tracking-wide text-accent md:text-base">
        {item.subtitle}
      </p>
      <p className="mt-5 max-w-lg text-sm leading-relaxed text-muted md:text-base">
        {item.description}
      </p>
      <div className="mt-8 flex items-center gap-6">
        <Link
          href={`/catalog/${item.category.slug}`}
          className="group inline-flex items-center gap-3 border border-ink bg-transparent px-7 py-3.5 text-sm tracking-wide text-ink transition-all duration-300 hover:bg-ink hover:text-white"
        >
          <span>Смотреть коллекцию</span>
          <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </Link>
        {count > 0 ? (
          <span className="text-xs tracking-wider text-muted/80">
            {count} {count === 1 ? "изделие" : count < 5 ? "изделия" : "изделий"}
          </span>
        ) : null}
      </div>
    </motion.div>
  );

  const mediaBlock = (
    <motion.div
      style={reduced ? undefined : { x: mediaX, scale, opacity }}
      className="relative flex items-center justify-center p-4 md:p-8 will-change-transform"
    >
      {/* Акварельная клякса сзади кадра — точь-в-точь как в Azalea */}
      <Blots variant={index} className="scale-110 opacity-70" />

      {/* Белая рамка вокруг кадра с мягкими углами */}
      <div className="relative z-10 w-full max-w-lg rounded-lg bg-surface p-3 shadow-sm md:p-5">
        <Link
          href={`/catalog/${item.category.slug}`}
          className="group relative block aspect-[4/5] w-full overflow-hidden rounded-md bg-sand"
        >
          <div className="tile-zoom absolute inset-0">
            <Media
              image={item.category.cover}
              sizes="(min-width: 1024px) 45vw, (min-width: 768px) 50vw, 100vw"
              priority={index === 0}
            />
          </div>
          {/* Плавное затемнение на ховере с надписью */}
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
      aria-label={item.category.title}
      className="relative flex min-h-[85vh] items-center overflow-hidden py-12 md:min-h-svh md:py-20"
    >
      <div className="mx-auto grid w-full max-w-[1500px] items-center gap-8 px-5 md:grid-cols-2 md:gap-12 md:px-8">
        {/* На мобильном кадр идёт первым */}
        <div className="contents md:hidden">{mediaBlock}</div>

        {index % 2 === 0 ? (
          <>
            {textBlock}
            <div className="hidden md:block">{mediaBlock}</div>
          </>
        ) : (
          <>
            <div className="hidden md:block">{mediaBlock}</div>
            {textBlock}
          </>
        )}
      </div>
    </section>
  );
}

export function CatalogShowcase() {
  return (
    <div id="catalog" className="relative w-full bg-bg py-8 md:py-16">
      <div className="mx-auto max-w-[1500px] px-5 pb-6 text-center md:px-8 md:pb-10">
        <p className="eyebrow">Авторские коллекции</p>
        <h2 className="mt-3 font-display text-4xl leading-tight text-ink md:text-6xl">Каталог</h2>
        <div className="mx-auto mt-4 h-px w-16 bg-clay/50" />
      </div>

      <div className="divide-y divide-sand/40">
        {SHOWCASE_ITEMS.map((item, index) => (
          <ShowcaseSection key={item.category.slug} item={item} index={index} />
        ))}
      </div>
    </div>
  );
}
