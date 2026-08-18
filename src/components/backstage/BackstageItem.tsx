"use client";

import { Media } from "@/components/ui/Media";
import type { BackstageItem } from "@/lib/schemas";
import { useState } from "react";

export function BackstageTile({
  item,
  priority,
  index = 0,
}: {
  item: BackstageItem;
  priority: boolean;
  index?: number;
}) {
  const [playing, setPlaying] = useState(false);

  const imageObj = item.kind === "image" ? item.image : item.poster;
  const aspectRatio = imageObj?.width && imageObj?.height
    ? `${imageObj.width} / ${imageObj.height}`
    : "4 / 5";

  if (item.kind === "image") {
    return (
      <figure
        style={{ aspectRatio }}
        className="group relative w-full overflow-hidden rounded-2xl bg-sand/30 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-500 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5"
      >
        <div className="tile-zoom absolute inset-0">
          <Media image={item.image} priority={priority} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/60 via-ink/20 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="font-display text-sm font-medium text-white drop-shadow-sm">
            {item.caption}
          </span>
        </div>
        <figcaption className="sr-only">{item.caption}</figcaption>
      </figure>
    );
  }

  return (
    <figure
      style={{ aspectRatio }}
      className="group relative w-full overflow-hidden rounded-2xl bg-ink shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-500 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:-translate-y-0.5"
    >
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
            <Media image={item.poster} priority={priority} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
          </div>
          
          {/* Плашка с бейджем видео */}
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/70 px-3 py-1 text-[0.6875rem] font-medium tracking-wider text-white uppercase backdrop-blur-sm shadow-sm">
              <span className="block h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              <span>Видео</span>
            </span>
          </div>

          <span
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center bg-ink/25 transition-colors group-hover:bg-ink/40"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-xl backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
              <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6 fill-ink">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </span>

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 via-ink/25 to-transparent p-4 text-left">
            <span className="font-display text-sm font-medium text-white drop-shadow-sm">
              {item.caption}
            </span>
          </div>
        </button>
      )}
      <figcaption className="sr-only">{item.caption}</figcaption>
    </figure>
  );
}
