"use client";

import { ProductGrid } from "@/components/catalog/ProductGrid";
import { DragScroller } from "@/components/ui/DragScroller";
import { pluralItems } from "@/lib/plural";
import type { Product, Tag } from "@/lib/schemas";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

export function CategoryView({ products, tags }: { products: Product[]; tags: Tag[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const active = useMemo(() => {
    const raw = searchParams.get("tags");
    return new Set(raw ? raw.split(",").filter(Boolean) : []);
  }, [searchParams]);

  const filtered = useMemo(() => {
    if (active.size === 0) return products;
    return products.filter((product) =>
      Array.from(active).some((activeSlug) => product.tags.includes(activeSlug)),
    );
  }, [active, products]);

  const setTags = (next: Set<string>) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next.size > 0) params.set("tags", [...next].join(","));
    else params.delete("tags");

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const toggle = (slug: string) => {
    const next = new Set(active);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    setTags(next);
  };

  return (
    <div className="w-full">
      {/* Горизонтальная плавная лента подборок под единым заголовком «Тематика» */}
      <div className="px-5 pb-6 md:px-8 md:pb-8">
        <span className="eyebrow block mb-3">Тематика</span>
        <DragScroller className="-mx-5 px-5 md:-mx-8 md:px-8">
          <div className="flex w-max items-center gap-2.5 pb-2">
            {/* Кнопка "Все изделия" */}
            <button
              type="button"
              onClick={() => setTags(new Set())}
              className={`rounded-full px-5 py-2.5 text-xs font-semibold tracking-wider uppercase whitespace-nowrap transition-all duration-300 ${
                active.size === 0
                  ? "bg-btn-brown text-white shadow-md"
                  : "border border-sand bg-surface text-ink hover:border-clay hover:bg-bg"
              }`}
            >
              Все изделия ({products.length})
            </button>

            {/* Теги категорий */}
            {tags.map((tag) => {
              const selected = active.has(tag.slug);
              return (
                <button
                  key={tag.slug}
                  type="button"
                  onClick={() => toggle(tag.slug)}
                  aria-pressed={selected}
                  className={`rounded-full px-5 py-2.5 text-xs font-semibold tracking-wider uppercase whitespace-nowrap transition-all duration-300 ${
                    selected
                      ? "bg-btn-brown text-white shadow-md"
                      : "border border-sand bg-surface text-ink hover:border-clay hover:bg-bg"
                  }`}
                >
                  {tag.title}
                </button>
              );
            })}

            {active.size > 0 ? (
              <button
                type="button"
                onClick={() => setTags(new Set())}
                className="link-underline ml-2 text-xs font-medium text-muted hover:text-ink whitespace-nowrap"
              >
                Сбросить
              </button>
            ) : null}
          </div>
        </DragScroller>
      </div>

      <div className="flex items-center justify-between px-5 pb-5 text-xs font-medium text-muted md:px-8">
        <p aria-live="polite">
          {filtered.length > 0
            ? `Показано: ${filtered.length} ${pluralItems(filtered.length)}`
            : "По выбранным критериям ничего не найдено"}
        </p>
      </div>

      {filtered.length > 0 ? <ProductGrid products={filtered} /> : null}
    </div>
  );
}
