"use client";

import { Media } from "@/components/ui/Media";
import { getCategories, getProductsByCategory, getText } from "@/lib/content";
import { pluralItems } from "@/lib/plural";
import type { Category } from "@/lib/schemas";
import { useReveal } from "@/lib/use-reveal";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";

export function CatalogSections() {
  const categories = getCategories();

  return (
    <div className="flex flex-col gap-12 md:gap-20">
      {categories.map((category, index) => (
        <CatalogSectionItem
          key={category.slug}
          category={category}
          index={index}
          total={categories.length}
        />
      ))}
    </div>
  );
}

function CatalogSectionItem({
  category,
  index,
  total,
}: {
  category: Category;
  index: number;
  total: number;
}) {
  const reduced = useReducedMotion();
  const text = useReveal<HTMLDivElement>();
  const media = useReveal<HTMLDivElement>();
  const count = getProductsByCategory(category.slug).length;
  const num = `0${index + 1} / 0${total}`;
  const isEven = index % 2 === 0;
  // Описание раздела берётся из панели («Подробное описание раздела»); пустое поле — абзаца нет.
  const description = category.description?.trim() ?? "";

  const textInitialX = isEven ? -90 : 90;
  const mediaInitialX = isEven ? 130 : -130;

  return (
    <div className="relative overflow-hidden py-8 md:py-14 border-t border-sand/40">
      <div className="mx-auto grid w-full max-w-[1600px] items-center gap-8 px-5 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-12 md:px-8">
        
        {/* Текст раздела */}
        <motion.div
          ref={text.ref}
          initial={reduced ? undefined : { opacity: 0, x: textInitialX, y: 20 }}
          animate={reduced || text.shown ? { opacity: 1, x: 0, y: 0 } : undefined}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className={`flex w-full flex-col justify-center px-2 py-4 will-change-transform md:px-8 lg:px-12 ${
            isEven ? "md:order-1" : "md:order-2"
          }`}
        >
          <span className="text-xs font-medium tracking-[0.04em] text-accent">
            {num}
          </span>
          <h2 className="mt-3 font-display text-3xl leading-tight text-ink sm:text-4xl md:text-5xl">
            {category.title}
          </h2>
          {description ? (
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted md:text-lg">
              {description}
            </p>
          ) : null}
          <div className="mt-7 flex items-center gap-5">
            <Link
              href={`/catalog/${category.slug}`}
              className="group inline-flex items-center gap-2.5 rounded-full btn-brown-outline px-7 py-3 text-xs font-semibold tracking-[0.03em]"
            >
              <span>{getText("catalog.viewButton")}</span>
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
            {count > 0 ? (
              <span className="text-xs tracking-wider text-muted">
                {count} {pluralItems(count)}
              </span>
            ) : null}
          </div>
        </motion.div>

        {/* Картинка раздела */}
        <motion.div
          ref={media.ref}
          initial={reduced ? undefined : { opacity: 0, x: mediaInitialX, y: 20, scale: 0.94 }}
          animate={reduced || media.shown ? { opacity: 1, x: 0, y: 0, scale: 1 } : undefined}
          transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
          className={`relative flex items-center justify-center p-2 will-change-transform md:p-4 ${
            isEven ? "md:order-2" : "md:order-1"
          }`}
        >
          <div className="relative w-full max-w-[min(760px,62vh)] overflow-hidden rounded-2xl transition-transform duration-500 hover:scale-[1.02]">
            <Link
              href={`/catalog/${category.slug}`}
              aria-label={`Смотреть раздел «${category.title}»`}
              className="group relative block aspect-square w-full overflow-hidden"
            >
              <div className="tile-zoom absolute inset-0">
                <Media
                  image={category.cover}
                  sizes="(min-width: 1024px) 55vw, (min-width: 768px) 58vw, 100vw"
                  priority={index === 0}
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-ink/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100 backdrop-blur-[1px]">
                <span className="rounded-full bg-white/95 px-6 py-2.5 text-xs font-semibold tracking-[0.03em] text-ink shadow-md backdrop-blur-sm">
                  {getText("catalog.openOverlay")} →
                </span>
              </div>
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
