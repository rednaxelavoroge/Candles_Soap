"use client";

import { Media } from "@/components/ui/Media";
import { getCategories, getProductsByCategory } from "@/lib/content";
import type { Category } from "@/lib/schemas";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useAnimationsReady } from "@/lib/use-animations-ready";

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

const SHOWCASE_DESC: Record<string, string> = {
  candles: "Интерьерные и формовые свечи из 100% натурального соевого воска с хлопковыми и деревянными фитилями.",
  soap: "Мыло варится вручную небольшими партиями — с добавлением растительных масел и мягким, обволакивающим ароматом.",
  gypsum: "Подсвечники, шкатулки, подносы, тарелки и вазы из высокопрочного скульптурного гипса с бархатистой текстурой.",
  decor: "Интерьерные раковины, композиции цветочный луг, лодочки и ванночки для гармонии дома.",
  sachet: "Аромасаше и флорентийские пластины для шкафов, гардеробных и спальни со стойким шлейфом.",
};

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
  // Анимация включается только на клиенте, зато включается по-настоящему:
  // блок пересоздаётся по `key`, и `initial` применяется как положено.
  const animated = useAnimationsReady() && !reduced;
  const count = getProductsByCategory(category.slug).length;
  const num = `0${index + 1} / 0${total}`;
  const isEven = index % 2 === 0;
  const description = SHOWCASE_DESC[category.slug] ?? "Авторские изделия ручной работы малых партий.";

  const textInitialX = isEven ? -55 : 55;
  const mediaInitialX = isEven ? 55 : -55;

  return (
    <div className="relative overflow-hidden py-8 md:py-14 border-t border-sand/40">
      <div className="mx-auto grid w-full max-w-[1400px] items-center gap-8 px-5 md:grid-cols-2 md:gap-12 md:px-8">
        
        {/* Текст раздела */}
        <motion.div
          key={animated ? "animated" : "static"}
          initial={animated ? { opacity: 0, x: textInitialX, y: 15 } : false}
          whileInView={animated ? { opacity: 1, x: 0, y: 0 } : undefined}
          viewport={{ once: true, amount: 0, margin: "150px 0px 150px 0px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className={`flex w-full flex-col justify-center px-2 py-4 will-change-transform md:px-8 lg:px-12 ${
            isEven ? "md:order-1" : "md:order-2"
          }`}
        >
          <span className="text-xs font-medium tracking-[0.22em] text-accent uppercase">
            {num}
          </span>
          <h2 className="mt-3 font-display text-3xl leading-tight text-ink sm:text-4xl md:text-5xl">
            {category.title}
          </h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-muted md:text-lg">
            {description}
          </p>
          <div className="mt-7 flex items-center gap-5">
            <Link
              href={`/catalog/${category.slug}`}
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

        {/* Картинка раздела */}
        <motion.div
          key={animated ? "animated" : "static"}
          initial={animated ? { opacity: 0, x: mediaInitialX, y: 15, scale: 0.96 } : false}
          whileInView={animated ? { opacity: 1, x: 0, y: 0, scale: 1 } : undefined}
          viewport={{ once: true, amount: 0, margin: "150px 0px 150px 0px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className={`relative flex items-center justify-center p-2 will-change-transform md:p-4 ${
            isEven ? "md:order-2" : "md:order-1"
          }`}
        >
          <div className="relative w-full max-w-[480px] overflow-hidden rounded-2xl transition-transform duration-500 hover:scale-[1.02]">
            <Link
              href={`/catalog/${category.slug}`}
              aria-label={`Смотреть раздел «${category.title}»`}
              className="group relative block aspect-square w-full overflow-hidden"
            >
              <div className="tile-zoom absolute inset-0">
                <Media
                  image={category.cover}
                  sizes="(min-width: 1024px) 40vw, (min-width: 768px) 50vw, 100vw"
                  priority={index === 0}
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-ink/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100 backdrop-blur-[1px]">
                <span className="rounded-full bg-white/95 px-6 py-2.5 text-xs font-semibold tracking-widest text-ink uppercase shadow-md backdrop-blur-sm">
                  Открыть раздел →
                </span>
              </div>
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
