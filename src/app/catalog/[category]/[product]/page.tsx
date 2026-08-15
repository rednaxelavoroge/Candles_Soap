import { ProductGallery } from "@/components/product/ProductGallery";
import { Tile } from "@/components/ui/Tile";
import {
  getCategory,
  getCover,
  getProduct,
  getProducts,
  getRelatedProducts,
  getSite,
} from "@/lib/content";
import { productEnquiry, whatsappHref } from "@/lib/contacts";
import type { Product } from "@/lib/schemas";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Params = { category: string; product: string };

const SPEC_LABELS: Record<string, string> = {
  size: "Размер",
  scent: "Аромат",
  composition: "Состав",
  burnTime: "Время горения",
  weight: "Вес",
};

export function generateStaticParams(): Params[] {
  return getProducts().map((product) => ({
    category: product.category,
    product: product.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { category, product: slug } = await params;
  const product = getProduct(category, slug);
  if (!product) return {};

  const cover = getCover(product);
  return {
    title: product.title,
    description: product.description,
    openGraph: {
      type: "article",
      title: product.title,
      description: product.description,
      images: [{ url: cover.src, width: cover.width, height: cover.height, alt: cover.alt }],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { category: categorySlug, product: slug } = await params;
  const product = getProduct(categorySlug, slug);
  if (!product) notFound();

  const category = getCategory(categorySlug);
  if (!category) notFound();

  const site = getSite();
  const related = getRelatedProducts(product);
  const whatsapp = whatsappHref(productEnquiry(product.title));
  const specs = Object.entries(product.specs).filter(([, value]) => Boolean(value));

  return (
    <article className="pt-24 md:pt-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(product, site.domain, site.owner)) }}
      />

      <nav aria-label="Хлебные крошки" className="px-5 pb-6 text-sm md:px-8">
        <Link href="/catalog" className="link-underline eyebrow">
          Каталог
        </Link>
        <span className="eyebrow mx-2">/</span>
        <Link href={`/catalog/${category.slug}`} className="link-underline eyebrow">
          {category.title}
        </Link>
      </nav>

      <div className="grid gap-10 px-5 md:grid-cols-2 md:gap-14 md:px-8">
        <ProductGallery images={product.images} video={product.video} title={product.title} />

        <div className="md:pt-2">
          <h1 className="font-display text-3xl leading-tight md:text-5xl">{product.title}</h1>

          <p className="mt-3 text-xs tracking-[0.14em] text-muted uppercase">
            Артикул {product.article}
          </p>

          <p className="mt-6 max-w-prose text-sm leading-relaxed text-muted md:text-base">
            {product.description}
          </p>

          {specs.length > 0 ? (
            <dl className="mt-8 border-t border-sand">
              {specs.map(([key, value]) => (
                <div key={key} className="flex gap-6 border-b border-sand py-3">
                  <dt className="w-40 shrink-0 text-sm text-muted">{SPEC_LABELS[key] ?? key}</dt>
                  <dd className="text-sm">{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {whatsapp ? (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-9 inline-flex items-center justify-center border border-ink px-8 py-4 text-sm transition-colors duration-300 hover:bg-ink hover:text-surface"
            >
              Написать в WhatsApp
            </a>
          ) : null}
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-16 border-t border-sand pt-12 md:mt-24" aria-labelledby="related-heading">
          <h2 id="related-heading" className="px-5 font-display text-2xl md:px-8 md:text-4xl">
            Похожие изделия
          </h2>
          <ul className="frame-grid mt-6 grid-cols-2 md:grid-cols-4">
            {related.map((item) => (
              <li key={item.id} className="contents">
                <Tile
                  href={`/catalog/${item.category}/${item.slug}`}
                  title={item.title}
                  image={getCover(item)}
                  article={item.article}
                  className="aspect-[4/5]"
                  sizes="(min-width: 768px) 25vw, 50vw"
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}

function buildJsonLd(product: Product, domain: string, owner: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.images.map((image) => `${domain}${image.src}`),
    brand: { "@type": "Brand", name: owner },
    ...(product.price
      ? {
          offers: {
            "@type": "Offer",
            price: product.price,
            priceCurrency: "RUB",
            availability: "https://schema.org/InStock",
            url: `${domain}/catalog/${product.category}/${product.slug}`,
          },
        }
      : {}),
  };
}
