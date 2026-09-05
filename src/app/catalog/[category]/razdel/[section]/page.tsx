import { ProductGrid } from "@/components/catalog/ProductGrid";
import {
  getCategories,
  getCategory,
  getProductsBySection,
  getSection,
  getSectionsForCategory,
  getText,
} from "@/lib/content";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Params = { category: string; section: string };

export function generateStaticParams(): Params[] {
  return getCategories().flatMap((category) =>
    getSectionsForCategory(category.slug).map((section) => ({
      category: category.slug,
      section: section.slug,
    })),
  );
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { category: categorySlug, section: sectionSlug } = await params;
  const category = getCategory(categorySlug);
  const section = getSection(categorySlug, sectionSlug);
  if (!category || !section) return {};

  const title = `${section.title} — ${category.title}`;
  const description = section.description ?? `${section.title}: ${category.title.toLowerCase()} ручной работы.`;
  return { title, description, openGraph: { title, description } };
}

/** Третий уровень: матрица фотографий одного раздела. */
export default async function SectionPage({ params }: { params: Promise<Params> }) {
  const { category: categorySlug, section: sectionSlug } = await params;
  const category = getCategory(categorySlug);
  const section = getSection(categorySlug, sectionSlug);
  if (!category || !section) notFound();

  const products = getProductsBySection(categorySlug, sectionSlug);

  return (
    <div className="pt-24 md:pt-32">
      <header className="relative overflow-hidden px-5 pt-4 pb-10 md:px-8 md:pb-12">
        <nav className="eyebrow relative flex flex-wrap items-center gap-2">
          <Link href="/catalog" className="link-underline">
            {getText("nav.catalog") || "Каталог"}
          </Link>
          <span aria-hidden="true">/</span>
          <Link href={`/catalog/${category.slug}`} className="link-underline">
            {category.title}
          </Link>
        </nav>
        <h1 className="relative mt-2 font-display text-4xl md:text-6xl">{section.title}</h1>
        {section.description ? (
          <p className="relative mt-4 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
            {section.description}
          </p>
        ) : null}
      </header>

      {products.length === 0 ? (
        <p className="px-5 pb-16 text-sm text-muted md:px-8">{getText("category.empty")}</p>
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
