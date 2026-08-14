"use client";

import { ProductGrid } from "@/components/catalog/ProductGrid";
import { DragScroller } from "@/components/ui/DragScroller";
import { pluralItems } from "@/lib/plural";
import type { Product, Tag, TagGroup } from "@/lib/schemas";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

const GROUP_TITLES: Record<TagGroup, string> = {
  occasion: "Повод",
  recipient: "Кому",
};

/**
 * Фильтрация без перезагрузки: выбранные теги живут в ?tags=, поэтому ссылку на
 * подборку можно отправить заказчице, а «назад» возвращает предыдущий набор.
 *
 * Внутри одной группы теги складываются по «или» (свадьба ИЛИ крестины),
 * между группами — по «и» (свадьба И девушкам). Иначе добавление второго
 * повода сужало бы выдачу до пустоты.
 */
export function CategoryView({ products, tags }: { products: Product[]; tags: Tag[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const active = useMemo(() => {
    const raw = searchParams.get("tags");
    return new Set(raw ? raw.split(",").filter(Boolean) : []);
  }, [searchParams]);

  const groups = useMemo(() => {
    const map = new Map<TagGroup, Tag[]>();
    for (const tag of tags) {
      const list = map.get(tag.group) ?? [];
      list.push(tag);
      map.set(tag.group, list);
    }
    return [...map.entries()];
  }, [tags]);

  const filtered = useMemo(() => {
    if (active.size === 0) return products;

    const selectedByGroup = new Map<TagGroup, string[]>();
    for (const tag of tags) {
      if (!active.has(tag.slug)) continue;
      const list = selectedByGroup.get(tag.group) ?? [];
      list.push(tag.slug);
      selectedByGroup.set(tag.group, list);
    }

    return products.filter((product) =>
      [...selectedByGroup.values()].every((slugs) =>
        slugs.some((slug) => product.tags.includes(slug)),
      ),
    );
  }, [active, products, tags]);

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
    <>
      <DragScroller className="px-5 pb-6 md:px-8 md:pb-8">
        <div className="flex w-max items-end gap-6 md:gap-10">
          {groups.map(([group, groupTags]) => (
            <fieldset key={group} className="flex flex-col gap-2">
              <legend className="eyebrow mb-2">{GROUP_TITLES[group]}</legend>
              <div className="flex gap-2">
                {groupTags.map((tag) => {
                  const selected = active.has(tag.slug);
                  return (
                    <button
                      key={tag.slug}
                      type="button"
                      onClick={() => toggle(tag.slug)}
                      aria-pressed={selected}
                      className={`border px-4 py-2 text-sm whitespace-nowrap transition-colors duration-300 ${
                        selected
                          ? "border-ink bg-ink text-surface"
                          : "border-sand text-ink hover:border-clay"
                      }`}
                    >
                      {tag.title}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}

          {active.size > 0 ? (
            <button
              type="button"
              onClick={() => setTags(new Set())}
              className="link-underline pb-2 text-sm whitespace-nowrap text-muted"
            >
              Сбросить
            </button>
          ) : null}
        </div>
      </DragScroller>

      <p aria-live="polite" className="px-5 pb-4 text-sm text-muted md:px-8">
        {filtered.length > 0
          ? `${filtered.length} ${pluralItems(filtered.length)}`
          : "По выбранным фильтрам ничего нет"}
      </p>

      {filtered.length > 0 ? <ProductGrid products={filtered} /> : null}
    </>
  );
}
