"use client";

import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

export function ScrollLogo() {
  const { scrollY } = useScroll();
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // When scroll is 0, logo is large and centered in the Hero.
  // As we scroll to 350px, it shrinks and slides into the top-left navbar corner.
  const y = useTransform(scrollY, [0, 350], ["12vh", "0.5rem"]);
  const x = useTransform(scrollY, [0, 350], ["50vw", "1.5rem"]);
  const scale = useTransform(scrollY, [0, 350], [1.4, 0.45]);
  const translateX = useTransform(scrollY, [0, 350], ["-50%", "0%"]);
  const translateY = useTransform(scrollY, [0, 350], ["0%", "0%"]);

  if (!mounted) return null;

  if (reduce) {
    return (
      <div className="fixed top-3 left-6 z-[60] flex items-center gap-2">
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
      className="fixed z-[60] pointer-events-none"
      style={{
        top: 0,
        left: 0,
        x,
        y,
        scale,
        translateX,
        translateY,
        transformOrigin: "left top",
      }}
    >
      <div className="pointer-events-auto cursor-pointer flex flex-col items-center origin-left">
        <img
          src="/logo.png"
          alt="Sakhi Logo"
          className="w-48 h-auto mix-blend-multiply transition-opacity duration-300 hover:opacity-90"
        />
      </div>
    </motion.div>
  );
}
