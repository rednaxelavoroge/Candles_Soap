"use client";

import { Media } from "@/components/ui/Media";
import type { BackstageItem } from "@/lib/schemas";
import { useState } from "react";

export function BackstageTile({
  item,
  priority,
  className = "aspect-[4/5]",
}: {
  item: BackstageItem;
  priority: boolean;
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);

  if (item.kind === "image") {
    return (
      <figure className={`relative overflow-hidden rounded-xl bg-sand shadow-sm transition-all duration-300 hover:shadow-md ${className}`}>
        <div className="tile-zoom absolute inset-0">
          <Media image={item.image} priority={priority} sizes="(min-width: 768px) 33vw, 50vw" />
        </div>
        <figcaption className="sr-only">{item.caption}</figcaption>
      </figure>
    );
  }

  return (
    <figure className={`relative overflow-hidden rounded-xl bg-ink shadow-sm transition-all duration-300 hover:shadow-md ${className}`}>
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
          <source src={item.src} type="video/mp4" />
          <source src={item.src.replace(/\.mp4$/, ".webm")} type="video/webm" />
          Ваш браузер не поддерживает видео.
        </video>
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 h-full w-full"
          aria-label={`Смотреть видео: ${item.caption}`}
        >
          <div className="tile-zoom absolute inset-0">
            <Media image={item.poster} priority={priority} sizes="(min-width: 768px) 33vw, 50vw" />
          </div>
          <span
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center bg-ink/30 transition-colors group-hover:bg-ink/45"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
              <svg viewBox="0 0 24 24" className="ml-0.5 h-6 w-6 fill-ink">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </span>
        </button>
      )}
      <figcaption className="sr-only">{item.caption}</figcaption>
    </figure>
  );
}
