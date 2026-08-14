import { Cormorant_Garamond, Jost } from "next/font/google";

export const cormorant = Cormorant_Garamond({
  subsets: ["cyrillic", "latin"],
  weight: ["300", "400"],
  display: "swap",
  variable: "--font-cormorant",
});

export const jost = Jost({
  subsets: ["cyrillic", "latin"],
  weight: ["300", "400"],
  display: "swap",
  variable: "--font-jost",
});
