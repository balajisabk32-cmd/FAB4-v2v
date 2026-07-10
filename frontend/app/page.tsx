"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { PetalWind } from "@/components/PetalWind";
import { Navigation } from "@/components/sections/Navigation";
import { ScrollLogo } from "@/components/ScrollLogo";
import { IntroOverlay } from "@/components/IntroOverlay";
import { Hero } from "@/components/sections/Hero";
import { AhaMoment } from "@/components/sections/AhaMoment";
import { Architecture } from "@/components/sections/Architecture";
import { FeatureBento } from "@/components/sections/FeatureBento";
import { Footer } from "@/components/sections/Footer";

const INTRO_KEY = "sakhi-intro-played";

export default function Home() {
  const reduce = useReducedMotion();
  const [playIntro, setPlayIntro] = useState(false);
  const [introDone, setIntroDone] = useState(false);

  // Always play intro on load (skipped only under reduced motion)
  useEffect(() => {
    if (reduce) {
      setIntroDone(true);
      setPlayIntro(false);
    } else {
      setIntroDone(false);
      setPlayIntro(true);
    }
  }, [reduce]);

  const handleIntroComplete = () => {
    setIntroDone(true);
    setPlayIntro(false);
  };

  return (
    <>
      {playIntro && <IntroOverlay onComplete={handleIntroComplete} />}

      <ScrollLogo />
      {/* Continuous petal-wind background, fixed behind everything */}
      <PetalWind />

      <Navigation />

      {/* Main content stays in the DOM (for SEO/accessibility) but is hidden
          until the intro settles, then reveals without overlapping the intro. */}
      <main
        className={`relative transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          introDone
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-6 opacity-0"
        }`}
      >
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
