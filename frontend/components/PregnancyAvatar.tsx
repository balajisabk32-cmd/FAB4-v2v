"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PaperPlaneRight, X, Sparkle, Microphone, SpeakerSlash } from "@phosphor-icons/react";
import Image from "next/image";

export type AIState = "idle" | "listening" | "thinking" | "talking";

interface Message {
  role: "user" | "ai";
  text: string;
}

interface PregnancyAvatarProps {
  aiState?: AIState;
  onChartUpdate?: (data: any) => void;
  pregnancyContext?: any;
}

export default function PregnancyAvatar({ aiState = "idle", onChartUpdate, pregnancyContext }: PregnancyAvatarProps) {
  const [internalState, setInternalState] = useState<AIState>(aiState);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: `Hi ${pregnancyContext?.profile?.preferred_name || 'Mama'}! I'm here to support you and your baby. How are you feeling today?` }
  ]);
  const [inputValue, setInputValue] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Setup Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = "en-US";

        recognitionRef.current.onresult = (event: any) => {
          let transcript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
          }
          setInputValue(transcript);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setInputValue("");
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  // Sync external state changes
  useEffect(() => {
    if (aiState !== "idle") setInternalState(aiState);
  }, [aiState]);

  // Auto-scroll chat without moving the main page window
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isExpanded, internalState]);

  const speakText = (text: string) => {
    // Check if voice is disabled in settings
    const voiceEnabled = localStorage.getItem('sakhi_voice_enabled') !== 'false';
    if (!voiceEnabled) return;

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      const setVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        // Look for very soft, feminine voices first
        let femaleVoice = voices.find(v => 
          v.name.includes("Google UK English Female") || 
          v.name.includes("Samantha") || 
          v.name.includes("Tessa") ||
          v.name.includes("Victoria") ||
          v.name.includes("Zira")
        );
        if (!femaleVoice) femaleVoice = voices.find(v => v.name.includes("Female"));
        if (femaleVoice) utterance.voice = femaleVoice;
      };
      
      setVoice();
      window.speechSynthesis.onvoiceschanged = setVoice;

      utterance.pitch = 1.5; // High pitch for cute/soft voice
      utterance.rate = 0.9;  // Slightly slower for softness

      utterance.onstart = () => setInternalState("talking");
      utterance.onend = () => setInternalState("idle");
      utterance.onerror = () => setInternalState("idle");

      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setInternalState("idle");
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    
    const userMsg = inputValue.trim();
    setInputValue("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setInternalState("thinking");

    try {
      const res = await fetch("/api/ask-sakhi-pregnancy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMsg,
          chatHistory: messages,
          data: pregnancyContext
        })
      });
      
      const data = await res.json();
      
      if (data.reply) {
        setMessages(prev => [...prev, { role: "ai", text: data.reply }]);
        speakText(data.reply);
        
        // Simple mock detection for danger signs to trigger UI updates
        const lowerReply = data.reply.toLowerCase();
        if (lowerReply.includes("bleeding") || lowerReply.includes("hospital") || lowerReply.includes("immediately")) {
          onChartUpdate && onChartUpdate({ type: 'emergency', data: true });
        }
      }
    } catch (e) {
      console.error(e);
      setInternalState("idle");
    }
  };

  const isDollTalking = internalState === "talking";

  // Lip-sync animation logic
  const [mouthOpen, setMouthOpen] = useState(false);
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isDollTalking) {
      interval = setInterval(() => {
        setMouthOpen(prev => (Math.random() > 0.3 ? !prev : prev));
      }, 150);
    } else {
      setMouthOpen(false);
    }
    return () => clearInterval(interval);
  }, [isDollTalking]);

  return (
    <div className="w-full bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 flex flex-col md:flex-row gap-8 mb-8 overflow-hidden relative">
      
      {/* Subtle background glow when talking */}
      {isDollTalking && (
        <div className="absolute inset-0 bg-pink-100/30 animate-pulse pointer-events-none" />
      )}

      {/* Left Column: Doll Avatar */}
      <div className="w-full md:w-1/3 flex flex-col items-center justify-center relative">
        <motion.div
          animate={isDollTalking ? { y: [0, -10, 0], scale: [1, 1.02, 1] } : { y: 0, scale: 1 }}
          transition={isDollTalking ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" } : { duration: 0.5 }}
          className="relative w-64 h-64 rounded-full overflow-hidden border-8 border-white shadow-[0_10px_40px_rgba(244,114,182,0.3)] bg-pink-50"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={mouthOpen ? "/sakhi-doll-open.png" : "/sakhi-doll.png"} 
            alt="Sakhi Doll" 
            className="w-full h-full object-cover transition-opacity duration-75"
          />

          {/* Thinking Indicator Overlay */}
          {internalState === "thinking" && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/30 backdrop-blur-[2px]">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="w-12 h-12 rounded-full border-4 border-t-pink-500 border-r-transparent border-b-transparent border-l-transparent"
              />
            </div>
          )}
        </motion.div>

        <div className="mt-6 flex items-center gap-2">
          <Sparkle weight="duotone" className="text-pink-500 w-6 h-6" />
          <h3 className="text-[#2D1B36] font-semibold text-2xl tracking-tight">Sakhi <span className="text-[10px] uppercase align-middle bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full ml-1">Pregnancy</span></h3>
        </div>
        <p className="text-[#2D1B36]/60 text-sm mt-1 text-center max-w-[200px]">
          {isDollTalking ? "Speaking..." : internalState === "thinking" ? "Thinking..." : "Listening and ready to help."}
        </p>
      </div>

      {/* Right Column: Chat Interface */}
      <div className="w-full md:w-2/3 flex flex-col h-[400px] bg-white/50 rounded-[2rem] border border-white/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] p-6">
        <div className="flex flex-col h-full">
          {/* Messages Area */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto custom-scrollbar mb-4 flex flex-col gap-4 pr-2">
            {messages.map((m, i) => (
              <div 
                key={i} 
                className={`max-w-[85%] p-4 rounded-2xl text-base shadow-sm border border-white/40 ${
                  m.role === 'user' 
                    ? 'bg-pink-100/90 text-pink-900 self-end rounded-tr-sm' 
                    : 'bg-white/90 backdrop-blur-md text-[#2D1B36] self-start rounded-tl-sm'
                }`}
              >
                {m.text}
              </div>
            ))}
            {internalState === "thinking" && (
              <div className="bg-white/90 backdrop-blur-md text-[#2D1B36] self-start rounded-2xl rounded-tl-sm p-4 shadow-sm border border-white/40 flex gap-1.5 items-center">
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
          </div>
          
          {/* Input Area */}
          <div className="relative shrink-0 mt-auto">
            <div className="relative w-full">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your question or speak to me..."
                className="w-full bg-white/60 border border-[#2D1B36]/10 rounded-2xl pl-5 pr-24 py-4 text-[#2D1B36] placeholder:text-[#2D1B36]/40 focus:outline-none focus:ring-2 focus:ring-pink-300/50 transition-all text-base shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {isDollTalking && (
                  <button 
                    type="button"
                    onClick={stopSpeaking}
                    className="p-2.5 rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition-colors shadow-sm animate-pulse"
                    title="Stop speaking"
                  >
                    <SpeakerSlash weight="fill" className="w-5 h-5" />
                  </button>
                )}
                <button 
                  type="button"
                  onClick={toggleListening}
                  className={`p-2.5 rounded-full transition-all duration-300 ${isListening ? 'bg-pink-200 text-pink-600 shadow-[0_0_15px_rgba(244,114,182,0.5)] animate-pulse' : 'bg-[#2D1B36]/5 text-[#2D1B36] hover:bg-pink-100 hover:text-pink-600'}`}
                >
                  <Microphone weight={isListening ? "fill" : "regular"} className="w-5 h-5" />
                </button>
                <button 
                  type="button" 
                  onClick={handleSend}
                  disabled={!inputValue.trim() || internalState === "thinking"}
                  className="p-2.5 rounded-full bg-pink-500 text-white hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:bg-[#2D1B36]/10 disabled:text-[#2D1B36]/30 shadow-md"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
      

