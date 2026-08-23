"use client";

import { CategorySections } from "@/components/catalog/CategorySections";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { DragScroller } from "@/components/ui/DragScroller";
import type { Section } from "@/lib/content";
import { pluralItems } from "@/lib/plural";
import type { Category, Product, Tag } from "@/lib/schemas";
import { motion } from "framer-motion";
import { useState } from "react";

export function CategoryView({
  category,
  products,
  sections,
  tags,
}: {
  category: Category;
  products: Product[];
  sections: Section[];
  tags: Tag[];
}) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Фильтрация товаров по выбранному тегу
  const filteredProducts = selectedTag
    ? products.filter((p) => p.tags.includes(selectedTag))
    : products;

  // Найти текущий выбранный тег/рубрику
  const activeTagObj = tags.find((t) => t.slug === selectedTag);

  return (
    <div className="w-full">
      {/* Верхняя горизонтальная лента с кнопками-кругляшками (фильтрами) */}
      <div className="px-5 pb-8 md:px-8 md:pb-10">
        <span className="eyebrow block mb-3 text-xs tracking-widest text-accent uppercase font-medium">
          Рубрики и темы
        </span>
        <DragScroller className="-mx-5 px-5 md:-mx-8 md:px-8">
          <div className="flex w-max items-center gap-2.5 pb-2">
            {/* Кнопка "Все разделы" */}
            <button
              type="button"
              onClick={() => setSelectedTag(null)}
              className={`rounded-full px-5 py-2.5 text-xs font-semibold tracking-wider uppercase whitespace-nowrap transition-all duration-300 ${
                selectedTag === null
                  ? "bg-btn-brown text-white shadow-md scale-105"
                  : "border border-sand bg-surface text-ink hover:border-clay hover:bg-bg"
              }`}
            >
              Все разделы ({sections.length})
            </button>

            {/* Круглые кнопки-фильтры для каждого тега/рубрики */}
            {sections
              .filter((s) => s.slug !== "vse")
              .map((section) => {
                const isSelected = selectedTag === section.slug;
                return (
                  <button
                    key={section.slug}
                    type="button"
                    onClick={() => setSelectedTag(isSelected ? null : section.slug)}
                    aria-pressed={isSelected}
                    className={`rounded-full px-5 py-2.5 text-xs font-semibold tracking-wider uppercase whitespace-nowrap transition-all duration-300 ${
                      isSelected
                        ? "bg-btn-brown text-white shadow-md scale-105"
                        : "border border-sand bg-surface text-ink hover:border-clay hover:bg-bg"
                    }`}
                  >
                    {section.title} <span className="opacity-75 text-[0.7rem] ml-1">({section.count})</span>
                  </button>
                );
              })}

            {selectedTag !== null ? (
              <button
                type="button"
                onClick={() => setSelectedTag(null)}
                className="link-underline ml-3 text-xs font-medium text-muted hover:text-ink whitespace-nowrap"
              >
                Показать все разделы ✕
              </button>
            ) : null}
          </div>
        </DragScroller>
      </div>

      {/* Если выбран конкретный тег/рубрика — показываем сетку товаров */}
      {selectedTag !== null ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full pb-16"
        >
          <div className="flex items-center justify-between px-5 pb-6 text-sm font-medium text-muted md:px-8">
            <p aria-live="polite">
              Рубрика: <span className="font-semibold text-ink">«{activeTagObj?.title || selectedTag}»</span> —{" "}
              {filteredProducts.length} {pluralItems(filteredProducts.length)}
            </p>
            <button
              type="button"
              onClick={() => setSelectedTag(null)}
              className="text-xs font-medium text-accent hover:underline uppercase tracking-wider"
            >
              Вернуться к разделам ↑
            </button>
          </div>
          {filteredProducts.length > 0 ? (
            <ProductGrid products={filteredProducts} />
          ) : (
            <p className="px-5 text-sm text-muted md:px-8">В этой рубрике пока нет изделий.</p>
          )}
        </motion.div>
      ) : (
        /* Если ничего не выбрано — показываем красивые разделы с анимацией навстречу друг другу */
        <CategorySections
          categorySlug={category.slug}
          categoryTitle={category.title}
          sections={sections}
        />
      )}
    </div>
  );
}
