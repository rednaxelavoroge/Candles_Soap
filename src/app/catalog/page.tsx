import { CatalogSections } from "@/components/catalog/CatalogSections";
import { getFilledCategories, getProductsByCategory } from "@/lib/content";
import type { Metadata } from "next";

const DESCRIPTION = "Свечи, мыло, гипс и декор ручной работы — разделы каталога.";

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
      <header className="relative overflow-hidden px-5 pt-4 pb-10 md:px-8 md:pb-14">
        <p className="eyebrow relative">Каталог</p>
        <h1 className="relative mt-2 font-display text-4xl md:text-6xl">Разделы коллекции</h1>
      </header>

      <CatalogSections />
    </div>
  );
}
