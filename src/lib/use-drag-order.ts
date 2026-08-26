"use client";

import { useState } from "react";
import type { DragEvent } from "react";

/**
 * Перетаскивание мышью для списков в панели.
 *
 * Стрелками «выше — ниже» заказчица двигать отказалась: «стрелками умру по 1
 * передвигать всё». Здесь она берёт карточку мышью и роняет туда, где нужно.
 * Стрелки при этом остаются: на телефоне перетаскивания нет — браузер под
 * пальцем начинает прокрутку страницы, а не перенос, — и там двигают ими.
 *
 * Порядок сохраняется тем же обработчиком, что и у стрелок: сюда передаётся
 * функция «перенести с позиции на позицию», а она уже пишет на сервер.
 */
export function useDragOrder(onMove: (from: number, to: number) => void, enabled = true) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const reset = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  function itemProps(index: number) {
    if (!enabled) return {};
    return {
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
        if (overIndex !== index) setOverIndex(index);
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
    if (dragIndex === index) return "opacity-40";
    if (overIndex === index) return "ring-2 ring-btn-brown ring-offset-2 ring-offset-surface";
    return "";
  }

  return { itemProps, itemClass, dragging: dragIndex !== null };
}

/** Список с элементом, перенесённым с одной позиции на другую. */
export function withMoved<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
