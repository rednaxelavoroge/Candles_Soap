"use client";

import { Media } from "@/components/ui/Media";
import { getCover, getFeatured } from "@/lib/content";
import Link from "next/link";
import { useRef } from "react";

export function FeaturedCarousel() {
  // Название, подпись и состав ленты задаёт заказчица в админке.
  const featured = getFeatured();
  const products = featured.products;
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const offset = direction === "left" ? -420 : 420;
    scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  // Блок выключен в админке или показывать нечего — секции просто нет.
  if (!featured.enabled || products.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-surface py-16 md:py-24 border-y border-sand/40">
      <div className="mx-auto max-w-[1500px] px-5 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10">
          <div>
            {featured.eyebrow ? <span className="eyebrow">{featured.eyebrow}</span> : null}
            <h2 className="mt-2 font-display text-3xl leading-tight text-ink sm:text-4xl md:text-5xl">
              {featured.title}
            </h2>
            {featured.subtitle ? (
              <p className="mt-2 text-sm text-muted md:text-base">{featured.subtitle}</p>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => scroll("left")}
              aria-label="Листать назад"
              className="group flex h-12 w-12 items-center justify-center rounded-full border border-sand bg-bg transition-all duration-300 hover:border-btn-brown hover:bg-btn-brown hover:text-white shadow-sm"
            >
              <span className="text-lg transition-transform duration-300 group-hover:-translate-x-0.5">←</span>
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              aria-label="Листать вперёд"
              className="group flex h-12 w-12 items-center justify-center rounded-full border border-sand bg-bg transition-all duration-300 hover:border-btn-brown hover:bg-btn-brown hover:text-white shadow-sm"
            >
              <span className="text-lg transition-transform duration-300 group-hover:translate-x-0.5">→</span>
            </button>
          </div>
        </div>

        {/* Горизонтальная плавная лента */}
        <div
          ref={scrollRef}
          className="no-scrollbar flex gap-6 overflow-x-auto pb-6 pt-2 scroll-smooth"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {products.map((product, idx) => {
            const cover = getCover(product);
            return (
              <div
                key={product.id}
                style={{ scrollSnapAlign: "start" }}
                className="group relative flex-none w-[280px] sm:w-[320px] md:w-[360px]"
              >
                <div className="relative rounded-2xl bg-bg p-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-sand/40 transition-all duration-500 hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] hover:-translate-y-1">
                  <Link
                    href={`/catalog/${product.category}/${product.slug}`}
                    className="relative block aspect-[4/5] w-full overflow-hidden rounded-xl bg-sand"
                  >
                    <div className="tile-zoom absolute inset-0">
                      <Media image={cover} sizes="(min-width: 768px) 33vw, 80vw" priority={idx < 2} />
                    </div>

                    <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-ink/75 via-ink/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <span className="text-sm font-medium tracking-[0.04em] text-white/85">
                        {product.article}
                      </span>
                      <span className="font-display text-lg font-medium text-white">
                        {product.title}
                      </span>
                      <span className="mt-2 inline-flex items-center gap-1.5 text-xs text-sand font-medium tracking-[0.02em]">
                        <span>Подробнее</span>
                        <span>→</span>
                      </span>
                    </div>
                  </Link>

                  <div className="pt-3.5 pb-1 px-1 flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-base text-ink line-clamp-1">
                        {product.title}
                      </h3>
                      <p className="text-xs text-muted">
                        {product.article}
                      </p>
                    </div>
                    <Link
                      href={`/catalog/${product.category}/${product.slug}`}
                      className="text-sm font-medium text-accent hover:text-ink transition-colors"
                    >
                      Обзор →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
