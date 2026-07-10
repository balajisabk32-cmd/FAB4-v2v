"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "@phosphor-icons/react";

/**
 * Hero — Stage 3 revealed landing content.
 * Centered angel figure placeholder, welcoming headline, concise subtext, and
 * a cream CTA with a lavender border. The full-body angel art
 * (/angel-fullbody.png) drops in later; falls back to /logo.png.
 */
export function Hero() {
  const reduce = useReducedMotion();

  const container = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduce ? 0 : 0.14,
        delayChildren: reduce ? 0 : 0.1,
      },
    },
  };

  const item = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 26, filter: "blur(8px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { type: "spring", stiffness: 80, damping: 18, mass: 1 },
    },
  };

  return (
    <section
      className="relative flex min-h-[100dvh] flex-col items-center justify-center
                 px-6 pt-28 pb-16 text-center"
    >
      {/* Ambient breathing orbs (settled-petal / light-speck texture) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="breathe absolute -top-20 left-[8%] h-72 w-72 rounded-full bg-lavender-200/50 blur-3xl" />
        <div
          className="breathe absolute top-1/3 right-[6%] h-80 w-80 rounded-full bg-blush-200/40 blur-3xl"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="breathe absolute bottom-10 left-[30%] h-64 w-64 rounded-full bg-lavender-100/60 blur-3xl"
          style={{ animationDelay: "4s" }}
        />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="flex max-w-4xl flex-col items-center"
      >
        {/* Centered angel figure (Stage 3 hero graphic) */}
        <motion.div variants={item} className="relative mb-10">
          <div
            aria-hidden
            className="breathe absolute left-1/2 top-1/2 -z-10 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-lavender-300/40 to-blush-300/40 blur-3xl mix-blend-multiply"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Sakhi Logo"
            className="relative h-56 w-auto drop-shadow-[0_8px_30px_rgba(122,74,163,0.25)] sm:h-64 mix-blend-multiply"
          />
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={item}
          className="text-balance text-[2.4rem] leading-[1.08] tracking-tight
                     text-plum-900 sm:text-5xl lg:text-6xl"
        >
          Discover Your Inner Radiance with{" "}
          <span className="display-serif text-plum-800 italic">SAKHI</span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          variants={item}
          className="mt-7 max-w-[42rem] text-pretty text-base leading-relaxed
                     text-ink-soft sm:text-lg"
        >
          Unlock the secrets of personalized wellness and inner harmony, guided
          by the wisdom of the angels.
        </motion.p>


      </motion.div>

      {/* Subtle scroll cue */}
      <motion.div
        aria-hidden
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: reduce ? 0.4 : [0.2, 0.6, 0.2] }}
        transition={{ duration: 2.4, repeat: reduce ? 0 : Infinity, delay: 1.8 }}
      >
        <div className="h-10 w-6 rounded-full border border-plum-700/25 p-1">
          <motion.div
            className="h-2 w-4 rounded-full bg-plum-700/40"
            animate={reduce ? {} : { y: [0, 12, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </section>
  );
}
