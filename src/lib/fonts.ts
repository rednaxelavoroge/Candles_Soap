import { Comfortaa } from "next/font/google";

/**
 * Comfortaa — шрифт с её нынешнего сайта annamanasaryan.com: он грузит его
 * вместе с Roboto, и это тот самый «кругловатый», который ей нравится.
 * Прежняя пара Cormorant + Jost ей не подошла: «явно не мой шрифт».
 *
 * Одна гарнитура на весь сайт — и заголовки, и текст. У Comfortaa хорошая
 * кириллица и мягкие скруглённые формы, которые перекликаются со скруглениями
 * кадров.
 */
export const comfortaa = Comfortaa({
  subsets: ["cyrillic", "latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  variable: "--font-comfortaa",
});
