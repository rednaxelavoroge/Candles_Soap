import { BackstageTile } from "@/components/backstage/BackstageItem";
import { getBackstage } from "@/lib/content";
import type { Metadata } from "next";
import Link from "next/link";

const DESCRIPTION = "Кадры мастерской и короткие ролики изделий ручной работы: свечи, мыло, гипс.";

export const metadata: Metadata = {
  title: "Бэкстейдж — Процесс создания",
  description: DESCRIPTION,
  openGraph: { title: "Бэкстейдж — AnnaManasaryan.Art", description: DESCRIPTION },
};

export default function BackstagePage() {
  const items = getBackstage();

  return (
    <div className="pt-24 md:pt-32">
      <header className="relative overflow-hidden px-5 pb-8 md:px-8 md:pb-12">
        <span className="eyebrow relative">Мастерская</span>
        <h1 className="relative mt-2 max-w-3xl font-display text-4xl leading-tight text-ink md:text-6xl">
          Кадры и короткие ролики
        </h1>
        <p className="relative mt-4 max-w-prose text-base leading-relaxed text-muted md:text-lg">
          Живой процесс создания изделий: текстура гипса, заливка соевого воска, нежные формы мыльных букетов и детали ручной работы.
        </p>
      </header>

      {items.length > 0 ? (
        <div className="px-5 md:px-8">
          {/* Сетка в 2 колонки на смартфонах и 3-4 колонки на больших экранах */}
          <div className="columns-2 sm:columns-2 md:columns-3 lg:columns-4 gap-3.5 md:gap-6 [column-fill:_balance]">
            {items.map((item, index) => (
              <div key={index} className="mb-3.5 break-inside-avoid md:mb-6">
                <BackstageTile item={item} priority={index < 4} index={index} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="px-5 pb-16 text-sm text-muted md:px-8">Лента пока пуста.</p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-14 md:px-8 md:py-20">
        <Link href="/catalog" className="link-underline text-base font-medium text-ink">
          ← Перейти в каталог изделий
        </Link>
        <Link href="/contacts" className="link-underline text-base text-muted hover:text-ink">
          Связаться с автором →
        </Link>
      </div>
    </div>
  );
}
