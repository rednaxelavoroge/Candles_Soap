import { CategoryView } from "@/components/catalog/CategoryView";
import {
  getCategories,
  getCategory,
  getProductsByCategory,
  getSectionsForCategory,
  getTagsForCategory,
} from "@/lib/content";
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

export default async function CategoryPage({ params }: { params: Promise<Params> }) {
  const { category: slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const sections = getSectionsForCategory(slug);
  const products = getProductsByCategory(slug);
  const tags = getTagsForCategory(slug);

  return (
    <div className="pt-24 md:pt-32">
      <header className="relative overflow-hidden px-5 pt-4 pb-8 md:px-8 md:pb-10">
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
        <CategoryView
          category={category}
          products={products}
          sections={sections}
          tags={tags}
        />
      )}
    </div>
  );
}
