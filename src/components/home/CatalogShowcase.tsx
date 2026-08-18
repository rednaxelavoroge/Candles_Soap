"use client";

import { Blots } from "@/components/ui/Blots";
import { Media } from "@/components/ui/Media";
import { getCategory, getProductsByCategory } from "@/lib/content";
import type { Category } from "@/lib/schemas";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";

type ShowcaseItem = {
  category: Category;
  number: string;
  subtitle: string;
  description: string;
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
  const reduced = useReducedMotion();
  const count = getProductsByCategory(item.category.slug).length;

  // Плавное появление с двух сторон без застревания
  const textFrom = index % 2 === 0 ? -1 : 1;

  const textBlock = (
    <motion.div
      initial={reduced ? undefined : { opacity: 0, x: textFrom * 45 }}
      whileInView={reduced ? undefined : { opacity: 1, x: 0 }}
      viewport={{ once: false, amount: 0.25 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="flex w-full flex-col justify-center px-4 py-4 md:px-8 lg:px-12 will-change-transform"
    >
      <span className="text-xs font-medium tracking-[0.22em] text-accent uppercase">
        {item.number}
      </span>
      <h3 className="mt-3 font-display text-2xl leading-tight text-ink sm:text-3xl md:text-4xl lg:text-5xl">
        {item.category.title}
      </h3>
      <p className="mt-2 text-sm font-medium tracking-wide text-clay md:text-base">
        {item.subtitle}
      </p>
      <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted md:text-base">
        {item.description}
      </p>
      <div className="mt-7 flex items-center gap-5">
        <Link
          href={`/catalog/${item.category.slug}`}
          className="group inline-flex items-center gap-2.5 rounded-full btn-brown-outline px-7 py-3 text-xs font-semibold tracking-[0.18em] uppercase"
        >
          <span>Смотреть изделия</span>
          <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </Link>
        {count > 0 ? (
          <span className="text-xs tracking-wider text-muted">
            {count} {count === 1 ? "изделие" : count < 5 ? "изделия" : "изделий"}
          </span>
        ) : null}
      </div>
    </motion.div>
  );

  const mediaBlock = (
    <motion.div
      initial={reduced ? undefined : { opacity: 0, x: -textFrom * 45, scale: 0.96 }}
      whileInView={reduced ? undefined : { opacity: 1, x: 0, scale: 1 }}
      viewport={{ once: false, amount: 0.25 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex items-center justify-center p-4 md:p-6 will-change-transform"
    >
      {/* Акварельная клякса сзади кадра */}
      <Blots variant={index} className="scale-110 opacity-70" />

      {/* Белая рамка вокруг кадра со скруглениями */}
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-surface p-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-transform duration-500 hover:scale-[1.02] md:p-5">
        <Link
          href={`/catalog/${item.category.slug}`}
          className="group relative block aspect-[4/5] w-full overflow-hidden rounded-xl bg-sand md:aspect-[3/4]"
        >
          <div className="tile-zoom absolute inset-0">
            <Media
              image={item.category.cover}
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
    <div className="relative overflow-hidden py-10 md:py-16">
      <div className="mx-auto grid w-full max-w-[1400px] items-center gap-8 px-5 md:grid-cols-2 md:gap-12 md:px-8">
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
    </div>
  );
}

export function CatalogShowcase() {
  return (
    <section id="catalog" className="relative w-full bg-bg py-10 md:py-16">
      <div className="mx-auto max-w-[1400px] px-5 pb-6 text-center md:px-8 md:pb-8">
        <span className="eyebrow">Авторские коллекции</span>
        <h2 className="mt-2 font-display text-3xl leading-tight text-ink md:text-5xl lg:text-6xl">
          Каталог
        </h2>
        <div className="mx-auto mt-4 h-px w-20 bg-clay/50" />
      </div>

      <div className="divide-y divide-sand/40">
        {SHOWCASE_ITEMS.map((item, index) => (
          <ShowcaseSection key={item.category.slug} item={item} index={index} />
        ))}
      </div>
    </section>
  );
}
