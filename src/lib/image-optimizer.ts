/**
 * Автоматическое сжатие и оптимизация фото перед отправкой на сервер:
 * - Масштабирует огромные фото с камеры смартфона (4000x3000px) до оптимальных 1400px
 * - Конвертирует в современный формат WebP с качеством 85% (уменьшает размер в 10–20 раз без потери четкости)
 * - Автоматически генерирует микро-превью (blurDataURL) для мгновенной мягкой загрузки
 */
export async function optimizeImageClient(
  file: File,
  maxDimension = 1400,
  quality = 0.85,
): Promise<{
  dataUrl: string;
  width: number;
  height: number;
  blurDataURL: string;
  blob: Blob;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.naturalWidth;
        let height = img.naturalHeight;

        // Рассчитываем пропорциональный размер
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        // 1. Создаем основной оптимизированный Canvas
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Не удалось получить контекст canvas"));
          return;
        }

        // Сглаживание при рендере
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // 2. Генерируем миниатюрный blurDataURL (16px)
        const blurCanvas = document.createElement("canvas");
        blurCanvas.width = 16;
        blurCanvas.height = Math.round((16 * height) / width) || 16;
        const blurCtx = blurCanvas.getContext("2d");
        if (blurCtx) {
          blurCtx.imageSmoothingEnabled = true;
          blurCtx.drawImage(canvas, 0, 0, blurCanvas.width, blurCanvas.height);
        }
        const blurDataURL = blurCanvas.toDataURL("image/webp", 0.4);

        // 3. Экспортируем в WebP
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Ошибка конвертации изображения"));
              return;
            }
            const dataUrl = canvas.toDataURL("image/webp", quality);
            resolve({
              dataUrl,
              width,
              height,
              blurDataURL,
              blob,
            });
          },
          "image/webp",
          quality,
        );
      };
      img.onerror = () => reject(new Error("Не удалось загрузить изображение"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Ошибка чтения файла"));
    reader.readAsDataURL(file);
  });
}
