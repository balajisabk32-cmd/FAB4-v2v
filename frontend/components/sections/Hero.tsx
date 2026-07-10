"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "@phosphor-icons/react";
import { MagneticButton, Badge } from "@/components/kokonut";

/**
 * Hero — editorial manifesto hero.
 * The brief explicitly requests center alignment with cinematic text
 * where the message itself IS the design (valid override of the
 * anti-center-bias rule for manifesto / launch moments).
 *
 * Layout: asymmetric vertical — headline dominates, ambient breathing
 * orbs float around it, CTA sits below. Single message, max 4 text
 * elements (eyebrow badge, headline, subtext, CTA).
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
                 px-6 pt-72 pb-16 text-center"
    >
      {/* Ambient breathing orbs (depth, never pure white bg) */}
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
        {/* Eyebrow badge */}
        <motion.div variants={item}>
          <Badge variant="outline" className="mb-7 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-blush-400" />
            for women, by women in Bharat
          </Badge>
        </motion.div>

        {/* Headline — cinematic, editorial mix of sans + serif italic accent */}
        <motion.h1
          variants={item}
          className="text-balance text-[2.6rem] leading-[1.05] tracking-tight
                     text-plum-900 sm:text-6xl lg:text-7xl relative"
        >
          {/* NEW: Abstract Ethereal Glass Orb (User request: not just words) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 md:w-64 md:h-64 rounded-full bg-gradient-to-tr from-lavender-300/30 to-blush-300/30 blur-2xl -z-10 mix-blend-multiply animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 md:w-48 md:h-48 rounded-full border border-lavender-400/20 rotate-45 -z-10" />

          Your body speaks.
          <br />
          <span className="display-serif text-plum-800 relative inline-block">Sakhi</span> finally
          listens.
        </motion.h1>

        {/* Subtext — max 20 words, single sentence */}
        <motion.p
          variants={item}
          className="mt-7 max-w-[42rem] text-pretty text-base leading-relaxed
                     text-ink-soft sm:text-lg"
        >
          The first AI-powered companion that connects your menstrual cycle,
          maternal care, and mental wellness into one seamless system.
        </motion.p>

        {/* CTA */}
        <motion.div variants={item} className="mt-10">
          <MagneticButton
            ariaLabel="Open Main App"
            onClick={() => (window.location.href = "/portal")}
            className="px-8 py-4 text-base cursor-pointer"
          >
            Open Main App
            <ArrowRight size={20} weight="bold" />
          </MagneticButton>
        </motion.div>
      </motion.div>

      {/* Scroll indicator — subtle, not a labeled "scroll" cue */}
      <motion.div
        aria-hidden
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: reduce ? 0.4 : [0.2, 0.6, 0.2] }}
        transition={{
          duration: 2.4,
          repeat: reduce ? 0 : Infinity,
          delay: 1.8,
        }}
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
