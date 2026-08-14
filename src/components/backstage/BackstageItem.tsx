"use client";

import { Media } from "@/components/ui/Media";
import type { BackstageItem } from "@/lib/schemas";
import { useState } from "react";

/**
 * Плитка ленты бэкстейджа. Ролик до нажатия — это только постер и кнопка:
 * элемент video монтируется по клику, поэтому страница с полутора десятками
 * плиток не тянет ни одного видеопотока в первую загрузку.
 */
export function BackstageTile({ item, priority }: { item: BackstageItem; priority: boolean }) {
  const [playing, setPlaying] = useState(false);

  if (item.kind === "image") {
    return (
      <figure className="relative aspect-[4/5] overflow-hidden bg-sand">
        <Media image={item.image} priority={priority} sizes="(min-width: 768px) 33vw, 50vw" />
        <figcaption className="sr-only">{item.caption}</figcaption>
      </figure>
    );
  }

  return (
    <figure className="relative aspect-[4/5] overflow-hidden bg-ink">
      {playing ? (
        <video
          controls
          autoPlay
          playsInline
          loop
          muted
          poster={item.poster.src}
          className="h-full w-full object-cover"
        >
          {/* mp4 первым: Safari умеет только его. webm — запасной вариант для
              сборок Chromium без проприетарных кодеков. */}
          <source src={item.src} type="video/mp4" />
          <source src={item.src.replace(/\.mp4$/, ".webm")} type="video/webm" />
          Ваш браузер не поддерживает видео.
        </video>
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="absolute inset-0 h-full w-full"
          aria-label={`Смотреть: ${item.caption}`}
        >
          <Media image={item.poster} priority={priority} sizes="(min-width: 768px) 33vw, 50vw" />
          <span
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center bg-ink/25"
          >
            <svg viewBox="0 0 24 24" className="h-12 w-12 fill-surface">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      )}
      <figcaption className="sr-only">{item.caption}</figcaption>
    </figure>
  );
}
