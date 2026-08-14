import { BackstageTile } from "@/components/backstage/BackstageItem";
import { getBackstage } from "@/lib/content";
import type { Metadata } from "next";
import Link from "next/link";

const DESCRIPTION = "Кадры и короткие ролики изделий ручной работы: свечи, мыло, гипс.";

export const metadata: Metadata = {
  title: "Бэкстейдж",
  description: DESCRIPTION,
  openGraph: { title: "Бэкстейдж", description: DESCRIPTION },
};

export default function BackstagePage() {
  const items = getBackstage();

  return (
    <div className="pt-24 md:pt-32">
      <header className="px-5 pb-8 md:px-8 md:pb-12">
        <p className="eyebrow">Бэкстейдж</p>
        <h1 className="mt-2 max-w-3xl font-display text-4xl leading-tight md:text-6xl">
          Кадры и короткие ролики
        </h1>
        <p className="mt-5 max-w-prose text-sm text-muted md:text-base">
          Лента изделий вперемешку с видео. Ролики запускаются по нажатию — до этого
          страница не грузит ни одного видеопотока.
        </p>
      </header>

      {items.length > 0 ? (
        <ul className="frame-grid grid-cols-2 md:grid-cols-3">
          {items.map((item, index) => (
            <li key={index} className="contents">
              <BackstageTile item={item} priority={index < 2} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-5 pb-16 text-sm text-muted md:px-8">Лента пока пуста.</p>
      )}

      <div className="px-5 py-14 md:px-8 md:py-20">
        <Link href="/catalog" className="link-underline text-sm">
          Смотреть каталог
        </Link>
      </div>
    </div>
  );
}
