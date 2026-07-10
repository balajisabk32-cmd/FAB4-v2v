"use client";

import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useMotionValue,
  useMotionValueEvent,
  animate,
} from "motion/react";
import { useEffect, useState } from "react";

/**
 * ScrollLogo — cinematic SAKHI logo mark.
 *
 * On first load (once per visit) the logo appears large and centred over the
 * Hero. As the user scrolls past the Hero it smoothly scales down and glides
 * into a permanent docked mark in the top-left corner.
 *
 * "Once per visit" gate: a `latch` motion value is flipped to 1 the first time
 * the visitor scrolls past the hero. It is persisted in sessionStorage so the
 * large intro plays a single time per tab session and the mark never
 * re-expands on scroll-back. The visible `progress` is max(scrollProgress,
 * latch), so the scroll-driven glide stays perfectly smooth up to the latch
 * point and then stays locked.
 */

const DOCK_THRESHOLD = 360; // px — visitor has clearly left the Hero
const STORAGE_KEY = "sakhi-logo-docked";

export function ScrollLogo() {
  const { scrollY } = useScroll();
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  // 0 = large centred intro, 1 = docked corner mark.
  const latch = useMotionValue(0);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && sessionStorage.getItem(STORAGE_KEY) === "1") {
      latch.set(1);
    }
  }, [latch]);

  // Smooth 0 -> 1 across the first 350px of scroll.
  const scrollProgress = useTransform(scrollY, [0, 350], [0, 1], { clamp: true });
  // Effective progress never drops below the latch once set.
  const progress = useTransform(
    [scrollProgress, latch],
    ([s, l]: number[]) => Math.max(s, l)
  );

  useMotionValueEvent(scrollY, "change", (y) => {
    if (y > DOCK_THRESHOLD && latch.get() < 1) {
      latch.set(1);
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* storage unavailable — non-fatal */
      }
      // Graceful glide to the corner even if the latch fired mid-scroll.
      animate(progress, 1, { duration: 0.5, ease: [0.22, 1, 0.36, 1] });
    }
  });

  // Intro (progress 0): centred, large. Docked (progress 1): top-left corner.
  const y = useTransform(progress, [0, 1], ["12vh", "0.5rem"]);
  const x = useTransform(progress, [0, 1], ["50vw", "1.5rem"]);
  const scale = useTransform(progress, [0, 1], [1.4, 0.45]);
  const translateX = useTransform(progress, [0, 1], ["-50%", "0%"]);
  const translateY = useTransform(progress, [0, 1], ["0%", "0%"]);
  const opacity = useTransform(progress, [0, 1], [1, 0.96]);

  if (!mounted) return null;

  if (reduce) {
    return (
      <div className="pointer-events-none fixed top-3 left-6 z-[60] flex items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Sakhi Logo"
          className="h-10 w-auto mix-blend-multiply"
        />
      </div>
    );
  }

  return (
    <motion.div
      className="pointer-events-none fixed z-[60]"
      style={{
        top: 0,
        left: 0,
        x,
        y,
        scale,
        translateX,
        translateY,
        opacity,
        transformOrigin: "left top",
      }}
    >
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Sakhi — back to top"
        className="pointer-events-auto flex origin-left cursor-pointer flex-col items-center border-0 bg-transparent p-0"
      >
        {/* Soft ethereal glow behind the mark */}
        <span
          aria-hidden
          className="breathe absolute left-1/2 top-1/2 -z-10 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-lavender-300/40 to-blush-300/40 blur-2xl mix-blend-multiply"
        />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Sakhi Logo"
          className="w-48 h-auto mix-blend-multiply transition-opacity duration-300 hover:opacity-90"
        />
      </button>
    </motion.div>
  );
}
