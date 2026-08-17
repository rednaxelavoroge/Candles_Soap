import { BackstageTile } from "@/components/backstage/BackstageItem";
import { Blots } from "@/components/ui/Blots";
import { getBackstage } from "@/lib/content";
import type { Metadata } from "next";
import Link from "next/link";

const DESCRIPTION = "Кадры мастерской и короткие ролики изделий ручной работы: свечи, мыло, гипс.";

export const metadata: Metadata = {
  title: "Бэкстейдж — Процесс создания",
  description: DESCRIPTION,
  openGraph: { title: "Бэкстейдж — AnnaManasaryan.Art", description: DESCRIPTION },
};

const LAYOUT_PATTERNS = [
  "aspect-[4/5] md:aspect-[3/4]",
  "aspect-[4/5] md:col-span-2 md:aspect-[16/10]",
  "aspect-[4/5] md:aspect-[4/5]",
  "aspect-[4/5] md:aspect-[3/4]",
  "aspect-[4/5] md:col-span-2 md:aspect-[3/2]",
  "aspect-[4/5] md:aspect-[2/3]",
] as const;

export default function BackstagePage() {
  const items = getBackstage();

  return (
    <div className="pt-24 md:pt-32">
      <header className="relative overflow-hidden px-5 pb-8 md:px-8 md:pb-12">
        <Blots variant={1} />
        <span className="eyebrow relative">Мастерская</span>
        <h1 className="relative mt-2 max-w-3xl font-display text-4xl leading-tight text-ink md:text-6xl">
          Кадры и короткие ролики
        </h1>
        <p className="relative mt-4 max-w-prose text-base leading-relaxed text-muted md:text-lg">
          Живой процесс создания изделий: текстура гипса, заливка соевого воска, нежные формы мыльных букетов и детали ручной работы.
        </p>
      </header>

      {items.length > 0 ? (
        <ul className="frame-grid grid-cols-2 md:grid-cols-4">
          {items.map((item, index) => {
            const pattern = LAYOUT_PATTERNS[index % LAYOUT_PATTERNS.length];
            return (
              <li key={index} className="contents">
                <BackstageTile item={item} priority={index < 2} className={pattern} />
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="px-5 pb-16 text-sm text-muted md:px-8">Лента пока пуста.</p>
      )}

      <div className="flex items-center justify-between px-5 py-14 md:px-8 md:py-20">
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
