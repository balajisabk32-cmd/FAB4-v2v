import { PetalWind } from "@/components/PetalWind";
import { Navigation } from "@/components/sections/Navigation";
import { ScrollLogo } from "@/components/ScrollLogo";
import { Hero } from "@/components/sections/Hero";
import { AhaMoment } from "@/components/sections/AhaMoment";
import { Architecture } from "@/components/sections/Architecture";
import { FeatureBento } from "@/components/sections/FeatureBento";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <>
      <ScrollLogo />
      {/* Continuous petal-wind background, fixed behind everything */}
      <PetalWind />

      <Navigation />

      <main className="relative">
        <Hero />
        <AhaMoment />
        <Architecture />
        <section id="features">
          <FeatureBento />
        </section>
        <Footer />
      </main>
    </>
  );
}
