"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/kokonut";

/**
 * Navigation — single line at desktop, height capped under 80px.
 * Frosted glass pill that condenses on scroll.
 */
export function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Cycle", href: "#features" },
    { label: "Mind", href: "#features" },
    { label: "Care", href: "#features" },
    { label: "Privacy", href: "#footer" },
  ];

  return (
    <motion.header
      initial={reduce ? false : { y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4"
    >
      <nav
        className={`flex w-full max-w-5xl items-center justify-between gap-4 rounded-full px-5 py-2.5 transition-all duration-500 ease-[var(--ease-soft)]
          ${scrolled ? "glass-strong" : "bg-white/30 border border-white/40 backdrop-blur-sm"}`}
        style={{ height: "60px" }}
      >
        {/* Center links — hidden on small screens to keep one line */}
        <div className="hidden items-center gap-7 md:flex pl-4">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-sm text-ink-soft transition-colors hover:text-plum-900"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <Button variant="primary" className="px-5 py-2 text-sm" glow>
          Open Main App
        </Button>
      </nav>
    </motion.header>
  );
}
