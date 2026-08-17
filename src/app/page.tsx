import { AboutTeaser } from "@/components/home/AboutTeaser";
import { CatalogShowcase } from "@/components/home/CatalogShowcase";
import { ContactBlock } from "@/components/home/ContactBlock";
import { Hero } from "@/components/home/Hero";
import { SplitReveal } from "@/components/home/SplitReveal";
import Link from "next/link";

export default function HomePage() {
  return (
    <>
      {/* 1. Первый экран с портретом, кляксами и брендом */}
      <Hero />

      {/* 2. Расхождение половин экрана «Ручная» и «работа» по диагонали */}
      <SplitReveal wordLeft="Ручная" wordRight="работа">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-5 text-center">
          <span className="text-xs font-medium tracking-[0.25em] text-accent uppercase">
            Авторские коллекции
          </span>
          <h2 className="mt-4 font-display text-3xl leading-tight text-ink md:text-5xl lg:text-6xl">
            Тепло, созданное вручную
          </h2>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
            Декоративное мыло с ароматами трав, свечи из соевого воска и фактурный декор из гипса.
            Небольшие тиражи, созданные с заботой и вниманием к деталям.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="#catalog"
              className="inline-flex items-center gap-2 border border-ink bg-ink px-8 py-3.5 text-sm tracking-wide text-white transition-all duration-300 hover:bg-transparent hover:text-ink"
            >
              Смотреть каталог ↓
            </a>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 border border-sand bg-surface px-8 py-3.5 text-sm tracking-wide text-ink transition-all duration-300 hover:border-ink"
            >
              О мастере
            </Link>
          </div>
        </div>
      </SplitReveal>

      {/* 3. Каталог макросекциями со сплит-слайдером как в Azalea */}
      <CatalogShowcase />

      {/* 4. Блок об авторе */}
      <AboutTeaser />

      {/* 5. Контакты и быстрый заказ в WhatsApp */}
      <ContactBlock />
    </>
  );
}
