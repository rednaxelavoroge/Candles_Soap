import type { ContentImage } from "@/lib/schemas";
import Image from "next/image";

type MediaProps = {
  image: ContentImage | null;
  sizes: string;
  priority?: boolean;
  className?: string;
  fit?: "cover" | "contain";
};

/**
 * Изображение внутри плитки фиксированных пропорций: родитель задаёт размер и
 * position: relative, снимок растягивается по нему. Пока категория без обложки,
 * плитка остаётся песочным прямоугольником — макет не разъезжает.
 */
export function Media({ image, sizes, priority = false, className, fit = "cover" }: MediaProps) {
  if (!image) {
    return <div className="absolute inset-0 bg-sand" aria-hidden="true" />;
  }

  return (
    <Image
      src={image.src}
      alt={image.alt}
      fill
      sizes={sizes}
      priority={priority}
      placeholder="blur"
      blurDataURL={image.blurDataURL}
      className={`${fit === "contain" ? "object-contain" : "object-cover"} ${className ?? ""}`}
      draggable={false}
    />
  );
}
