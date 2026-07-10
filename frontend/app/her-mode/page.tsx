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
import OnboardingChat from "@/components/OnboardingChat";
import {
  CycleLengthChart,
  PeriodDurationChart,
  SymptomFrequencyChart,
  MoodCycleChart,
  FlowIntensityChart,
  OvulationCalendar,
  PainTrendChart,
  WeightTrendChart,
  SleepHoursChart
} from "@/components/charts/DashboardCharts";
import SettingsModal from "@/components/SettingsModal";
import { useHerNotifications } from "@/hooks/useHerNotifications";
import HerNotificationCenter from "@/components/HerNotificationCenter";

const cardClass = "bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 relative overflow-hidden";
const innerCardClass = "bg-white/50 backdrop-blur-sm rounded-[2rem] border border-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] p-6 flex flex-col justify-between";
const iconWrapClass = "w-12 h-12 rounded-full bg-[#2D1B36]/5 flex items-center justify-center text-[#2D1B36] mb-4";

export default function HerModePage() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [isCheckingData, setIsCheckingData] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [cycleHistory, setCycleHistory] = useState<any[]>([]);
  const [aiState, setAiState] = useState<AIState>("idle");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [mlPredictions, setMlPredictions] = useState<any>({});
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Initialize notification hook
  const { 
    preferences, reminders, toggleMaster, updatePreference, 
    markCompleted, snoozeReminder, deleteReminder 
  } = useHerNotifications(profile, logs, cycleHistory);
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
        setCycleHistory(data.cycleHistory || []);
        if (!data.profile.preferred_name) {
          setShowOnboarding(true);
        }
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setIsCheckingData(false);
    }
  };

  useEffect(() => {
    if (!isCheckingData && !showOnboarding) {
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

  const handleOnboardingComplete = (data: any) => {
    setProfile((prev: any) => ({
      ...prev,
      preferred_name: data.name,
      cycle_length_avg: data.cycleLength,
      period_duration: data.periodDuration
    }));
    setShowOnboarding(false);
  };

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

  if (showOnboarding) {
    return (
      <div className="min-h-[100dvh] bg-[#FAF8F5] selection:bg-[#2D1B36]/10 font-sans relative flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8">
           <OnboardingChat onComplete={handleOnboardingComplete} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#FAF8F5] selection:bg-[#2D1B36]/10 font-sans relative">
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
        
        <div className="hidden sm:flex items-center gap-3 relative">
          <button 
            onClick={() => setIsNotificationOpen(true)}
            className="w-12 h-12 rounded-full bg-white/50 backdrop-blur-md border border-white/40 flex items-center justify-center text-[#2D1B36]/60 hover:text-[#2D1B36] hover:bg-white/80 transition-all shadow-sm relative"
          >
            <Bell weight="duotone" className="w-5 h-5" />
            {reminders.filter(r => r.status === 'missed').length > 0 && (
              <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-white" />
            )}
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-12 h-12 rounded-full bg-white/50 backdrop-blur-md border border-white/40 flex items-center justify-center text-[#2D1B36]/60 hover:text-[#2D1B36] hover:bg-white/80 transition-all shadow-sm"
          >
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
          {/* Main AI Avatar Section */}
        <div className="md:col-span-12">
          <SakhiAvatar 
            aiState={aiState} 
            checkInMode={showCheckIn} 
            onCheckInComplete={handleCheckInComplete} 
            defaultOpen={showCheckIn}
            onChartUpdate={handleChartUpdate}
            profileName={profile?.preferred_name}
          />
        </div>

          {/* Ovulation Calendar */}
          <div className={`${cardClass} md:col-span-12`}>
            <div className="flex items-center gap-3 mb-2">
              <Calendar weight="duotone" className="w-6 h-6 text-emerald-400" />
              <span className="text-sm font-medium tracking-widest uppercase text-[#2D1B36]/60">Ovulation & Fertile Window</span>
            </div>
            <h2 className="text-2xl font-light tracking-tight text-[#2D1B36]">Your Window Calendar</h2>
            <OvulationCalendar profile={profile} />
          </div>

          {/* Row 1: Cycles & Periods */}
          <div className={`${cardClass} md:col-span-6`}>
            <h3 className="text-xl font-medium text-[#2D1B36] mb-4">Cycle Length Trend</h3>
            <CycleLengthChart data={cycleHistory} />
          </div>
          
          <div className={`${cardClass} md:col-span-6`}>
             <h3 className="text-xl font-medium text-[#2D1B36] mb-4">Period Duration Trend</h3>
             <PeriodDurationChart data={cycleHistory} />
          </div>

          {/* Row 2: Symptoms & Mood */}
          <div className={`${cardClass} md:col-span-6`}>
            <h3 className="text-xl font-medium text-[#2D1B36] mb-4">Common Symptoms</h3>
            <SymptomFrequencyChart data={logs} />
          </div>

          <div className={`${cardClass} md:col-span-6`}>
            <h3 className="text-xl font-medium text-[#2D1B36] mb-4">Mood vs Cycle Phase</h3>
            <MoodCycleChart data={logs} />
          </div>

          {/* Row 3: Flow & Pain */}
          <div className={`${cardClass} md:col-span-6`}>
            <h3 className="text-xl font-medium text-[#2D1B36] mb-4">Flow Intensity</h3>
            <FlowIntensityChart data={logs} />
          </div>

          <div className={`${cardClass} md:col-span-6`}>
            <h3 className="text-xl font-medium text-[#2D1B36] mb-4">Pain Trend</h3>
            <PainTrendChart data={logs} />
          </div>

          {/* Row 4: Weight & Sleep */}
          <div className={`${cardClass} md:col-span-6`}>
             <h3 className="text-xl font-medium text-[#2D1B36] mb-4">Weight Trend</h3>
             <WeightTrendChart data={logs} />
          </div>

          <div className={`${cardClass} md:col-span-6`}>
             <h3 className="text-xl font-medium text-[#2D1B36] mb-4">Sleep Hours</h3>
             <SleepHoursChart data={logs} />
          </div>

          {/* PCOS Warning and Export */}
          <motion.div 
            animate={pulsingChart === 'pcos' ? { scale: [1, 1.02, 1], boxShadow: ["0px 0px 0px rgba(0,0,0,0)", "0px 0px 30px rgba(239,68,68,0.4)", "0px 0px 0px rgba(0,0,0,0)"] } : {}}
            transition={{ duration: 1.5, repeat: pulsingChart === 'pcos' ? 2 : 0 }}
            className={`${cardClass} md:col-span-6`}
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

          <div 
            onClick={() => window.print()}
            className={`${cardClass} md:col-span-6 flex flex-col justify-center items-center text-center group cursor-pointer no-print`}
          >
            <div className="w-20 h-20 rounded-full bg-white/50 border border-white/40 shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-md transition-all duration-500">
              <FilePdf weight="duotone" className="w-8 h-8 text-[#2D1B36]" />
            </div>
            <h3 className="text-lg font-medium text-[#2D1B36]">Doctor Summary</h3>
            <p className="text-sm text-[#2D1B36]/60 mt-2">Generate your Menstrual PDF report for your next doctor visit.</p>
          </div>
        </motion.div>
      </main>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        mode="her" 
        currentData={profile} 
      />

      <HerNotificationCenter 
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        preferences={preferences}
        reminders={reminders}
        onToggleMaster={toggleMaster}
        onUpdatePref={updatePreference}
        onMarkCompleted={markCompleted}
        onSnooze={snoozeReminder}
        onDelete={deleteReminder}
      />
    </div>
  );
}
