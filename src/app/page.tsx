import { AboutTeaser } from "@/components/home/AboutTeaser";
import { CatalogShowcase } from "@/components/home/CatalogShowcase";
import { ContactBlock } from "@/components/home/ContactBlock";
import { FeaturedCarousel } from "@/components/home/FeaturedCarousel";
import { Hero } from "@/components/home/Hero";

export default function HomePage() {
  return (
    <>
      {/* 1. Первый экран с портретом Анны, акварельными мазками и брендом */}
      <Hero />

      {/* 2. Каталог: сплит-презентация по 4 направлениям в стиле Azalea */}
      <CatalogShowcase />

      {/* 3. Горизонтальная плавная галерея избранных изделий */}
      <FeaturedCarousel />

      {/* 4. Блок об авторе */}
      <AboutTeaser />

      {/* 5. Контакты и прямой заказ в WhatsApp */}
      <ContactBlock />
    </>
  );
}
