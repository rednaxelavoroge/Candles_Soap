"use client";

import { getSite } from "@/lib/content";
import Link from "next/link";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/catalog", label: "Каталог" },
  { href: "/backstage", label: "Бэкстейдж" },
  { href: "/about", label: "О мастере" },
  { href: "/contacts", label: "Контакты" },
];

export function SiteHeader() {
  const site = getSite();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Блокируем скролл страницы под открытым меню
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
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
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
        scrolled
          ? "bg-[#f7f3ed]/90 backdrop-blur-md py-4 border-b border-sand/40 shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
          : "bg-transparent py-5 md:py-8"
      }`}
    >
      <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 md:px-8">
        <Link
          href="/"
          className="font-display text-lg font-medium tracking-wider text-ink transition-transform duration-300 hover:scale-105 md:text-xl"
        >
          {site.brand}
        </Link>

        <nav aria-label="Основная навигация" className="hidden items-center gap-10 text-sm font-medium tracking-wide md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative text-ink/85 transition-colors duration-300 hover:text-ink after:absolute after:bottom-[-4px] after:left-0 after:h-px after:w-0 after:bg-btn-brown after:transition-all after:duration-300 hover:after:w-full"
            >
              {item.label}
            </Link>
          ))}
          <a
            href="https://wa.me/37498033550"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full btn-brown px-5 py-2 text-xs font-semibold tracking-[0.02em]"
          >
            WhatsApp
          </a>
        </nav>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-sand bg-surface/80 text-sm tracking-wide md:hidden shadow-sm"
          aria-expanded={open}
          aria-controls="mobile-nav"
        >
          <span className="sr-only">Меню</span>
          <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-ink" fill="none" strokeWidth="1.75">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>

      {open ? (
        <div
          id="mobile-nav"
          className="fixed inset-0 z-[100] flex min-h-screen w-full flex-col bg-[#f7f3ed] p-6 overflow-y-auto"
          style={{ backgroundColor: "#f7f3ed" }}
        >
          <div className="flex items-center justify-between pb-6 border-b border-sand">
            <span className="font-display text-xl font-medium text-ink">{site.brand}</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-sand bg-surface shadow-sm"
              aria-label="Закрыть меню"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-ink" fill="none" strokeWidth="1.75">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav aria-label="Основная навигация" className="flex flex-col gap-6 pt-10">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="font-display text-3xl text-ink"
              >
                {item.label}
              </Link>
            ))}
            
            <div className="pt-6">
              <a
                href="https://wa.me/37498033550"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="inline-flex w-full items-center justify-center rounded-full btn-brown py-4 text-center text-xs font-semibold tracking-[0.03em] shadow-md"
              >
                Написать в WhatsApp →
              </a>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
