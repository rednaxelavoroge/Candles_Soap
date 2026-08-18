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

  const textBlock = (
    <div className="flex w-full flex-col justify-center px-4 py-4 md:px-8 lg:px-12">
      <span className="text-xs font-medium tracking-[0.22em] text-muted uppercase">
        {item.number}
      </span>
      <h3 className="mt-2 font-display text-2xl leading-tight text-ink sm:text-3xl md:text-4xl lg:text-5xl">
        {item.category.title}
      </h3>
      <p className="mt-2 text-sm font-medium tracking-wide text-accent md:text-base">
        {item.subtitle}
      </p>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted md:text-base">
        {item.description}
      </p>
      <div className="mt-6 flex items-center gap-5">
        <Link
          href={`/catalog/${item.category.slug}`}
          className="group inline-flex items-center gap-2.5 rounded-md border border-ink bg-transparent px-6 py-3 text-sm tracking-wide text-ink transition-all duration-300 hover:bg-ink hover:text-white"
        >
          <span>Смотреть изделия</span>
          <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </Link>
        {count > 0 ? (
          <span className="text-xs tracking-wider text-muted/80">
            {count} {count === 1 ? "изделие" : count < 5 ? "изделия" : "изделий"}
          </span>
        ) : null}
      </div>
    </div>
  );

  const mediaBlock = (
    <div className="relative flex items-center justify-center p-3 md:p-6">
      {/* Акварельная клякса сзади кадра */}
      <Blots variant={index} className="scale-105 opacity-60" />

      {/* Белая рамка вокруг кадра со скруглениями */}
      <div className="relative z-10 w-full max-w-md rounded-xl bg-surface p-3 shadow-sm md:p-4">
        <Link
          href={`/catalog/${item.category.slug}`}
          className="group relative block aspect-[4/5] w-full overflow-hidden rounded-lg bg-sand md:aspect-[3/4]"
        >
          <div className="tile-zoom absolute inset-0">
            <Media
              image={item.category.cover}
              sizes="(min-width: 1024px) 40vw, (min-width: 768px) 50vw, 100vw"
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
    </div>
  );

  return (
    <div className="relative py-8 md:py-12">
      <div className="mx-auto grid w-full max-w-[1400px] items-center gap-6 px-5 md:grid-cols-2 md:gap-10 md:px-8">
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
    <div id="catalog" className="relative w-full bg-bg py-8 md:py-12">
      <div className="mx-auto max-w-[1400px] px-5 pb-4 text-center md:px-8 md:pb-6">
        <p className="eyebrow">Авторские коллекции</p>
        <h2 className="mt-2 font-display text-3xl leading-tight text-ink md:text-5xl">Каталог</h2>
        <div className="mx-auto mt-3 h-px w-16 bg-clay/50" />
      </div>

      <div className="divide-y divide-sand/50">
        {SHOWCASE_ITEMS.map((item, index) => (
          <ShowcaseSection key={item.category.slug} item={item} index={index} />
        ))}
      </div>
    </div>
  );
}
