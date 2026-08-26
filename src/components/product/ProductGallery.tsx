"use client";

import { Media } from "@/components/ui/Media";
import type { ContentImage, Video } from "@/lib/schemas";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

type Slide =
  | { kind: "image"; image: ContentImage }
  | { kind: "video"; video: Video; poster: ContentImage };

const SWIPE_THRESHOLD = 40;

/**
 * Премиальная мультимедиа-галерея изделия:
 * - Крупный основной кадр со скругленными краями и мягкой тенью
 * - Произвольные пропорции миниатюр (горизонтальные и вертикальные кадры не обрезаются под жесткий квадрат)
 * - Поддержка видеороликов с бейджем воспроизведения
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
  const [mounted, setMounted] = useState<Set<number>>(() => new Set([0]));
  const pointerStart = useRef<number | null>(null);

  useEffect(() => {
    if (slides.length < 2) return;
    const prefetch = () => setMounted((known) => new Set(known).add(1));
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(prefetch, { timeout: 2500 })
      : window.setTimeout(prefetch, 1200);
    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle as number);
      else window.clearTimeout(idle as number);
    };
  }, [slides.length]);

  const go = useCallback(
    (next: number) => {
      setIndex((current) => {
        const target = next < 0 ? slides.length - 1 : next % slides.length;
        if (target === current) return current;
        setMounted((known) => {
          const grown = new Set(known);
          grown.add(target);
          grown.add((target + 1) % slides.length);
          return grown;
        });
        return target;
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

  const currentSlide = slides[index];
  const currentPoster = currentSlide.kind === "image" ? currentSlide.image : currentSlide.poster;
  const mainAspect = currentPoster?.width && currentPoster?.height
    ? `${currentPoster.width} / ${currentPoster.height}`
    : "4 / 5";

  return (
    <div className="flex flex-col gap-4">
      {/* Главный крупный кадр */}
      <div
        role="tabpanel"
        id={`slide-${index}`}
        aria-label={`${title}: кадр ${index + 1} из ${slides.length}`}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        style={{ aspectRatio: mainAspect }}
        className="relative w-full max-h-[70vh] touch-pan-y overflow-hidden rounded-2xl bg-sand/30 shadow-[0_4px_24px_rgba(62,43,32,0.06)] border border-sand/60 transition-all duration-500"
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
              mounted.has(slideIndex) ? (
                <Media
                  image={slide.image}
                  priority={slideIndex === 0}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                />
              ) : null
            ) : slideIndex === index ? (
              <VideoSlide video={slide.video} title={title} />
            ) : null}
          </div>
        ))}
      </div>

      {/* Лента миниатюр с естественными пропорциями и скруглениями */}
      {slides.length > 1 ? (
        <div
          role="tablist"
          aria-label="Ракурсы"
          className="no-scrollbar flex items-center gap-3 overflow-x-auto pb-2 pt-1"
        >
          {slides.map((slide, slideIndex) => {
            const selected = slideIndex === index;
            const poster = slide.kind === "image" ? slide.image : slide.poster;
            const thumbAspect = poster?.width && poster?.height
              ? `${poster.width} / ${poster.height}`
              : "4 / 5";

            return (
              <button
                key={slideIndex}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`slide-${slideIndex}`}
                onClick={() => go(slideIndex)}
                style={{ aspectRatio: thumbAspect }}
                className={`relative h-18 sm:h-20 shrink-0 overflow-hidden rounded-xl bg-sand transition-all duration-300 ${
                  selected
                    ? "ring-2 ring-btn-brown opacity-100 shadow-md scale-105"
                    : "opacity-60 hover:opacity-100 hover:scale-102 border border-sand/60"
                }`}
              >
                <Media image={poster} sizes="120px" />
                {slide.kind === "video" ? <PlayBadge /> : null}
                <span className="sr-only">
                  {slide.kind === "video" ? "Видео" : `Кадр ${slideIndex + 1}`}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function PlayBadge() {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-0 flex items-center justify-center bg-ink/35 backdrop-blur-[1px]"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md">
        <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4 fill-btn-brown">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </span>
  );
}

function VideoSlide({ video, title }: { video: Video; title: string }) {
  const [started, setStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  /*
    Ролик ждёт нажатия. Дальше важна тонкость, из-за которой звук пропадал.

    Раньше при нажатии на обложку элемент <video autoplay> только СОЗДАВАЛСЯ.
    Разрешение на звук браузер выдаёт элементу, который был на странице в
    момент нажатия, — а этот появлялся уже после, и включался приглушённым.

    Поэтому теперь элемент висит на странице с самого начала, обложка лежит
    поверх него картинкой, а нажатие вызывает play() прямо в обработчике.
    Нажатие и запуск оказываются одним действием, и звук остаётся.
  */
  const startFile = () => {
    setStarted(true);
    const el = videoRef.current;
    if (!el) return;
    el.muted = false;
    el.volume = 1;
    const attempt = el.play();
    // Если браузер всё же откажет со звуком — играем без него, но играем.
    if (attempt && typeof attempt.catch === "function") {
      attempt.catch(() => {
        el.muted = true;
        void el.play();
      });
    }
  };

  const cover = (onStart: () => void) => (
    <button
      type="button"
      onClick={onStart}
      className="absolute inset-0 z-10 h-full w-full group"
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
      <span
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center bg-ink/25 group-hover:bg-ink/40 transition-colors"
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 shadow-xl transition-transform duration-300 group-hover:scale-110">
          <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7 fill-btn-brown">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
    </button>
  );

  if (video.kind === "file") {
    return (
      <>
        <video
          ref={videoRef}
          controls={started}
          playsInline
          preload="metadata"
          poster={video.poster.src}
          onEnded={() => setStarted(false)}
          className="h-full w-full object-cover"
        >
          <source src={video.src} type="video/mp4" />
          <source src={video.src.replace(/\.mp4$/, ".webm")} type="video/webm" />
          Ваш браузер не поддерживает видео.
        </video>
        {started ? null : cover(startFile)}
      </>
    );
  }

  if (!started) {
    return cover(() => setStarted(true));
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
