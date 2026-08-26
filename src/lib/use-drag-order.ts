"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { DragEvent } from "react";

/** Сколько держать палец, прежде чем карточка «прилипнет». */
const HOLD_MS = 350;
/** Насколько можно шевельнуть пальцем за это время, не отменив захват. */
const HOLD_SLOP = 12;
/** Полоса у края экрана, в которой страница подкручивается сама. */
const EDGE = 90;

/**
 * Перетаскивание списков в панели — мышью и пальцем.
 *
 * Стрелками «выше — ниже» заказчица двигать отказалась: «стрелками умру по 1
 * передвигать всё». Мышью карточка берётся и роняется куда нужно.
 *
 * На телефоне обычное перетаскивание браузеру недоступно: движение пальца по
 * странице — это прокрутка. Поэтому здесь то, что заказчица и описала:
 * нажать и подержать (около трети секунды) — карточка приподнимается и
 * дальше едет за пальцем; отпустил — встала. Пока палец держат меньше этого
 * времени или сразу ведут вбок, страница прокручивается как обычно, иначе
 * листать список стало бы невозможно.
 *
 * Куда попадём — определяется тем, что под пальцем: каждая карточка помечена
 * номером (`data-drag-index`) и меткой своего списка, и под пальцем ищется
 * ближайшая такая карточка. Поэтому хук не требует ссылок на элементы и
 * одинаково работает и в ряду фотографий, и в столбце строк.
 *
 * Порядок сохраняется тем же обработчиком, что и у стрелок: сюда передаётся
 * функция «перенести с позиции на позицию», а она уже пишет на сервер.
 */
export function useDragOrder(onMove: (from: number, to: number) => void, enabled = true) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  /** Палец ведёт карточку: в этом состоянии прокрутка страницы запрещена. */
  const [touchDragging, setTouchDragging] = useState(false);

  // Метка списка: у каждого вызова хука своя, чтобы соседние списки на одной
  // странице не перехватывали друг у друга карточки.
  const listId = useId();

  // Живые значения для обработчиков: они навешиваются один раз, а состояние
  // меняется — через ссылки они всегда видят свежее.
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const overRef = useRef<number | null>(null);

  const reset = () => {
    overRef.current = null;
    setDragIndex(null);
    setOverIndex(null);
    setTouchDragging(false);
  };

  /* --- Палец --- */
  useEffect(() => {

    let holdTimer: number | undefined;
    let startX = 0;
    let startY = 0;
    let from: number | null = null;
    let active = false;
    let scroller: number | undefined;
    let lastY = 0;

    /*
      Что под пальцем. Ищем ближайшую помеченную карточку и сверяем метку
      списка отдельно: собирать её в селектор нельзя — React выдаёт метки со
      знаками, которые в селекторе приходится экранировать, и совпадение
      ломается. Простое сравнение строк надёжнее.
    */
    const indexUnder = (x: number, y: number): number | null => {
      const el = document.elementFromPoint(x, y);
      const card = el?.closest<HTMLElement>("[data-drag-index]");
      if (!card || card.dataset.dragList !== listId) return null;
      const value = Number(card.dataset.dragIndex);
      return Number.isFinite(value) ? value : null;
    };

    const stopScroller = () => {
      if (scroller) window.clearInterval(scroller);
      scroller = undefined;
    };

    const finish = () => {
      window.clearTimeout(holdTimer);
      stopScroller();
      active = false;
      from = null;
      reset();
    };

    const onStart = (e: TouchEvent) => {
      if (!enabledRef.current || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const index = indexUnder(touch.clientX, touch.clientY);
      if (index === null) return;

      startX = touch.clientX;
      startY = touch.clientY;
      lastY = touch.clientY;
      from = index;

      holdTimer = window.setTimeout(() => {
        active = true;
        setDragIndex(index);
        setTouchDragging(true);
        // Короткий отклик, если телефон умеет: понятно, что карточка взята.
        navigator.vibrate?.(12);

        // Пока карточку ведут, страница подкручивается сама у краёв экрана —
        // иначе длинный список пальцем не пройти.
        scroller = window.setInterval(() => {
          if (lastY < EDGE) window.scrollBy(0, -14);
          else if (lastY > window.innerHeight - EDGE) window.scrollBy(0, 14);
        }, 16);
      }, HOLD_MS);
    };

    const onMoveTouch = (e: TouchEvent) => {
      if (from === null) return;
      const touch = e.touches[0];
      if (!touch) return;

      if (!active) {
        // Повели раньше, чем карточка успела прилипнуть, — это прокрутка.
        if (Math.abs(touch.clientX - startX) > HOLD_SLOP || Math.abs(touch.clientY - startY) > HOLD_SLOP) {
          window.clearTimeout(holdTimer);
          from = null;
        }
        return;
      }

      // Карточка взята: движение принадлежит ей, а не странице.
      e.preventDefault();
      lastY = touch.clientY;
      const over = indexUnder(touch.clientX, touch.clientY);
      const target = over === from ? null : over;
      overRef.current = target;
      setOverIndex(target);
    };

    const onEnd = () => {
      const to = overRef.current;
      if (active && from !== null && to !== null && to !== from) {
        onMoveRef.current(from, to);
      }
      finish();
    };

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMoveTouch, { passive: false });
    document.addEventListener("touchend", onEnd);
    document.addEventListener("touchcancel", finish);
    return () => {
      window.clearTimeout(holdTimer);
      stopScroller();
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMoveTouch);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", finish);
    };
  }, [listId]);

  function itemProps(index: number) {
    if (!enabled) return {};
    return {
      "data-drag-list": listId,
      "data-drag-index": index,
      draggable: true,
      onDragStart: (e: DragEvent<HTMLElement>) => {
        setDragIndex(index);
        e.dataTransfer.effectAllowed = "move";
        // Firefox не начинает перенос, пока в него что-нибудь не положишь.
        try {
          e.dataTransfer.setData("text/plain", String(index));
        } catch {
          /* некоторым браузерам это не нравится — перенос всё равно идёт */
        }
      },
      onDragOver: (e: DragEvent<HTMLElement>) => {
        if (dragIndex === null || dragIndex === index) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (overIndex !== index) {
          overRef.current = index;
          setOverIndex(index);
        }
      },
      onDragLeave: () => {
        setOverIndex((prev) => (prev === index ? null : prev));
      },
      onDrop: (e: DragEvent<HTMLElement>) => {
        e.preventDefault();
        if (dragIndex !== null && dragIndex !== index) onMove(dragIndex, index);
        reset();
      },
      onDragEnd: reset,
    };
  }

  /** Подсветка: что несём и куда уроним. */
  function itemClass(index: number) {
    if (!enabled) return "";
    if (dragIndex === index) {
      // Пальцем карточку ещё и приподнимаем — видно, что она «взята».
      return touchDragging
        ? "scale-105 opacity-90 shadow-lg ring-2 ring-btn-brown z-20"
        : "opacity-40";
    }
    if (overIndex === index) return "ring-2 ring-btn-brown ring-offset-2 ring-offset-surface";
    return "";
  }

  return { itemProps, itemClass, dragging: dragIndex !== null, touchDragging };
}

/** Список с элементом, перенесённым с одной позиции на другую. */
export function withMoved<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
