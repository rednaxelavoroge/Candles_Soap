"use client";

import { Media } from "@/components/ui/Media";
import { getCategories, getProductsByCategory } from "@/lib/content";
import type { Category } from "@/lib/schemas";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";

type ShowcaseItem = {
  category: Category;
  number: string;
  subtitle: string;
  description: string;
};

export function CatalogShowcase() {
  const categories = getCategories();

  const showcaseItems: ShowcaseItem[] = categories.map((cat, idx) => {
    return {
      category: cat,
      number: `0${idx + 1} / 0${categories.length}`,
      subtitle: cat.subtitle || "Авторские изделия ручной работы",
      description: cat.description || "Каждая партия небольшая, поэтому почти любую вещь можно повторить в вашем цвете и аромате.",
    };
  });

  return (
    <section id="catalog" className="relative overflow-hidden bg-bg py-16 md:py-24" aria-label="Каталог изделий">
      <div className="mx-auto max-w-[1500px] px-5 pb-12 md:px-8">
        <h2 className="font-display text-3xl leading-tight text-ink sm:text-4xl md:text-5xl lg:text-6xl">
          Каталог
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
          Выберите раздел, чтобы посмотреть все доступные изделия, палитру оттенков и варианты ароматов.
        </p>
      </div>

      <div className="flex flex-col gap-12 md:gap-20">
        {showcaseItems.map((item, index) => (
          <ShowcaseSection key={item.category.slug} item={item} index={index} />
        ))}
      </div>
    </section>
  );
}

function ShowcaseSection({
  item,
  index,
}: {
  item: ShowcaseItem;
  index: number;
}) {
  const reduced = useReducedMotion();
  const count = getProductsByCategory(item.category.slug).length;

  const isEven = index % 2 === 0;

  return (
    <div className="relative overflow-hidden py-6 md:py-12 border-t border-sand/40">
      <div className="mx-auto grid w-full max-w-[1400px] items-center gap-8 px-5 md:grid-cols-2 md:gap-12 md:px-8">
        
        {/* Картинка раздела */}
        <motion.div
          initial={reduced ? undefined : { opacity: 0, y: 25 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.05, margin: "100px 0px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className={`relative flex items-center justify-center p-2 will-change-transform md:p-4 ${
            isEven ? "md:order-2" : "md:order-1"
          }`}
        >
          <div className="relative w-full max-w-[480px] overflow-hidden rounded-2xl transition-transform duration-500 hover:scale-[1.02]">
            <Link
              href={`/catalog/${item.category.slug}`}
              className="group relative block aspect-square w-full overflow-hidden"
            >
              <div className="tile-zoom absolute inset-0">
                <Media
                  image={item.category.cover}
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

        {/* Текстовое описание раздела */}
        <motion.div
          initial={reduced ? undefined : { opacity: 0, y: 25 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.05, margin: "100px 0px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className={`flex w-full flex-col justify-center px-2 py-4 will-change-transform md:px-8 lg:px-12 ${
            isEven ? "md:order-1" : "md:order-2"
          }`}
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

      </div>
    </div>
  );
}
