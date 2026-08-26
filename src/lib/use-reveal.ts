"use client";

import { useEffect, useRef, useState } from "react";

/**
 * «Показать, когда доехало до экрана» — но так, чтобы блок не остался
 * невидимым, если слежение за прокруткой почему-то не работает.
 *
 * Зачем свой велосипед вместо whileInView у framer-motion. У заказчицы в
 * мобильном Яндекс Браузере часть главной оставалась пустой: заголовок и
 * подпись на месте, а плитки под ними — белое поле. Разметка приходит с
 * opacity: 0 и открывается по сигналу от наблюдателя за прокруткой; сигнала
 * не приходило, и блок так и стоял невидимым. Страховка на случай «скрипты
 * не доехали» тут не срабатывает: скрипты как раз доехали.
 *
 * Поэтому три независимых пути. Наблюдатель — обычный путь. Проверка
 * положения на прокрутке — если наблюдателя нет или он молчит. И срок:
 * через полторы секунды после появления на странице блок показывается сам,
 * если он уже в пределах экрана. Любой из трёх открывает блок, и пустого
 * места не остаётся ни при каком раскладе.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let done = false;
    const show = () => {
      if (done) return;
      done = true;
      setShown(true);
    };

    // Блок виден, если его верх зашёл в экран, а низ ещё не ушёл вверх.
    const nearScreen = () => {
      const box = el.getBoundingClientRect();
      const height = window.innerHeight || document.documentElement.clientHeight;
      return box.top < height * 0.92 && box.bottom > 0;
    };

    const check = () => {
      if (nearScreen()) {
        show();
        cleanup();
      }
    };

    let observer: IntersectionObserver | null = null;
    let timer: number | undefined;

    const cleanup = () => {
      observer?.disconnect();
      observer = null;
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
      if (timer) window.clearTimeout(timer);
    };

    if (nearScreen()) {
      show();
      return cleanup;
    }

    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            show();
            cleanup();
          }
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.15 },
      );
      observer.observe(el);
    }

    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    timer = window.setTimeout(check, 1500);

    return cleanup;
  }, []);

  return { ref, shown };
}
