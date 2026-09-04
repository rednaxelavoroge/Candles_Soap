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
    return <div className="absolute inset-0 bg-transparent" aria-hidden="true" />;
  }

  const isContain = fit === "contain";

  return (
    <Image
      src={image.src}
      alt={image.alt}
      fill
      sizes={sizes}
      priority={priority}
      placeholder={isContain ? "empty" : "blur"}
      blurDataURL={isContain ? undefined : image.blurDataURL}
      style={{ objectFit: fit }}
      className={`${isContain ? "object-contain" : "object-cover"} ${className ?? ""}`}
      draggable={false}
    />
  );
}
