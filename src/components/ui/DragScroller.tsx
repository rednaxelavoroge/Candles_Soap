"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Горизонтальная лента. На мобиле работает нативный свайп с инерцией, на
 * десктопе поверх него включается перетаскивание мышью. Клик по карточке
 * после протаскивания подавляется, иначе каждый драг заканчивался бы переходом.
 */
export function DragScroller({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let dragging = false;
    let moved = false;
    let startX = 0;
    let startScroll = 0;

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      dragging = true;
      moved = false;
      startX = event.clientX;
      startScroll = element.scrollLeft;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      const delta = event.clientX - startX;
      if (!moved && Math.abs(delta) > 4) {
        moved = true;
        element.setPointerCapture(event.pointerId);
      }
      if (moved) element.scrollLeft = startScroll - delta;
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      if (element.hasPointerCapture(event.pointerId)) {
        element.releasePointerCapture(event.pointerId);
      }
    };

    const onClick = (event: MouseEvent) => {
      if (!moved) return;
      event.preventDefault();
      event.stopPropagation();
      moved = false;
    };

    element.addEventListener("pointerdown", onPointerDown);
    element.addEventListener("pointermove", onPointerMove);
    element.addEventListener("pointerup", onPointerUp);
    element.addEventListener("pointercancel", onPointerUp);
    element.addEventListener("click", onClick, true);
    element.style.cursor = "grab";

    return () => {
      element.removeEventListener("pointerdown", onPointerDown);
      element.removeEventListener("pointermove", onPointerMove);
      element.removeEventListener("pointerup", onPointerUp);
      element.removeEventListener("pointercancel", onPointerUp);
      element.removeEventListener("click", onClick, true);
      element.style.cursor = "";
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`no-scrollbar overflow-x-auto overscroll-x-contain ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
