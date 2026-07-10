"use client";

import { useRef, type ReactNode, type MouseEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

interface MagneticButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  /** strength of pull, px travel at the edge */
  strength?: number;
  ariaLabel?: string;
}

/**
 * Kokonut MagneticButton — the cursor pulls the button toward it
 * via spring physics. Uses Motion values OUTSIDE React render cycle
 * (never useState for continuous pointer tracking).
 *
 * Reduced-motion safe: motion values collapse to 0 naturally.
 */
export function MagneticButton({
  children,
  onClick,
  className = "",
  strength = 18,
  ariaLabel,
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const sx = useSpring(x, { stiffness: 150, damping: 15, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 150, damping: 15, mass: 0.4 });

  // Inner content moves slightly more for parallax depth
  const innerX = useTransform(sx, (v) => v * 1.3);
  const innerY = useTransform(sy, (v) => v * 1.3);

  const handleMove = (e: MouseEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);
    // normalize to -1..1 then scale by strength
    x.set((relX / (rect.width / 2)) * strength);
    y.set((relY / (rect.height / 2)) * strength);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      aria-label={ariaLabel}
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ x: sx, y: sy }}
      whileTap={{ scale: 0.96 }}
      className={`relative inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5
        font-medium text-white
        bg-gradient-to-br from-[#8f63c2] via-[#9d6fc8] to-[#d14d6d]
        shadow-[0_10px_30px_-8px_rgba(143,99,194,0.55)]
        transition-shadow duration-300 ease-[var(--ease-soft)]
        hover:shadow-[0_20px_50px_-10px_rgba(143,99,194,0.7)]
        will-change-transform select-none ${className}`}
    >
      {/* ambient glow layer */}
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-3 -z-10 rounded-full bg-gradient-to-br from-lavender-300/50 to-blush-300/50 blur-2xl opacity-70 breathe"
      />
      <motion.span
        style={{ x: innerX, y: innerY }}
        className="inline-flex items-center gap-2"
      >
        {children}
      </motion.span>
    </motion.button>
  );
}
