import { Tile } from "@/components/ui/Tile";
import { getCategories, getCategory, getCover, getProductsByCategory } from "@/lib/content";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Params = { category: string };

export function generateStaticParams(): Params[] {
  return getCategories().map((category) => ({ category: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
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

  return (
    <div className="pt-24 md:pt-32">
      <header className="px-5 pb-8 md:px-8 md:pb-12">
        <Link href="/catalog" className="link-underline eyebrow">
          Каталог
        </Link>
        <h1 className="mt-2 font-display text-4xl md:text-6xl">{category.title}</h1>
      </header>

      {products.length > 0 ? (
        <ul className="frame-grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product, index) => (
            <li key={product.id} className="contents">
              <Tile
                href={`/catalog/${category.slug}/${product.slug}`}
                title={product.title}
                image={getCover(product)}
                caption={product.price ? `${product.price.toLocaleString("ru-RU")} ₽` : undefined}
                priority={index < 2}
                className="aspect-[4/5]"
                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-5 pb-16 text-sm text-muted md:px-8">
          В этом разделе пока нет изделий.
        </p>
      )}
    </div>
  );
}
