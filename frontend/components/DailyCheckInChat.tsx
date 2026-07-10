"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkle, CheckCircle } from "@phosphor-icons/react";

interface DailyCheckInChatProps {
  onComplete: (data: any) => void;
}

export default function DailyCheckInChat({ onComplete }: DailyCheckInChatProps) {
  const [step, setStep] = useState(0);
  
  // Data state
  const [flow, setFlow] = useState<string | null>(null);
  const [cramps, setCramps] = useState<number>(0);
  const [mood, setMood] = useState<string | null>(null);
  const [sleepHours, setSleepHours] = useState<number>(7);
  const [weight, setWeight] = useState<string>("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  
  const handleFlowSelect = (val: string) => {
    setFlow(val);
    setTimeout(() => setStep(1), 400);
  };

  const toggleSymptom = (sym: string) => {
    if (sym === "None") {
      setSymptoms(["None"]);
      return;
    }
    setSymptoms(prev => {
      const next = prev.filter(s => s !== "None");
      if (next.includes(sym)) return next.filter(s => s !== sym);
      return [...next, sym];
    });
  };

  const handleSubmit = () => {
    setStep(6); // Closing message
    
    // Simulate network delay for UI effect
    setTimeout(() => {
      onComplete({
        onPeriod: flow !== "None" ? "Yes" : "No",
        flowIntensity: flow,
        crampsSeverity: cramps,
        symptoms: symptoms.length > 0 ? symptoms : ["None"],
        mood,
        sleepHours,
        weight: weight ? parseFloat(weight) : null
      });
    }, 2500);
  };

  const steps = [
    {
      id: "flow",
      botText: "Hi there! 🌸 Let's do your daily check-in. How is your flow today?",
      renderInput: () => (
        <div className="flex flex-wrap gap-2 mt-4 justify-end">
          {["None", "Spotting", "Light", "Moderate", "Heavy", "Very Heavy"].map(opt => (
            <button
              key={opt}
              onClick={() => handleFlowSelect(opt)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                flow === opt 
                  ? "bg-[#2D1B36] text-white" 
                  : "bg-white/50 text-[#2D1B36] hover:bg-white/80 border border-white/40"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )
    },
    {
      id: "cramps",
      botText: `Got it. How severe are your cramps or pain today on a scale of 0 to 10?`,
      renderInput: () => (
        <div className="mt-4 flex flex-col items-end w-full">
          <input
            type="range"
            min="0"
            max="10"
            value={cramps}
            onChange={(e) => setCramps(parseInt(e.target.value))}
            className="w-full accent-pink-500 mb-3"
          />
          <div className="w-full flex justify-between text-xs text-[#2D1B36]/60 font-medium px-1 mb-4">
            <span>0 (None)</span>
            <span>{cramps}</span>
            <span>10 (Severe)</span>
          </div>
          <button
            onClick={() => setStep(2)}
            className="px-4 py-2 rounded-full bg-[#2D1B36] text-white text-xs font-medium self-end"
          >
            Next
          </button>
        </div>
      )
    },
    {
      id: "mood",
      botText: "How are you feeling emotionally today?",
      renderInput: () => (
        <div className="flex flex-wrap gap-2 mt-4 justify-end">
          {["Happy", "Calm", "Anxious", "Irritable", "Sad", "Fatigued"].map(opt => (
            <button
              key={opt}
              onClick={() => { setMood(opt); setTimeout(() => setStep(3), 400); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                mood === opt 
                  ? "bg-[#2D1B36] text-white" 
                  : "bg-white/50 text-[#2D1B36] hover:bg-white/80 border border-white/40"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )
    },
    {
      id: "sleep",
      botText: "How many hours of sleep did you get last night?",
      renderInput: () => (
        <div className="mt-4 flex flex-col items-end w-full">
          <div className="flex items-center gap-3 w-full mb-3 bg-white/50 p-2 rounded-xl border border-white/40">
            <input
              type="range"
              min="0"
              max="12"
              step="0.5"
              value={sleepHours}
              onChange={(e) => setSleepHours(parseFloat(e.target.value))}
              className="w-full accent-pink-500"
            />
            <span className="font-semibold text-[#2D1B36] shrink-0 w-10">{sleepHours} h</span>
          </div>
          <button
            onClick={() => setStep(4)}
            className="px-4 py-2 rounded-full bg-[#2D1B36] text-white text-xs font-medium self-end"
          >
            Next
          </button>
        </div>
      )
    },
    {
      id: "weight",
      botText: "Would you like to log your weight today for PCOS tracking?",
      renderInput: () => (
        <div className="mt-4 flex flex-col items-end w-full">
          <div className="flex items-center gap-3 w-full mb-3 bg-white/50 p-2 rounded-xl border border-white/40">
             <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g. 65"
              className="w-full bg-transparent border-none outline-none text-[#2D1B36] font-medium"
            />
            <span className="text-[#2D1B36]/60 text-sm font-medium">kg</span>
          </div>
          <button
            onClick={() => setStep(5)}
            className="px-4 py-2 rounded-full bg-[#2D1B36] text-white text-xs font-medium self-end"
          >
            Next
          </button>
        </div>
      )
    },
    {
      id: "symptoms",
      botText: "Almost done! Are you experiencing any physical symptoms?",
      renderInput: () => (
        <div className="mt-4 flex flex-col items-end w-full">
          <div className="flex flex-wrap gap-2 justify-end mb-4">
            {["Cramps", "Headache", "Bloating", "Acne", "Fatigue", "Mood swings", "None"].map(sym => (
              <button
                key={sym}
                onClick={() => toggleSymptom(sym)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  symptoms.includes(sym)
                    ? "bg-pink-400 text-white shadow-md shadow-pink-400/20" 
                    : "bg-white/50 text-[#2D1B36] hover:bg-white/80 border border-white/40"
                }`}
              >
                {sym}
              </button>
            ))}
          </div>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-full bg-[#2D1B36] text-white text-xs font-medium self-end flex items-center gap-2"
          >
            <CheckCircle weight="bold" /> Complete
          </button>
        </div>
      )
    },
    {
      id: "closing",
      botText: "Thank you for checking in. Your dashboard is being updated! 🌸",
      renderInput: () => null
    }
  ];

  return (
    <div className="flex flex-col gap-4 w-full">
      <AnimatePresence mode="popLayout">
        {steps.slice(0, step + 1).map((s, index) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="flex flex-col w-full"
          >
            {/* Bot Message */}
            <div className="bg-white/70 backdrop-blur-md rounded-2xl rounded-tl-sm p-3 text-sm text-[#2D1B36] shadow-sm self-start max-w-[90%] border border-white/40 mb-2">
              {s.botText}
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
            
            {/* User Answer Summary (when moving past the step) */}
            {index < step && s.id === "flow" && (
              <div className="bg-pink-100 rounded-2xl rounded-tr-sm p-2 px-4 text-sm text-pink-900 self-end max-w-[80%] shadow-sm mb-2">
                {flow}
              </div>
            )}
            {index < step && s.id === "cramps" && (
              <div className="bg-pink-100 rounded-2xl rounded-tr-sm p-2 px-4 text-sm text-pink-900 self-end max-w-[80%] shadow-sm mb-2">
                Pain level: {cramps}
              </div>
            )}
            {index < step && s.id === "symptoms" && (
              <div className="bg-pink-100 rounded-2xl rounded-tr-sm p-2 px-4 text-sm text-pink-900 self-end max-w-[80%] shadow-sm mb-2 text-right">
                {symptoms.join(", ")}
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
