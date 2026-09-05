import { ProductGallery } from "@/components/product/ProductGallery";
import { Tile } from "@/components/ui/Tile";
import {
  getCategory,
  getCover,
  getProduct,
  getProducts,
  getRelatedProducts,
  getSite,
  getText,
  productVideos,
} from "@/lib/content";
import { productEnquiry, whatsappWith } from "@/lib/contacts";
import type { Product } from "@/lib/schemas";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Params = { category: string; product: string };

/** Подписи характеристик правятся в панели («Карточка изделия»). */
function specLabel(key: string): string {
  const known = ["size", "scent", "composition", "burnTime", "weight"];
  return known.includes(key) ? getText(`product.spec.${key}`) || key : key;
}

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
    title: `${product.title} (арт. ${product.article})`,
    description: product.description,
    openGraph: {
      type: "article",
      title: `${product.title} — ${getSite().brand}`,
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
  const whatsapp = whatsappWith(productEnquiry(product.title));
  const specs = Object.entries(product.specs).filter(([, value]) => Boolean(value));
  const articleLabel = getText("product.articleLabel");
  const noteTitle = getText("product.noteTitle");
  const noteText = getText("product.noteText");
  const leadTime = getText("product.leadTime");
  const whatsappButton = getText("common.whatsappButton");
  const backButton = getText("product.backButton");
  const relatedTitle = getText("product.relatedTitle");
  const relatedAll = getText("product.relatedAll");
  const catalogLabel = getText("nav.catalog") || "Каталог";

  return (
    <article className="pt-24 md:pt-32 w-full max-w-full overflow-x-clip">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(product, site.domain, site.owner)) }}
      />

      {/* Навигация / Хлебные крошки */}
      <nav aria-label="Хлебные крошки" className="px-5 pb-6 text-sm md:px-8">
        <Link href="/catalog" className="link-underline eyebrow">
          {catalogLabel}
        </Link>
        <span className="eyebrow mx-2">/</span>
        <Link href={`/catalog/${category.slug}`} className="link-underline eyebrow">
          {category.title}
        </Link>
        <span className="eyebrow mx-2">/</span>
        <span className="eyebrow text-ink">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 px-5 md:grid-cols-2 md:gap-14 md:px-8 w-full min-w-0 max-w-full">
        {/* Медиа-галерея (фото в ракурсах + видео) */}
        <div className="w-full min-w-0 max-w-full">
          <ProductGallery images={product.images} videos={productVideos(product)} title={product.title} />
        </div>

        {/* Описание изделия и характеристики */}
        <div className="flex flex-col justify-start md:pt-2 w-full min-w-0 max-w-full">
          <span className="text-sm font-medium tracking-[0.06em] text-accent">
            {category.title}
          </span>
          <h1 className="mt-2 font-display text-3xl leading-tight text-ink md:text-5xl">
            {product.title}
          </h1>

          <p className="mt-3 text-xs font-medium tracking-[0.03em] text-muted">
            {articleLabel ? `${articleLabel} ` : ""}{product.article}
          </p>

          <p className="mt-6 max-w-prose text-base leading-relaxed text-muted md:text-lg">
            {product.description}
          </p>

          {specs.length > 0 ? (
            <dl className="mt-8 divide-y divide-sand border-y border-sand">
              {specs.map(([key, value]) => (
                <div key={key} className="flex justify-between gap-6 py-3.5 text-sm">
                  <dt className="text-muted">{specLabel(key)}</dt>
                  <dd className="font-medium text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {/* Плашка о ручной работе и сроке — тексты из панели, пустые не выводятся */}
          {noteTitle || noteText || leadTime ? (
            <div className="mt-6 rounded-lg bg-surface p-4 text-xs leading-relaxed text-muted border border-sand/60">
              {noteTitle || noteText ? (
                <p>
                  ✨ {noteTitle ? <strong>{noteTitle}</strong> : null}
                  {noteTitle && noteText ? " " : ""}
                  {noteText}
                </p>
              ) : null}
              {leadTime ? <p className={noteTitle || noteText ? "mt-2 text-muted/80" : "text-muted/80"}>{leadTime}</p> : null}
            </div>
          ) : null}

          {/* Кнопка заказа в WhatsApp */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            {whatsapp && whatsappButton ? (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 rounded-full btn-brown px-9 py-4 text-xs font-semibold tracking-[0.04em] shadow-md"
              >
                <span>{whatsappButton}</span>
                <span>→</span>
              </a>
            ) : null}

            {backButton ? (
              <Link
                href={`/catalog/${category.slug}`}
                className="inline-flex items-center gap-2 border border-sand bg-surface px-6 py-4 text-sm tracking-wide text-ink transition-all duration-300 hover:border-ink"
              >
                {backButton}
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {/* Похожие изделия */}
      {related.length > 0 ? (
        <section className="mt-20 border-t border-sand pt-12 md:mt-28" aria-labelledby="related-heading">
          <div className="flex items-center justify-between px-5 md:px-8">
            <h2 id="related-heading" className="font-display text-2xl md:text-4xl">
              {relatedTitle}
            </h2>
            {relatedAll ? (
              <Link href={`/catalog/${category.slug}`} className="link-underline text-sm text-muted hover:text-ink">
                {relatedAll} →
              </Link>
            ) : null}
          </div>
          <ul className="frame-grid mt-8 grid-cols-2 md:grid-cols-4">
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
  };
}
