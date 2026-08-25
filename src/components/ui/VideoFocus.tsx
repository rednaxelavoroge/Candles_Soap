"use client";

import { useEffect } from "react";

/**
 * Одно видео за раз.
 *
 * В бэкстейдже полтора десятка роликов на одной странице. Запустив второй, не
 * остановив первый, слышишь обе музыки сразу — заказчица поймала это первым же
 * делом. Слушаем `play` на фазе перехвата: событие не всплывает, поэтому иначе
 * до документа оно не доходит.
 */
export function VideoFocus() {
  useEffect(() => {
    const onPlay = (event: Event) => {
      const started = event.target;
      if (!(started instanceof HTMLVideoElement)) return;
      for (const video of document.querySelectorAll("video")) {
        if (video !== started && !video.paused) video.pause();
      }
    };

    document.addEventListener("play", onPlay, true);
    return () => document.removeEventListener("play", onPlay, true);
  }, []);

  return null;
}
