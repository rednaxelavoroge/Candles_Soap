import { Blots } from "@/components/ui/Blots";
import { CategoryView } from "@/components/catalog/CategoryView";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { getCategories, getCategory, getProductsByCategory, getTagsForCategory } from "@/lib/content";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

type Params = { category: string };

export function generateStaticParams(): Params[] {
  return getCategories().map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getCategory(slug);
  if (!category) return {};

  const description = `${category.title} ручной работы — раздел каталога.`;
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

  const products = getProductsByCategory(slug);
  const tags = getTagsForCategory(slug);

  return (
    <div className="pt-24 md:pt-32">
      <header className="relative overflow-hidden px-5 pt-4 pb-10 md:px-8 md:pb-12">
        <Blots variant={2} />
        <Link href="/catalog" className="link-underline eyebrow relative">
          Каталог
        </Link>
        <h1 className="relative mt-2 font-display text-4xl md:text-6xl">{category.title}</h1>
      </header>

      {products.length === 0 ? (
        <p className="px-5 pb-16 text-sm text-muted md:px-8">В этом разделе пока нет изделий.</p>
      ) : tags.length > 0 ? (
        // useSearchParams требует границы Suspense: в статику уезжает
        // нефильтрованная сетка, фильтры оживают после гидратации.
        <Suspense fallback={<ProductGrid products={products} />}>
          <CategoryView products={products} tags={tags} />
        </Suspense>
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
