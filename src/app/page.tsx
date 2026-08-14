import { AboutTeaser } from "@/components/home/AboutTeaser";
import { ContactBlock } from "@/components/home/ContactBlock";
import { Directions } from "@/components/home/Directions";
import { FeaturedStrip } from "@/components/home/FeaturedStrip";
import { Hero } from "@/components/home/Hero";
import { SplitReveal } from "@/components/home/SplitReveal";

export default function HomePage() {
  return (
    <>
      <Hero />

      <SplitReveal wordTop="Ручная" wordBottom="работа">
        <Directions />
      </SplitReveal>

      <FeaturedStrip />
      <AboutTeaser />
      <ContactBlock />
    </>
  );
}
