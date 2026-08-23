"use client";

import { Media } from "@/components/ui/Media";
import type { Section } from "@/lib/content";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";

export function CategorySections({
  categorySlug,
  categoryTitle,
  sections,
}: {
  categorySlug: string;
  categoryTitle: string;
  sections: Section[];
}) {
  return (
    <div className="flex flex-col gap-12 md:gap-20">
      {sections.map((section, index) => (
        <SectionItem
          key={section.slug}
          categorySlug={categorySlug}
          categoryTitle={categoryTitle}
          section={section}
          index={index}
          total={sections.length}
        />
      ))}
    </div>
  );
}

function plural(count: number): string {
  const tail = count % 100;
  if (tail >= 11 && tail <= 14) return "изделий";
  switch (count % 10) {
    case 1:
      return "изделие";
    case 2:
    case 3:
    case 4:
      return "изделия";
    default:
      return "изделий";
  }
}

function SectionItem({
  categorySlug,
  categoryTitle,
  section,
  index,
  total,
}: {
  categorySlug: string;
  categoryTitle: string;
  section: Section;
  index: number;
  total: number;
}) {
  const reduced = useReducedMotion();
  const href = `/catalog/${categorySlug}/razdel/${section.slug}`;
  const num = `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
  const isEven = index % 2 === 0;

  // Динамическое движение навстречу друг другу
  const textInitialX = isEven ? -55 : 55;
  const mediaInitialX = isEven ? 55 : -55;

  return (
    <div className="relative overflow-hidden border-t border-sand/40 py-8 md:py-14">
      <div className="mx-auto grid w-full max-w-[1400px] items-center gap-8 px-5 md:grid-cols-2 md:gap-12 md:px-8">
        
        {/* Текстовый блок подраздела */}
        <motion.div
          initial={reduced ? undefined : { opacity: 0, x: textInitialX, y: 15 }}
          whileInView={reduced ? undefined : { opacity: 1, x: 0, y: 0 }}
          viewport={{ once: true, amount: 0.1, margin: "0px 0px -40px 0px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className={`flex w-full flex-col justify-center px-2 py-4 will-change-transform md:px-8 lg:px-12 ${
            isEven ? "md:order-1" : "md:order-2"
          }`}
        >
          <span className="text-xs font-medium tracking-[0.22em] text-accent uppercase">{num}</span>
          <h2 className="mt-3 font-display text-3xl leading-tight text-ink sm:text-4xl md:text-5xl">
            {section.title}
          </h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-muted md:text-lg">
            {categoryTitle} — {section.count} {plural(section.count)} в разделе.
          </p>
          <div className="mt-7 flex items-center gap-5">
            <Link
              href={href}
              className="group btn-brown-outline inline-flex items-center gap-2.5 rounded-full px-7 py-3 text-xs font-semibold tracking-[0.18em] uppercase"
            >
              <span>Смотреть изделия</span>
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </motion.div>

        {/* Изображение подраздела */}
        <motion.div
          initial={reduced ? undefined : { opacity: 0, x: mediaInitialX, y: 15, scale: 0.96 }}
          whileInView={reduced ? undefined : { opacity: 1, x: 0, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.1, margin: "0px 0px -40px 0px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className={`relative flex items-center justify-center p-2 will-change-transform md:p-4 ${
            isEven ? "md:order-2" : "md:order-1"
          }`}
        >
          <div className="relative w-full max-w-[480px] overflow-hidden rounded-2xl transition-transform duration-500 hover:scale-[1.02]">
            <Link
              href={href}
              aria-label={`Смотреть раздел «${section.title}»`}
              className="group relative block aspect-square w-full overflow-hidden"
            >
              <div className="tile-zoom absolute inset-0">
                <Media
                  image={section.cover}
                  sizes="(min-width: 1024px) 40vw, (min-width: 768px) 50vw, 100vw"
                  priority={index === 0}
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-ink/20 opacity-0 backdrop-blur-[1px] transition-opacity duration-300 group-hover:opacity-100">
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
