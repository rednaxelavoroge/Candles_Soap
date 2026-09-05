import { BackstageTile } from "@/components/backstage/BackstageItem";
import { getBackstage, getText } from "@/lib/content";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: getText("backstage.title") || getText("backstage.eyebrow") || "Бэкстейдж",
  description: getText("seo.backstage"),
  openGraph: {
    title: getText("backstage.title") || getText("backstage.eyebrow") || "Бэкстейдж",
    description: getText("seo.backstage"),
  },
};

export default function BackstagePage() {
  const items = getBackstage();
  const eyebrow = getText("backstage.eyebrow");
  const title = getText("backstage.title");
  const lead = getText("backstage.lead");
  const toCatalog = getText("backstage.toCatalog");
  const toContacts = getText("backstage.toContacts");

  return (
    <div className="pt-24 md:pt-32">
      <header className="relative overflow-hidden px-5 pb-8 md:px-8 md:pb-12">
        {eyebrow ? <span className="eyebrow relative">{eyebrow}</span> : null}
        <h1 className="relative mt-2 max-w-3xl font-display text-4xl leading-tight text-ink md:text-6xl">
          {title || eyebrow || "Бэкстейдж"}
        </h1>
        {lead ? (
          <p className="relative mt-4 max-w-prose text-base leading-relaxed text-muted md:text-lg">
            {lead}
          </p>
        ) : null}
      </header>

      {items.length > 0 ? (
        <div className="px-5 md:px-8">
          <div className="columns-2 sm:columns-2 md:columns-3 lg:columns-4 gap-3.5 md:gap-6 [column-fill:_balance]">
            {items.map((item, index) => (
              <div key={index} className="mb-3.5 break-inside-avoid md:mb-6">
                <BackstageTile item={item} priority={index < 4} index={index} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="px-5 pb-16 text-sm text-muted md:px-8">{getText("backstage.empty")}</p>
      )}

      {toCatalog || toContacts ? (
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-14 md:px-8 md:py-20">
          {toCatalog ? (
            <Link href="/catalog" className="link-underline text-base font-medium text-ink">
              ← {toCatalog}
            </Link>
          ) : null}
          {toContacts ? (
            <Link href="/contacts" className="link-underline text-base text-muted hover:text-ink">
              {toContacts} →
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
