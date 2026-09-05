import { getText } from "@/lib/content";
import Link from "next/link";

/** Страница «не найдено» на языке сайта, вместо английской заглушки Next. */
export default function NotFound() {
  return (
    <div className="px-5 pt-32 pb-24 md:px-8 md:pt-40">
      <span className="eyebrow">404</span>
      <h1 className="mt-2 font-display text-4xl leading-tight text-ink md:text-6xl">
        Такой страницы нет
      </h1>
      <p className="mt-4 max-w-prose text-base leading-relaxed text-muted md:text-lg">
        Возможно, изделие переименовали или ссылка устарела.
      </p>
      <Link
        href="/catalog"
        className="mt-8 inline-flex items-center gap-2.5 rounded-full btn-brown px-7 py-3 text-xs font-semibold tracking-[0.03em] shadow-md"
      >
        <span>{getText("nav.catalog") || "Каталог"}</span>
        <span>→</span>
      </Link>
    </div>
  );
}
