"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  Bell,
  GearSix,
  Drop,
  Calendar,
  Sparkle,
  Brain,
  WarningCircle,
  FilePdf,
  Baby,
  Heartbeat,
} from "@phosphor-icons/react";
import SakhiAvatar, { AIState } from "@/components/SakhiAvatar";
import CycleTimeline from "@/components/charts/CycleTimeline";
import SymptomRadar from "@/components/charts/SymptomRadar";
import PainFlowCorrelation from "@/components/charts/PainFlowCorrelation";

const cardClass = "bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 relative overflow-hidden";
const innerCardClass = "bg-white/50 backdrop-blur-sm rounded-[2rem] border border-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] p-6 flex flex-col justify-between";
const iconWrapClass = "w-12 h-12 rounded-full bg-[#2D1B36]/5 flex items-center justify-center text-[#2D1B36] mb-4";

export default function HerModePage() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [isCheckingData, setIsCheckingData] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [aiState, setAiState] = useState<AIState>("idle");
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [mlPredictions, setMlPredictions] = useState<any>({});
  const [pulsingChart, setPulsingChart] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === "authenticated" || status === "unauthenticated") {
      fetchDashboardData();
    }
  }, [status]);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/dashboard-data");
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setIsCheckingData(false);
    }
  };

  useEffect(() => {
    if (!isCheckingData) {
      const todayStr = new Date().toISOString().split("T")[0];
      const lastCheckIn = localStorage.getItem("sakhi_last_checkin");
      if (lastCheckIn !== todayStr) {
        // Trigger chatbot check-in
        setShowCheckIn(true);
        setAiState("talking");
      }
    }
  }, [isCheckingData]);

  if (!mounted || isCheckingData) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <Sparkle weight="duotone" className="w-12 h-12 text-pink-400 animate-pulse opacity-50" />
      </div>
    );
  }

  const displayName = profile?.preferred_name || session?.user?.name?.split(" ")[0] || "Beautiful";
  
  // Calculate next period
  const startDate = profile ? new Date(profile.last_period_start) : new Date();
  const nextPeriod = new Date(startDate);
  nextPeriod.setDate(startDate.getDate() + (profile?.cycle_length_avg || 28));
  const today = new Date();
  const diffTime = nextPeriod.getTime() - today.getTime();
  const daysUntilNext = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isPcosRisk = profile?.diagnosed_conditions?.includes("PCOS") || profile?.cycle_regularity === "No";

  const handleCheckInComplete = async (data: any) => {
    setAiState("thinking");
    
    // Optimistic cache update for the charts
    const newLog = {
      log_date: new Date().toISOString(),
      flow_intensity: data.flowIntensity,
      cramps_severity: data.crampsSeverity,
      symptoms: data.symptoms
    };
    
    // Add to local state immediately so Recharts re-render
    setLogs(prev => [...prev, newLog]);
    
    try {
      // POST to backend
      await fetch("/api/daily-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLog)
      });
      
      // Mark as done for today
      localStorage.setItem("sakhi_last_checkin", new Date().toISOString().split("T")[0]);
      
      // Re-fetch to ensure sync
      fetchDashboardData();
    } catch (e) {
      console.error(e);
    }
    
    setAiState("idle");
    setShowCheckIn(false);
  };

  const handleChartUpdate = (data: any) => {
    if (data.type === 'pcos') {
      setMlPredictions((prev: any) => ({ ...prev, pcos: data.data }));
      setPulsingChart('pcos');
    } else if (data.type === 'cycle') {
      setMlPredictions((prev: any) => ({ ...prev, cycle: data.data }));
      setPulsingChart('cycle');
    }
    setTimeout(() => setPulsingChart(null), 3000);
  };

  // Merge ML predictions with existing profile data
  const pcosRiskScore = mlPredictions.pcos ? mlPredictions.pcos.probability_pcos * 100 : (isPcosRisk ? 75 : 20);
  const cycleAvg = mlPredictions.cycle ? (profile?.cycle_length_avg || 28) : (profile?.cycle_length_avg || 28);
  const daysUntil = mlPredictions.cycle ? mlPredictions.cycle.days_until_next_period : daysUntilNext;

  return (
    <div className="min-h-[100dvh] bg-[#FAF8F5] selection:bg-[#2D1B36]/10 font-sans relative">
      <SakhiAvatar 
        aiState={aiState} 
        checkInMode={showCheckIn} 
        defaultOpen={showCheckIn} 
        onCheckInComplete={handleCheckInComplete} 
        onChartUpdate={handleChartUpdate}
      />

      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-white/50 border border-white/40 shadow-sm shrink-0">
            {session?.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt="User" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#2D1B36]/30">
                <Baby className="w-6 h-6" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-light tracking-tight text-[#2D1B36] flex items-center gap-2">
              Good morning, {displayName} 
              <span className="inline-block hover:rotate-12 hover:scale-110 cursor-pointer transition-all duration-300">🌸</span>
            </h1>
            <p className="text-sm text-[#2D1B36]/50 mt-1">Your Her Mode wellness summary.</p>
          </div>
        </div>
        
        <div className="hidden sm:flex items-center gap-3">
          <button className="w-12 h-12 rounded-full bg-white/50 backdrop-blur-md border border-white/40 flex items-center justify-center text-[#2D1B36]/60 hover:text-[#2D1B36] hover:bg-white/80 transition-all hover:scale-105 active:scale-95 shadow-sm">
            <Bell weight="duotone" className="w-5 h-5" />
          </button>
          <button className="w-12 h-12 rounded-full bg-white/50 backdrop-blur-md border border-white/40 flex items-center justify-center text-[#2D1B36]/60 hover:text-[#2D1B36] hover:bg-white/80 transition-all hover:scale-105 active:scale-95 shadow-sm">
            <GearSix weight="duotone" className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 pb-24"
        >
          {/* Primary Row */}
          <div className={`${cardClass} md:col-span-8 flex flex-col justify-between`}>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
                <span className="text-sm font-medium tracking-widest uppercase text-[#2D1B36]/60">Cycle Intelligence</span>
              </div>
              <h2 className="text-4xl font-light tracking-tight text-[#2D1B36]">Your Cycle Timeline</h2>
              <p className="text-[#2D1B36]/70 mt-4 max-w-md leading-relaxed">Mapping your hormonal rhythm based on your personalized data.</p>
            </div>
            
            {profile && (
              <CycleTimeline 
                lastPeriodStart={profile.last_period_start} 
                cycleLengthAvg={profile.cycle_length_avg} 
              />
            )}
            
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              <motion.div 
                animate={pulsingChart === 'cycle' ? { scale: [1, 1.05, 1], boxShadow: ["0px 0px 0px rgba(0,0,0,0)", "0px 0px 20px rgba(244,114,182,0.6)", "0px 0px 0px rgba(0,0,0,0)"] } : {}}
                transition={{ duration: 1.5, repeat: pulsingChart === 'cycle' ? 2 : 0 }}
                className={innerCardClass}
              >
                <Calendar weight="duotone" className="w-8 h-8 text-pink-400 mb-6" />
                <div>
                  <h4 className="text-2xl font-semibold text-[#2D1B36] tracking-tight">{daysUntil > 0 ? `${daysUntil} Days` : 'Due'}</h4>
                  <p className="text-sm text-[#2D1B36]/60 mt-1">Next Period</p>
                </div>
              </motion.div>
              <div className={innerCardClass}>
                <Sparkle weight="duotone" className="w-8 h-8 text-purple-400 mb-6" />
                <div>
                  <h4 className="text-xl font-semibold text-[#2D1B36] tracking-tight">{cycleAvg} Days</h4>
                  <p className="text-sm text-[#2D1B36]/60 mt-1">Avg Cycle</p>
                </div>
              </div>
              <div className={innerCardClass}>
                <Heartbeat weight="duotone" className="w-8 h-8 text-rose-400 mb-6" />
                <div>
                  <h4 className="text-xl font-semibold text-[#2D1B36] tracking-tight">{profile?.period_duration || 5} Days</h4>
                  <p className="text-sm text-[#2D1B36]/60 mt-1">Avg Duration</p>
                </div>
              </div>
            </div>
          </div>

          <div className={`${cardClass} md:col-span-4 flex flex-col items-center justify-center text-center bg-gradient-to-b from-[#2D1B36]/5 to-transparent group`}>
            <div className="w-24 h-24 rounded-full bg-white/60 shadow-[0_0_40px_rgba(201,168,247,0.3)] flex items-center justify-center mb-6 cursor-pointer group-hover:scale-105 transition-transform duration-500">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#2D1B36]">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM12 16v-4M12 8h.01" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-[#2D1B36]">AI Triage</h3>
            <p className="text-sm text-[#2D1B36]/60 mt-2">Tap to report symptoms via voice</p>
          </div>

          {/* Secondary Data Row */}
          <div className={`${cardClass} md:col-span-6`}>
            <div className="flex items-center justify-between mb-2">
              <div className={iconWrapClass}><Drop weight="duotone" className="w-6 h-6" /></div>
              <span className="text-xs font-medium uppercase tracking-wider text-[#2D1B36]/40">Flow & Pain (Last 7 Days)</span>
            </div>
            <h3 className="text-xl font-medium text-[#2D1B36]">Correlation History</h3>
            <PainFlowCorrelation logs={logs} />
          </div>

          <div className={`${cardClass} md:col-span-6`}>
            <div className="flex items-center justify-between mb-2">
              <div className={iconWrapClass}><Heartbeat weight="duotone" className="w-6 h-6" /></div>
              <span className="text-xs font-medium uppercase tracking-wider text-[#2D1B36]/40">Symptom Tracking</span>
            </div>
            <h3 className="text-xl font-medium text-[#2D1B36]">Symptom Frequency</h3>
            <SymptomRadar logs={logs} />
          </div>

          {/* Tertiary Row */}
          <div className={`${cardClass} md:col-span-4 bg-[#2D1B36] text-[#FAF8F5]`}>
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-6"><Brain weight="duotone" className="w-6 h-6 text-[#FAF8F5]" /></div>
            <h3 className="text-2xl font-light tracking-tight mb-3">Pattern Detected</h3>
            <p className="text-sm text-white/70 leading-relaxed">
              Based on your real data, we noticed patterns correlating your mood and fatigue. Consider resting more during the first two days of your cycle.
            </p>
          </div>

          <motion.div 
            animate={pulsingChart === 'pcos' ? { scale: [1, 1.02, 1], boxShadow: ["0px 0px 0px rgba(0,0,0,0)", "0px 0px 30px rgba(239,68,68,0.4)", "0px 0px 0px rgba(0,0,0,0)"] } : {}}
            transition={{ duration: 1.5, repeat: pulsingChart === 'pcos' ? 2 : 0 }}
            className={`${cardClass} md:col-span-4`}
          >
            <div className={iconWrapClass}><WarningCircle weight="duotone" className="w-6 h-6 text-orange-500" /></div>
            <h3 className="text-xl font-medium text-[#2D1B36] mb-2">PCOS Risk Indicator</h3>
            <div className="h-3 w-full bg-[#2D1B36]/5 rounded-full overflow-hidden mt-8 relative">
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: `${pcosRiskScore}%` }} 
                transition={{ duration: 1.5, ease: "easeOut" }} 
                className={`h-full bg-gradient-to-r ${pcosRiskScore > 50 ? 'from-amber-400 to-red-500' : 'from-emerald-400 to-amber-400'}`} 
              />
            </div>
            <p className="text-sm font-medium text-[#2D1B36]/60 mt-4 text-right">
              {pcosRiskScore > 50 ? `Elevated Risk (${Math.round(pcosRiskScore)}%)` : `Low Risk (${Math.round(pcosRiskScore)}%)`}
            </p>
          </motion.div>

          <div className={`${cardClass} md:col-span-4 flex flex-col justify-center items-center text-center group cursor-pointer`}>
            <div className="w-20 h-20 rounded-full bg-white/50 border border-white/40 shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-md transition-all duration-500">
              <FilePdf weight="duotone" className="w-8 h-8 text-[#2D1B36]" />
            </div>
            <h3 className="text-lg font-medium text-[#2D1B36]">Doctor Summary</h3>
            <p className="text-sm text-[#2D1B36]/60 mt-2">Generate your real data PDF report for your next visit.</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
