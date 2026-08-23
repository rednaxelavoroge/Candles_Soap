import { CategorySections } from "@/components/catalog/CategorySections";
import { getCategories, getCategory, getSectionsForCategory } from "@/lib/content";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Params = { category: string };

export function generateStaticParams(): Params[] {
  return getCategories().map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getCategory(slug);
  if (!category) return {};

  const description = `${category.title} ручной работы — разделы каталога.`;
  return {
    title: category.title,
    description,
    openGraph: { title: category.title, description },
  };
}

/**
 * Второй уровень: нажали «Мыло» — увидели разделы, а не сразу все фотографии.
 * Матрица изделий живёт уровнем ниже, в /catalog/<категория>/razdel/<раздел>.
 */
export default async function CategoryPage({ params }: { params: Promise<Params> }) {
  const { category: slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const sections = getSectionsForCategory(slug);

  return (
    <div className="pt-24 md:pt-32">
      <header className="relative overflow-hidden px-5 pt-4 pb-10 md:px-8 md:pb-12">
        <Link href="/catalog" className="link-underline eyebrow relative">
          Каталог
        </Link>
        <h1 className="relative mt-2 font-display text-4xl md:text-6xl">{category.title}</h1>
        {category.description ? (
          <p className="relative mt-4 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
            {category.description}
          </p>
        ) : null}
      </header>

      {sections.length === 0 ? (
        <p className="px-5 pb-16 text-sm text-muted md:px-8">В этом разделе пока нет изделий.</p>
      ) : (
        <CategorySections
          categorySlug={category.slug}
          categoryTitle={category.title}
          sections={sections}
        />
      )}
    </div>
  );
}
