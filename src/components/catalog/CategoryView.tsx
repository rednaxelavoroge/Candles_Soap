"use client";

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
  // Набор выбранных тегов для мультивыбора (можно выбрать 2 и более рубрик одновременно)
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Переключение тега (добавить / убрать)
  const toggleTag = (slug: string) => {
    setSelectedTags((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  // Сброс всех фильтров (кнопка «Все изделия»)
  const clearFilters = () => {
    setSelectedTags([]);
  };

  // Фильтрация товаров: если теги не выбраны — показываем все товары категории.
  // Если выбрано несколько тегов — показываем товары, содержащие хотя бы один из выбранных тегов.
  const filteredProducts =
    selectedTags.length === 0
      ? products
      : products.filter((p) => selectedTags.some((tagSlug) => p.tags.includes(tagSlug)));

  // Список названий выбранных рубрик
  const selectedTagNames = tags
    .filter((t) => selectedTags.includes(t.slug))
    .map((t) => t.title);

  return (
    <div className="w-full">
      {/* Верхняя горизонтальная лента с кнопками-кругляшками (фильтрами) */}
      <div className="px-5 pb-6 md:px-8 md:pb-8">
        <span className="eyebrow block mb-3 text-accent">
          Рубрики и темы
        </span>
        <DragScroller className="-mx-5 px-5 md:-mx-8 md:px-8">
          <div className="flex w-max items-center gap-2.5 pb-2">
            {/* Кнопка "Все изделия" */}
            <button
              type="button"
              onClick={clearFilters}
              className={`rounded-full px-5 py-2.5 text-xs font-semibold tracking-[0.02em] whitespace-nowrap transition-all duration-300 ${
                selectedTags.length === 0
                  ? "bg-btn-brown text-white shadow-md scale-105"
                  : "border border-sand bg-surface text-ink hover:border-clay hover:bg-bg"
              }`}
            >
              Все изделия ({products.length})
            </button>

            {/* Круглые кнопки-фильтры для каждого тега/рубрики */}
            {tags.map((tag) => {
              const isSelected = selectedTags.includes(tag.slug);
              const countInTag = products.filter((p) => p.tags.includes(tag.slug)).length;

              return (
                <button
                  key={tag.slug}
                  type="button"
                  onClick={() => toggleTag(tag.slug)}
                  aria-pressed={isSelected}
                  className={`rounded-full px-5 py-2.5 text-xs font-semibold tracking-[0.02em] whitespace-nowrap transition-all duration-300 ${
                    isSelected
                      ? "bg-btn-brown text-white shadow-md scale-105"
                      : "border border-sand bg-surface text-ink hover:border-clay hover:bg-bg"
                  }`}
                >
                  {isSelected ? "✓ " : ""}
                  {tag.title} <span className="opacity-75 text-[0.7rem] ml-1">({countInTag})</span>
                </button>
              );
            })}

            {selectedTags.length > 0 ? (
              <button
                type="button"
                onClick={clearFilters}
                className="link-underline ml-3 text-xs font-medium text-muted hover:text-ink whitespace-nowrap"
              >
                Сбросить фильтры ✕
              </button>
            ) : null}
          </div>
        </DragScroller>
      </div>

      {/* Информационная строка с количеством и выбранными рубриками */}
      <div className="flex items-center justify-between px-5 pb-6 text-sm font-medium text-muted md:px-8">
        <p aria-live="polite">
          {selectedTags.length > 0 ? (
            <>
              Выбрано: <span className="font-semibold text-ink">{selectedTagNames.join(", ")}</span> —{" "}
              {filteredProducts.length} {pluralItems(filteredProducts.length)}
            </>
          ) : (
            <>
              Всего в категории: <span className="font-semibold text-ink">{filteredProducts.length}</span>{" "}
              {pluralItems(filteredProducts.length)}
            </>
          )}
        </p>
        {selectedTags.length > 0 ? (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm font-medium text-accent hover:underline"
          >
            Показать все ({products.length})
          </button>
        ) : null}
      </div>

      {/* Единая сплошная сетка изделий */}
      {filteredProducts.length > 0 ? (
        <motion.div
          key={selectedTags.join("-") || "all"}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full pb-16"
        >
          <ProductGrid products={filteredProducts} />
        </motion.div>
      ) : (
        <div className="px-5 py-16 text-center text-sm text-muted md:px-8">
          <p>По выбранным фильтрам не найдено изделий.</p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 rounded-full btn-brown px-6 py-2.5 text-xs font-semibold tracking-[0.02em]"
          >
            Сбросить фильтры
          </button>
        </div>
      )}
    </div>
  );
}
