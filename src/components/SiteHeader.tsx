"use client";

import { getSite } from "@/lib/content";
import Link from "next/link";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/catalog", label: "Каталог" },
  { href: "/backstage", label: "Бэкстейдж" },
  { href: "/about", label: "Обо мне" },
  { href: "/contacts", label: "Контакты" },
];

export function SiteHeader() {
  const site = getSite();
  const [open, setOpen] = useState(false);

  // Меню на весь экран не должно оставлять страницу прокручиваемой под собой.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="absolute inset-x-0 top-0 z-40">
      <div className="flex items-center justify-between px-5 py-5 md:px-8 md:py-7">
        <Link href="/" className="font-display text-lg tracking-wide md:text-xl">
          {site.brand}
        </Link>

        <nav aria-label="Основная навигация" className="hidden gap-8 text-sm md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="link-underline">
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-sm tracking-wide md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
        >
          Меню
        </button>
      </div>

      {open ? (
        <div id="mobile-nav" className="fixed inset-0 z-50 flex flex-col bg-bg md:hidden">
          <div className="flex items-center justify-between px-5 py-5">
            <span className="font-display text-lg">{site.brand}</span>
            <button type="button" onClick={() => setOpen(false)} className="text-sm tracking-wide">
              Закрыть
            </button>
          </div>
          <nav aria-label="Основная навигация" className="flex flex-col gap-6 px-5 pt-10">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="font-display text-4xl"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
