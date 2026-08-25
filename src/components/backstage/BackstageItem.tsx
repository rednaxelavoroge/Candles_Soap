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
        className="group relative w-full overflow-hidden rounded-xl md:rounded-2xl bg-sand/30 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-500 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5"
      >
        <div className="tile-zoom absolute inset-0">
          <Media image={item.image} priority={priority} sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" />
        </div>
      </figure>
    );
  }

  return (
    <figure
      style={{ aspectRatio }}
      className="group relative w-full overflow-hidden rounded-xl md:rounded-2xl bg-ink shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-500 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:-translate-y-0.5"
    >
      {playing ? (
        /*
          Ролик включают кликом, поэтому запускаем его со звуком: беззвучное
          видео в ленте про мастерскую бессмысленно, а кому звук не нужен —
          выключит его в самом плеере. Зацикливания нет намеренно: кадры
          крутились по кругу и накладывались друг на друга. После конца
          возвращаемся к обложке — так видно, что ролик закончился.
        */
        <video
          controls
          autoPlay
          playsInline
          onEnded={() => setPlaying(false)}
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
          aria-label="Смотреть видео процесса"
        >
          <div className="tile-zoom absolute inset-0">
            <Media image={item.poster} priority={priority} sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" />
          </div>
          
          {/* Плашка с бейджем видео */}
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/75 px-2.5 py-1 text-[0.625rem] font-medium tracking-wider text-white uppercase backdrop-blur-sm shadow-sm">
              <span className="block h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              <span>Видео</span>
            </span>
          </div>

          <span
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center bg-ink/20 transition-colors group-hover:bg-ink/35"
          >
            <span className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-white/90 shadow-xl backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
              <svg viewBox="0 0 24 24" className="ml-0.5 md:ml-1 h-5 w-5 md:h-6 md:w-6 fill-ink">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </span>
        </button>
      )}
    </figure>
  );
}
