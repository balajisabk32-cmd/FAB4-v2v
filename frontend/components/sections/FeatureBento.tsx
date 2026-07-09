"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  Heartbeat,
  Brain,
  Baby,
  MicrophoneStage,
  CellSignalFull,
} from "@phosphor-icons/react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { Reveal, itemVariants } from "@/components/Reveal";
import { Badge } from "@/components/kokonut";

/**
 * FeatureBento — asymmetric masonry-style bento grid.
 *
 * 5 features, 5 cells, no empty cells. Layout uses fractional grid
 * columns so cells are intentionally unequal in size (the big
 * "Cycle Intelligence" tile anchors the grid, others fill around it).
 *
 * Each cell has REAL visual variation (not 5 white cards):
 *  - Cycle Intelligence: gradient panel + animated cycle ring
 *  - Mental Wellness: glass + waveform
 *  - Maternal Care: tinted panel + image
 *  - Voice AI Triage: plum (inverted) panel, the standout
 *  - Offline SMS Mode: cream-deep + signal glyph
 *
 * Mobile (<768px): collapses to single column, explicit order.
 */

export function FeatureBento() {
  const reduce = useReducedMotion();

  return (
    <section className="relative px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        {/* Section header — stacked, no split-header */}
        <Reveal>
          <p className="mb-4 text-xs uppercase tracking-[0.18em] text-ink-soft">
            one system, five senses
          </p>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 className="max-w-2xl text-balance text-3xl leading-[1.1] tracking-tight text-plum-900 sm:text-4xl lg:text-[2.7rem]">
            Everything she juggles, finally in{" "}
            <span className="display-serif text-plum-800">one place</span>.
          </h2>
        </Reveal>

        {/* Bento grid: asymmetric, fractional columns.
            Desktop: 6-col grid, cells span unevenly.
            Mobile: single column. */}
        <motion.div
          className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-6 md:grid-rows-[auto_auto]"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: reduce ? 0 : 0.1,
                delayChildren: 0.05,
              },
            },
          }}
        >
          {/* CELL 1 — Cycle Intelligence (big, gradient, anchors top-left) */}
          <CycleCell reduce={!!reduce} />

          {/* CELL 2 — Voice AI Triage (inverted plum panel, the standout) */}
          <VoiceCell reduce={!!reduce} />

          {/* CELL 3 — Mental Wellness (glass + waveform) */}
          <MindCell reduce={!!reduce} />

          {/* CELL 4 — Maternal Care (tinted panel + image) */}
          <MaternalCell />

          {/* CELL 5 — Offline SMS Mode (cream-deep + signal glyph) */}
          <OfflineCell />
        </motion.div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------------------
   Individual cells — each keeps its own localized state, icon, and accent.
   Splitting per-cell avoids JSX dynamic tag pitfalls and keeps the grid
   readable.
---------------------------------------------------------------------------- */

const IconProps = { weight: "bold" as const };

/** CELL 1 — Cycle Intelligence */
function CycleCell({ reduce }: { reduce: boolean }) {
  const Icon: PhosphorIcon = Heartbeat;
  return (
    <motion.article
      variants={itemVariants}
      className="md:col-span-4 md:row-span-1 group relative overflow-hidden rounded-[26px]
                 bg-gradient-to-br from-lavender-100 via-[#f3e8f8] to-blush-100
                 border border-white/60 p-7 sm:p-9
                 shadow-[0_24px_60px_-30px_rgba(74,42,82,0.25)]"
    >
      <div className="relative z-10 flex h-full flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div className="max-w-md">
          <Badge variant="soft" className="mb-4">
            core engine
          </Badge>
          <h3 className="text-2xl font-semibold text-plum-900 sm:text-3xl">
            Cycle Intelligence
          </h3>
          <p className="mt-3 leading-relaxed text-ink-soft">
            Predictions tuned to irregular cycles, PCOS, and postpartum return.
            Not a 28-day template. Your actual rhythm.
          </p>
        </div>
        {/* Animated cycle ring */}
        <CycleRing reduce={reduce} />
      </div>
      {/* ghosted background glyph */}
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-10 -right-8 text-lavender-200/50"
      >
        <Icon size={200} {...IconProps} />
      </span>
    </motion.article>
  );
}

/** CELL 2 — Voice AI Triage (the standout, inverted) */
function VoiceCell({ reduce }: { reduce: boolean }) {
  const Icon: PhosphorIcon = MicrophoneStage;
  const langs = ["हिन्दी", "தமிழ்", "বাংলা", "मराठी", "+8"];
  return (
    <motion.article
      variants={itemVariants}
      className="md:col-span-2 group relative overflow-hidden rounded-[26px]
                 bg-plum-900 p-7 text-cream
                 shadow-[0_24px_60px_-30px_rgba(42,21,47,0.6)]"
    >
      <div className="relative z-10 flex h-full flex-col">
        <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-cream/10 px-3 py-1 text-xs text-lavender-200">
          built for Bharat
        </span>
        <Icon size={28} {...IconProps} />
        <h3 className="mt-4 text-xl font-semibold">Voice AI Triage</h3>
        <p className="mt-2 text-sm leading-relaxed text-cream/70">
          Speak in Hindi, Tamil, Bengali, Marathi, or 8 more. Sakhi understands
          Bharat, not just English.
        </p>

        {/* language chips */}
        <div className="mt-5 flex flex-wrap gap-1.5">
          {langs.map((lang, i) => (
            <motion.span
              key={lang}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 + i * 0.06 }}
              className="rounded-full bg-cream/10 px-2.5 py-1 text-[11px] text-lavender-100"
            >
              {lang}
            </motion.span>
          ))}
        </div>
      </div>
      {/* ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-lavender-500/30 blur-3xl breathe"
      />
    </motion.article>
  );
}

/** CELL 3 — Mental Wellness (glass + waveform) */
function MindCell({ reduce }: { reduce: boolean }) {
  const Icon: PhosphorIcon = Brain;
  return (
    <motion.article
      variants={itemVariants}
      className="md:col-span-2 group relative overflow-hidden rounded-[26px] glass p-7"
    >
      <div className="relative z-10 flex h-full flex-col">
        <Icon size={26} {...IconProps} />
        <h3 className="mt-4 text-xl font-semibold text-plum-900">
          Mental Wellness
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Mood, sleep, and anxiety tracked against your hormonal timeline, so
          patterns surface instead of hiding.
        </p>
        <Waveform reduce={reduce} />
      </div>
    </motion.article>
  );
}

/** CELL 4 — Maternal Care (tinted panel + image) */
function MaternalCell() {
  const Icon: PhosphorIcon = Baby;
  return (
    <motion.article
      variants={itemVariants}
      className="md:col-span-2 group relative overflow-hidden rounded-[26px]
                 bg-blush-50 border border-blush-100 p-7"
    >
      <div className="relative z-10 flex h-full flex-col">
        <Icon size={26} {...IconProps} />
        <h3 className="mt-4 text-xl font-semibold text-plum-900">
          Maternal Care
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Fertility, pregnancy week-by-week, and postpartum support in one
          continuous thread. Care that does not reset between phases.
        </p>
      </div>
      {/* real image asset for visual variation */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://picsum.photos/seed/sakhi-maternal-care-bloom/400/200"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-6 -right-6 h-32 w-32 rounded-full object-cover opacity-70 grayscale-[20%] mix-blend-multiply"
        loading="lazy"
      />
    </motion.article>
  );
}

/** CELL 5 — Offline SMS Mode (cream-deep + signal glyph) */
function OfflineCell() {
  const Icon: PhosphorIcon = CellSignalFull;
  return (
    <motion.article
      variants={itemVariants}
      className="md:col-span-2 group relative overflow-hidden rounded-[26px]
                 bg-cream-deep border border-plum-700/10 p-7"
    >
      <div className="relative z-10 flex h-full flex-col">
        <Icon size={26} {...IconProps} />
        <h3 className="mt-4 text-xl font-semibold text-plum-900">
          Offline SMS Mode
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          No smartphone. No data. No problem. Cycle reminders and triage reach
          you over plain SMS.
        </p>
        {/* mock SMS bubble for visual interest */}
        <div className="mt-5 w-fit rounded-2xl rounded-bl-sm bg-white/70 px-3 py-2 text-[11px] text-plum-800 shadow-sm">
          <span className="text-ink-faint">SAKHI</span> · Day 14 tomorrow.
          Restock iron.
        </div>
      </div>
    </motion.article>
  );
}

/** Animated cycle ring for the Cycle Intelligence tile. */
function CycleRing({ reduce }: { reduce: boolean }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-28 w-28 shrink-0" aria-hidden>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="rgba(74,42,82,0.12)"
          strokeWidth="6"
        />
        <motion.circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="url(#cycleGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: reduce ? c * 0.35 : c }}
          whileInView={{ strokeDashoffset: c * 0.35 }}
          viewport={{ once: true }}
          transition={{
            duration: reduce ? 0 : 1.6,
            ease: [0.22, 1, 0.36, 1],
            delay: 0.3,
          }}
        />
        <defs>
          <linearGradient id="cycleGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8f63c2" />
            <stop offset="100%" stopColor="#d14d6d" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold text-plum-900">day 14</span>
        <span className="text-[10px] text-ink-soft">ovulation</span>
      </div>
    </div>
  );
}

/** Animated waveform for the Mental Wellness tile. */
function Waveform({ reduce }: { reduce: boolean }) {
  const bars = 18;
  return (
    <div className="mt-5 flex h-10 items-end gap-1" aria-hidden>
      {Array.from({ length: bars }).map((_, i) => {
        const base = 30 + Math.sin(i * 0.7) * 25 + ((i * 7) % 20);
        return (
          <motion.span
            key={i}
            className="flex-1 rounded-full bg-gradient-to-t from-lavender-400 to-blush-300"
            animate={
              reduce
                ? { height: `${base}%` }
                : {
                    height: [`${base}%`, `${Math.min(95, base + 25)}%`, `${base}%`],
                  }
            }
            transition={{
              duration: 1.2 + (i % 4) * 0.25,
              repeat: reduce ? 0 : Infinity,
              ease: "easeInOut",
              delay: i * 0.05,
            }}
            style={{ height: `${base}%` }}
          />
        );
      })}
    </div>
  );
}
