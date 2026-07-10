"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkle, CheckCircle, Baby, Flower } from "@phosphor-icons/react";

export default function UnifiedOnboardingChat() {
  const [step, setStep] = useState(0);
  
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"her" | "mom" | null>(null);
  
  // Her Mode fields
  const [cycleLength, setCycleLength] = useState<number>(28);
  const [periodDuration, setPeriodDuration] = useState<number>(5);
  
  // Mom Mode fields
  const [dueDate, setDueDate] = useState<string>("");
  const [weeksPregnant, setWeeksPregnant] = useState<number>(12);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleHerModeSubmit = async () => {
    setIsSubmitting(true);
    setStep(4); // completion step
    try {
      await fetch('/api/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'her',
          profile: {
            preferred_name: name,
            cycle_length: cycleLength,
            period_duration: periodDuration,
            is_pregnancy_mode: false
          }
        })
      });
      setTimeout(() => {
        window.location.href = '/her-mode';
      }, 1500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMomModeSubmit = async () => {
    setIsSubmitting(true);
    setStep(4);
    try {
      await fetch('/api/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'pregnancy',
          profile: {
            preferred_name: name,
            due_date: dueDate,
            weeks_pregnant: weeksPregnant,
            is_pregnancy_mode: true
          }
        })
      });
      setTimeout(() => {
        window.location.href = '/pregnancy-mode';
      }, 1500);
    } catch (e) {
      console.error(e);
    }
  };

  const steps = [
    {
      id: "name",
      botText: "Hello! I am Sakhi, your personal health assistant. How can I call you?",
      renderInput: () => (
        <div className="mt-4 flex flex-col items-end w-full">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Type your name..."
            className="w-full bg-white border border-[#2D1B36]/20 rounded-xl px-4 py-3 text-sm text-[#2D1B36] focus:outline-none focus:ring-2 focus:ring-lavender-400 shadow-sm mb-3"
          />
          <button
            onClick={() => { if(name.trim()) setStep(1); }}
            disabled={!name.trim()}
            className="px-6 py-2.5 rounded-full bg-[#2D1B36] text-white text-sm font-medium self-end disabled:opacity-50 hover:bg-[#3d2547] transition-colors"
          >
            Next
          </button>
        </div>
      )
    },
    {
      id: "mode",
      botText: `Nice to meet you, ${name}! Which journey would you like to set up today?`,
      renderInput: () => (
        <div className="mt-4 flex flex-col gap-3 w-full">
          <button
            onClick={() => { setMode("her"); setStep(2); }}
            className="flex items-center gap-4 w-full bg-white hover:bg-blush-50 border border-blush-200 p-4 rounded-xl shadow-sm transition-all text-left cursor-pointer"
          >
            <div className="bg-blush-100 p-2 rounded-full"><Flower size={24} weight="fill" className="text-blush-500" /></div>
            <div>
              <h4 className="font-semibold text-plum-900">Her Mode (Menstrual)</h4>
              <p className="text-xs text-ink-soft">Track periods, ovulation, and PCOS/Thyroid health.</p>
            </div>
          </button>
          
          <button
            onClick={() => { setMode("mom"); setStep(2); }}
            className="flex items-center gap-4 w-full bg-white hover:bg-lavender-50 border border-lavender-200 p-4 rounded-xl shadow-sm transition-all text-left cursor-pointer"
          >
            <div className="bg-lavender-100 p-2 rounded-full"><Baby size={24} weight="fill" className="text-lavender-500" /></div>
            <div>
              <h4 className="font-semibold text-plum-900">Mom Mode (Pregnancy)</h4>
              <p className="text-xs text-ink-soft">Track baby growth, trimesters, and maternity health.</p>
            </div>
          </button>
        </div>
      )
    }
  ];

  if (mode === "her") {
    steps.push({
      id: "her-cycle",
      botText: "What is your typical cycle length in days? (Usually between 21 and 35 days)",
      renderInput: () => (
        <div className="mt-4 flex flex-col items-end w-full">
          <div className="flex items-center gap-3 w-full mb-3 bg-white p-4 rounded-xl border border-blush-200 shadow-sm">
             <input
              type="range"
              min="20"
              max="45"
              value={cycleLength}
              onChange={(e) => setCycleLength(parseInt(e.target.value))}
              className="w-full accent-blush-500 cursor-pointer"
            />
            <span className="font-bold text-plum-900 shrink-0 w-10 text-right">{cycleLength}</span>
          </div>
          <button
            onClick={() => setStep(3)}
            className="px-6 py-2.5 rounded-full bg-blush-500 hover:bg-blush-600 text-white text-sm font-medium self-end transition-colors cursor-pointer"
          >
            Next
          </button>
        </div>
      )
    });
    steps.push({
      id: "her-duration",
      botText: "And how many days does your period typically last?",
      renderInput: () => (
        <div className="mt-4 flex flex-col items-end w-full">
          <div className="flex items-center gap-3 w-full mb-3 bg-white p-4 rounded-xl border border-blush-200 shadow-sm">
             <input
              type="range"
              min="2"
              max="10"
              value={periodDuration}
              onChange={(e) => setPeriodDuration(parseInt(e.target.value))}
              className="w-full accent-blush-500 cursor-pointer"
            />
            <span className="font-bold text-plum-900 shrink-0 w-10 text-right">{periodDuration}</span>
          </div>
          <button
            onClick={handleHerModeSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-full bg-plum-900 text-white text-sm font-medium self-end flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle weight="bold" /> Complete Setup
          </button>
        </div>
      )
    });
  }

  if (mode === "mom") {
    steps.push({
      id: "mom-weeks",
      botText: "Congratulations! How many weeks pregnant are you currently?",
      renderInput: () => (
        <div className="mt-4 flex flex-col items-end w-full">
          <div className="flex items-center gap-3 w-full mb-3 bg-white p-4 rounded-xl border border-lavender-200 shadow-sm">
             <input
              type="range"
              min="1"
              max="42"
              value={weeksPregnant}
              onChange={(e) => setWeeksPregnant(parseInt(e.target.value))}
              className="w-full accent-lavender-500 cursor-pointer"
            />
            <span className="font-bold text-plum-900 shrink-0 w-12 text-right">{weeksPregnant} w</span>
          </div>
          <button
            onClick={() => setStep(3)}
            className="px-6 py-2.5 rounded-full bg-lavender-500 hover:bg-lavender-600 text-white text-sm font-medium self-end transition-colors cursor-pointer"
          >
            Next
          </button>
        </div>
      )
    });
    steps.push({
      id: "mom-due",
      botText: "Do you know your estimated due date? (Optional)",
      renderInput: () => (
        <div className="mt-4 flex flex-col items-end w-full">
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full bg-white border border-lavender-200 rounded-xl px-4 py-3 text-sm text-plum-900 focus:outline-none focus:ring-2 focus:ring-lavender-400 shadow-sm mb-3 cursor-pointer"
          />
          <button
            onClick={handleMomModeSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-full bg-plum-900 text-white text-sm font-medium self-end flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle weight="bold" /> Complete Setup
          </button>
        </div>
      )
    });
  }

  steps.push({
    id: "closing",
    botText: `Thank you, ${name}. I am preparing your customized ${mode === 'mom' ? 'Pregnancy' : 'Menstrual'} dashboard now... 🌸`,
    renderInput: () => (
       <div className="mt-4 flex justify-center w-full">
         <div className="h-6 w-6 animate-spin rounded-full border-2 border-plum-900 border-t-transparent" />
       </div>
    )
  });

  return (
    <div className="flex flex-col gap-4 w-full max-w-lg mx-auto">
      <AnimatePresence mode="popLayout">
        {steps.slice(0, step + 1).map((s, index) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="flex flex-col w-full"
          >
            {/* Bot Message */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl rounded-tl-sm p-4 text-sm text-plum-950 shadow-sm self-start max-w-[90%] border border-plum-700/10 mb-2 flex gap-3">
              <Sparkle className="w-5 h-5 text-lavender-500 shrink-0 mt-0.5" weight="fill" />
              <span className="leading-relaxed font-medium">{s.botText}</span>
            </div>

            {/* User Input Area */}
            {index === step && (
               <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="w-full flex justify-end"
               >
                 {s.renderInput()}
               </motion.div>
            )}
            
            {/* User Answer Summary Bubbles */}
            {index < step && s.id === "name" && (
              <div className="bg-plum-900 text-white rounded-2xl rounded-tr-sm py-2 px-4 text-sm font-medium self-end max-w-[80%] shadow-sm mb-4">
                {name}
              </div>
            )}
            {index < step && s.id === "mode" && (
              <div className="bg-plum-900 text-white rounded-2xl rounded-tr-sm py-2 px-4 text-sm font-medium self-end max-w-[80%] shadow-sm mb-4 flex items-center gap-2">
                {mode === "her" ? "Her Mode" : "Mom Mode"}
              </div>
            )}
            {index < step && s.id === "her-cycle" && (
              <div className="bg-blush-500 text-white rounded-2xl rounded-tr-sm py-2 px-4 text-sm font-medium self-end max-w-[80%] shadow-sm mb-4">
                {cycleLength} days
              </div>
            )}
            {index < step && s.id === "her-duration" && (
              <div className="bg-blush-500 text-white rounded-2xl rounded-tr-sm py-2 px-4 text-sm font-medium self-end max-w-[80%] shadow-sm mb-4">
                {periodDuration} days
              </div>
            )}
            {index < step && s.id === "mom-weeks" && (
              <div className="bg-lavender-500 text-white rounded-2xl rounded-tr-sm py-2 px-4 text-sm font-medium self-end max-w-[80%] shadow-sm mb-4">
                {weeksPregnant} weeks
              </div>
            )}
            {index < step && s.id === "mom-due" && (
              <div className="bg-lavender-500 text-white rounded-2xl rounded-tr-sm py-2 px-4 text-sm font-medium self-end max-w-[80%] shadow-sm mb-4">
                {dueDate || "Not sure"}
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
