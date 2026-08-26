import { CatalogSections } from "@/components/catalog/CatalogSections";
import type { Metadata } from "next";

const DESCRIPTION = "Свечи, мыло, гипс и декор ручной работы — авторский каталог Анны Манасарян.";

export const metadata: Metadata = {
  title: "Каталог — AnnaManasaryan.Art",
  description: DESCRIPTION,
  openGraph: {
    title: "Каталог — AnnaManasaryan.Art",
    description: DESCRIPTION,
  },
};

export default function CatalogPage() {
  return (
    <div className="pt-24 md:pt-32">
      <header className="relative overflow-hidden px-5 pt-4 pb-8 md:px-8 md:pb-12">
        <h1 className="relative font-display text-4xl leading-tight text-ink md:text-6xl lg:text-7xl">
          Каталог
        </h1>
      </header>

      <CatalogSections />
    </div>
  );
}
