"use client";

import { Media } from "@/components/ui/Media";
import type { ContentImage, Video } from "@/lib/schemas";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";

type Slide =
  | { kind: "image"; image: ContentImage }
  | { kind: "video"; video: Video; poster: ContentImage };

const SWIPE_THRESHOLD = 40;

/**
 * Галерея ракурсов: крупный кадр и лента миниатюр — вертикальная на десктопе,
 * горизонтальная на узком экране. Переключение фейдом, свайп пальцем,
 * стрелки с клавиатуры. Видео живёт отдельным слотом в той же ленте.
 *
 * Кадры отрисованы все сразу и переключаются opacity: так переход остаётся
 * на композиторе и не дёргает layout. Плеер монтируется только когда его
 * слайд стал активным, чтобы ничего не тянуть в первую загрузку.
 */
export function ProductGallery({
  images,
  video,
  title,
}: {
  images: ContentImage[];
  video: Video | null;
  title: string;
}) {
  const slides: Slide[] = [
    ...images.map((image) => ({ kind: "image" as const, image })),
    ...(video ? [{ kind: "video" as const, video, poster: video.poster }] : []),
  ];

  const [index, setIndex] = useState(0);
  const pointerStart = useRef<number | null>(null);

  const go = useCallback(
    (next: number) => {
      setIndex((current) => {
        const target = next < 0 ? slides.length - 1 : next % slides.length;
        return target === current ? current : target;
      });
    },
    [slides.length],
  );

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      go(index + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      go(index - 1);
    }
  };

  const onPointerDown = (event: React.PointerEvent) => {
    if (event.pointerType === "mouse") return;
    pointerStart.current = event.clientX;
  };

  const onPointerUp = (event: React.PointerEvent) => {
    if (pointerStart.current === null) return;
    const delta = event.clientX - pointerStart.current;
    pointerStart.current = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    go(delta < 0 ? index + 1 : index - 1);
  };

  return (
    <div className="flex flex-col gap-3 md:flex-row-reverse md:gap-5">
      <div
        role="tabpanel"
        id={`slide-${index}`}
        aria-label={`${title}: кадр ${index + 1} из ${slides.length}`}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        className="relative aspect-[4/5] w-full touch-pan-y overflow-hidden bg-sand md:flex-1"
      >
        {slides.map((slide, slideIndex) => (
          <div
            key={slideIndex}
            aria-hidden={slideIndex !== index}
            className={`absolute inset-0 transition-opacity duration-500 ease-out ${
              slideIndex === index ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            {slide.kind === "image" ? (
              <Media
                image={slide.image}
                priority={slideIndex === 0}
                sizes="(min-width: 768px) 50vw, 100vw"
              />
            ) : slideIndex === index ? (
              <VideoSlide video={slide.video} title={title} />
            ) : null}
          </div>
        ))}
      </div>

      <div
        role="tablist"
        aria-label="Ракурсы"
        aria-orientation="vertical"
        className="no-scrollbar flex gap-3 overflow-x-auto md:w-20 md:flex-col md:overflow-x-visible md:overflow-y-auto lg:w-24"
      >
        {slides.map((slide, slideIndex) => {
          const selected = slideIndex === index;
          const poster = slide.kind === "image" ? slide.image : slide.poster;
          return (
            <button
              key={slideIndex}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`slide-${slideIndex}`}
              onClick={() => go(slideIndex)}
              className={`relative aspect-square w-16 shrink-0 overflow-hidden bg-sand transition-opacity duration-300 md:w-full ${
                selected ? "opacity-100" : "opacity-55 hover:opacity-100"
              }`}
            >
              <Media image={poster} sizes="96px" />
              {slide.kind === "video" ? <PlayBadge /> : null}
              <span className="sr-only">
                {slide.kind === "video" ? "Видео" : `Кадр ${slideIndex + 1}`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PlayBadge() {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-0 flex items-center justify-center bg-ink/25"
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7 fill-surface">
        <path d="M8 5v14l11-7z" />
      </svg>
    </span>
  );
}

/**
 * Локальный файл играем сразу с постером. Внешний ролик до клика — это только
 * картинка и кнопка: iframe плеера монтируется по нажатию, поэтому YouTube и
 * Vimeo не попадают в первую загрузку страницы.
 */
function VideoSlide({ video, title }: { video: Video; title: string }) {
  const [started, setStarted] = useState(false);

  if (video.kind === "file") {
    return (
      <video
        controls
        preload="none"
        poster={video.poster.src}
        className="h-full w-full object-cover"
      >
        <source src={video.src} />
        Ваш браузер не поддерживает видео.
      </video>
    );
  }

  if (!started) {
    return (
      <button
        type="button"
        onClick={() => setStarted(true)}
        className="absolute inset-0 h-full w-full"
        aria-label={`Смотреть видео: ${title}`}
      >
        <Image
          src={video.poster.src}
          alt={video.poster.alt}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          placeholder="blur"
          blurDataURL={video.poster.blurDataURL}
          className="object-cover"
        />
        <PlayBadge />
      </button>
    );
  }

  const src =
    video.kind === "youtube"
      ? `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`
      : `https://player.vimeo.com/video/${video.id}?autoplay=1`;

  return (
    <iframe
      src={src}
      title={`Видео: ${title}`}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className="h-full w-full border-0"
    />
  );
}
