import { CatalogSections } from "@/components/catalog/CatalogSections";
import { getText } from "@/lib/content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: getText("catalog.title") || "Каталог",
  description: getText("seo.catalog"),
  openGraph: {
    title: getText("catalog.title") || "Каталог",
    description: getText("seo.catalog"),
  },
};

export default function CatalogPage() {
  const title = getText("catalog.title");
  return (
    <div className="pt-24 md:pt-32">
      {title ? (
        <header className="relative overflow-hidden px-5 pt-4 pb-8 md:px-8 md:pb-12">
          <h1 className="relative font-display text-4xl leading-tight text-ink md:text-6xl lg:text-7xl">
            {title}
          </h1>
        </header>
      ) : null}

      <CatalogSections />
    </div>
  );
}
