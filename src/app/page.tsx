import { AboutTeaser } from "@/components/home/AboutTeaser";
import { ContactBlock } from "@/components/home/ContactBlock";
import { Directions } from "@/components/home/Directions";
import { Hero } from "@/components/home/Hero";
import { SplitReveal } from "@/components/home/SplitReveal";

/**
 * Полоса «Готово к отправке» убрана по прямой просьбе заказчицы:
 * «раздел готово к отправке не нужно».
 */
export default function HomePage() {
  return (
    <>
      <Hero />

      <SplitReveal wordLeft="Ручная" wordRight="работа">
        <Directions />
      </SplitReveal>

      <AboutTeaser />
      <ContactBlock />
    </>
  );
}
