"use client";

import { motion } from "motion/react";
import { Brain, Heartbeat, WaveSine, Baby } from "@phosphor-icons/react";

/**
 * Architecture — The "Under the Hood" ML section.
 * Uses high-end-visual-design directives: The Asymmetrical Bento layout,
 * Double-Bezel nested architecture, and Fluid scroll dynamics.
 */
export function Architecture() {
  const container = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.15 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 30, filter: "blur(5px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { type: "spring", stiffness: 60, damping: 20 },
    },
  };

  const models = [
    {
      title: "PMDD / PME Engine",
      desc: "XGBoost model running locally to correlate sleep quality, mood swings, and basal body temp to predict extreme luteal phase drops.",
      icon: <WaveSine size={32} weight="light" className="text-blush-500" />,
      colSpan: "md:col-span-8",
      bg: "bg-white/80",
    },
    {
      title: "PCOS Classifier",
      desc: "Random Forest predicting androgen excess probabilities from user-reported hirsutism and irregular cycles.",
      icon: <Heartbeat size={32} weight="light" className="text-lavender-600" />,
      colSpan: "md:col-span-4",
      bg: "bg-lavender-50/50",
    },
    {
      title: "Maternal Triage",
      desc: "Heuristic Global Health standard engine that maps trimester-specific danger signs (Hyperemesis, Preeclampsia) to urgent medical action.",
      icon: <Baby size={32} weight="light" className="text-teal-500" />,
      colSpan: "md:col-span-6",
      bg: "bg-teal-50/50",
    },
    {
      title: "Thyroid Risk",
      desc: "Logistic Regression detecting hypothyroid weight fluctuations and fatigue mapping.",
      icon: <Brain size={32} weight="light" className="text-amber-500" />,
      colSpan: "md:col-span-6",
      bg: "bg-amber-50/40",
    },
  ];

  return (
    <section className="relative min-h-[100dvh] w-full px-4 py-32 md:px-8 overflow-hidden bg-gradient-to-b from-white to-lavender-50/30">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={container}
          className="mb-20 text-center"
        >
          <motion.div variants={item} className="mb-6 flex justify-center">
            <span className="rounded-full bg-black/5 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-plum-900">
              System Architecture
            </span>
          </motion.div>
          <motion.h2
            variants={item}
            className="text-balance text-4xl font-semibold tracking-tight text-plum-950 sm:text-5xl lg:text-6xl"
          >
            Powered by localized <span className="display-serif text-plum-700 italic">Machine Learning</span>.
          </motion.h2>
          <motion.p
            variants={item}
            className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-ink-soft"
          >
            Four independent diagnostic engines working in perfect unison. Your data stays on your device, processed locally for ultimate privacy.
          </motion.p>
        </motion.div>

        {/* The Asymmetrical Bento Grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={container}
          className="grid grid-cols-1 gap-6 md:grid-cols-12"
        >
          {models.map((m, i) => (
            <motion.div
              key={m.title}
              variants={item}
              className={`group relative ${m.colSpan}`}
            >
              {/* Outer Shell (Double Bezel) */}
              <div className="relative overflow-hidden rounded-[2.5rem] bg-black/[0.02] p-2 ring-1 ring-black/[0.04] transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[0.98]">
                
                {/* Inner Core */}
                <div className={`relative h-full w-full rounded-[2rem] ${m.bg} p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] sm:p-10 flex flex-col justify-between min-h-[280px]`}>
                  {/* Icon wrapper */}
                  <div className="mb-10 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5">
                    {m.icon}
                  </div>
                  
                  <div>
                    <h3 className="mb-3 text-2xl font-semibold tracking-tight text-plum-900">
                      {m.title}
                    </h3>
                    <p className="text-ink-soft leading-relaxed">
                      {m.desc}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
        
        {/* Animated ML Pipeline Flow (Anime.js style SVG path) */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2, delay: 0.5 }}
          className="mt-20 flex justify-center hidden md:flex"
        >
           <svg width="800" height="120" viewBox="0 0 800 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M 0,60 C 200,60 200,10 400,10 C 600,10 600,110 800,110" stroke="url(#gradient)" strokeWidth="2" strokeDasharray="8 8" className="animate-pulse" />
              <circle cx="400" cy="10" r="4" fill="#d9c2ee" />
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="800" y2="0" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#ece0f7" stopOpacity="0" />
                  <stop offset="0.5" stopColor="#a982d6" />
                  <stop offset="1" stopColor="#fbe5ea" stopOpacity="0" />
                </linearGradient>
              </defs>
           </svg>
        </motion.div>
      </div>
    </section>
  );
}
