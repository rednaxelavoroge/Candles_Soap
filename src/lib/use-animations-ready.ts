"use client";

import { useEffect, useLayoutEffect, useState } from "react";

/**
 * Разметка приходит с сервера видимой, анимации включаются на клиенте.
 *
 * Так решается требование Яндекс Старта и Яндекса с Алисой: если скрипты не
 * отработают, страница всё равно читается, потому что в HTML нет `opacity: 0`.
 * Прежняя попытка гасила `initial` до монтирования и тем самым убивала саму
 * анимацию: Framer Motion читает `initial` только в момент монтирования и
 * позже его не замечает — половины оставались стоять по центру.
 *
 * Поэтому блок, который анимируется, получает `key` от этого значения: когда
 * оно переключается, блок пересоздаётся, и `initial` наконец применяется.
 * Переключение живёт в layout-эффекте, то есть срабатывает до первой отрисовки —
 * подмены на глазах не видно.
 */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function useAnimationsReady(): boolean {
  const [ready, setReady] = useState(false);

  useIsomorphicLayoutEffect(() => {
    setReady(true);
  }, []);

  return ready;
}
