"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkle } from "@phosphor-icons/react";

import DailyCheckInChat from "./DailyCheckInChat";
import { useSakhiChat } from "@/hooks/useSakhiChat";

export type AIState = "idle" | "thinking" | "talking";

interface SakhiAvatarProps {
  aiState: AIState;
  checkInMode?: boolean;
  onCheckInComplete?: (data: any) => void;
  defaultOpen?: boolean;
  onChartUpdate?: (data: any) => void;
}

export default function SakhiAvatar({ aiState, checkInMode = false, onCheckInComplete, defaultOpen = false, onChartUpdate }: SakhiAvatarProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [inputVal, setInputVal] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const { messages, isLoading, sendMessage } = useSakhiChat(onChartUpdate || (() => {}));

  // Auto-open if defaultOpen changes
  useEffect(() => {
    setIsOpen(defaultOpen);
  }, [defaultOpen]);

  // Map state to video source
  const getVideoSrc = () => {
    switch (aiState) {
      case "idle":
        return "/videos/sakhi-idle.mp4";
      case "thinking":
        return "/videos/sakhi-think.mp4";
      case "talking":
        return "/videos/sakhi-talk.mp4";
      default:
        return "/videos/sakhi-idle.mp4";
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [aiState]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Chat Interface when clicked */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="mb-4 w-[340px] rounded-[2rem] bg-white/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl border border-white/40 max-h-[60vh] overflow-y-auto custom-scrollbar"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkle weight="duotone" className="text-[#2D1B36] w-6 h-6" />
              <h3 className="text-[#2D1B36] font-semibold text-lg tracking-tight">Ask Sakhi</h3>
            </div>
            
            {checkInMode ? (
              <DailyCheckInChat onComplete={(data) => {
                if (onCheckInComplete) onCheckInComplete(data);
                setTimeout(() => setIsOpen(false), 3000);
              }} />
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto custom-scrollbar mb-4 flex flex-col gap-3 min-h-[150px]">
                  {messages.length === 0 && (
                    <p className="text-[#2D1B36]/70 text-sm leading-relaxed">
                      I am here to support you. Ask me anything about your cycle, symptoms, or just say hello.
                    </p>
                  )}
                  {messages.map((m) => (
                    <div 
                      key={m.id} 
                      className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm border border-white/40 ${
                        m.role === 'user' 
                          ? 'bg-pink-100/80 text-pink-900 self-end rounded-tr-sm' 
                          : 'bg-white/70 backdrop-blur-md text-[#2D1B36] self-start rounded-tl-sm'
                      }`}
                    >
                      {m.text}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="bg-white/70 backdrop-blur-md text-[#2D1B36] self-start rounded-2xl rounded-tl-sm p-3 shadow-sm border border-white/40 flex gap-1 items-center">
                      <div className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}
                </div>
                
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage(inputVal);
                    setInputVal("");
                  }} 
                  className="relative shrink-0"
                >
                  <input
                    type="text"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    placeholder="Type your question gently..."
                    className="w-full bg-white/40 border border-[#2D1B36]/10 rounded-2xl px-4 py-3 text-[#2D1B36] placeholder:text-[#2D1B36]/40 focus:outline-none focus:ring-2 focus:ring-pink-300/50 transition-all text-sm"
                  />
                  <button 
                    type="submit" 
                    disabled={!inputVal.trim() || isLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-[#2D1B36]/5 text-[#2D1B36] hover:bg-[#2D1B36]/10 transition-colors disabled:opacity-50"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                    </svg>
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar Widget */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative w-20 h-20 rounded-full overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.1)] border-4 border-white cursor-pointer bg-[#FAF8F5] flex items-center justify-center"
      >
        {/* Subtle glassmorphic fallback glow if video fails or is missing */}
        <div className="absolute inset-0 bg-gradient-to-tr from-pink-100 to-indigo-100 opacity-50" />
        
        {/* Pre-rendered Video Loop */}
        <video
          ref={videoRef}
          src={getVideoSrc()}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover relative z-10"
        />
        
        {/* Thinking Indicator Overlay */}
        {aiState === "thinking" && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/20 backdrop-blur-[2px]">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="w-8 h-8 rounded-full border-2 border-t-pink-400 border-r-transparent border-b-transparent border-l-transparent"
            />
          </div>
        )}
      </motion.button>
    </div>
  );
}
