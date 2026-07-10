"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
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
  SignOut,
} from "@phosphor-icons/react";
import SakhiAvatar, { AIState } from "@/components/SakhiAvatar";
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
          window.location.href = "/onboarding";
        }
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

  const handleSignOut = async () => {
    localStorage.removeItem("sakhi_last_checkin");
    await signOut({ callbackUrl: '/' });
  };

  // Merge ML predictions with existing profile data
  const pcosRiskScore = mlPredictions.pcos ? mlPredictions.pcos.probability_pcos * 100 : (isPcosRisk ? 75 : 20);
  const thyroidRiskScore = profile?.diagnosed_conditions?.includes("Hypothyroidism") ? 85 : 15;
  const cycleAvg = mlPredictions.cycle ? (profile?.cycle_length_avg || 28) : (profile?.cycle_length_avg || 28);
  const daysUntil = mlPredictions.cycle ? mlPredictions.cycle.days_until_next_period : daysUntilNext;

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
            title="Settings"
          >
            <GearSix weight="duotone" className="w-5 h-5" />
          </button>
          <button 
            onClick={handleSignOut}
            className="w-12 h-12 rounded-full bg-white/50 backdrop-blur-md border border-white/40 flex items-center justify-center text-[#2D1B36]/60 hover:text-red-500 hover:bg-white/80 transition-all shadow-sm"
            title="Sign Out"
          >
            <SignOut weight="duotone" className="w-5 h-5" />
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
        <div className="md:col-span-12 print:hidden">
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

          {/* PCOS Warning, Thyroid Warning and Export */}
          <motion.div 
            animate={pulsingChart === 'pcos' ? { scale: [1, 1.02, 1], boxShadow: ["0px 0px 0px rgba(0,0,0,0)", "0px 0px 30px rgba(239,68,68,0.4)", "0px 0px 0px rgba(0,0,0,0)"] } : {}}
            transition={{ duration: 1.5, repeat: pulsingChart === 'pcos' ? 2 : 0 }}
            className={`${cardClass} md:col-span-4`}
          >
            <div className={iconWrapClass}><WarningCircle weight="duotone" className="w-6 h-6 text-orange-500" /></div>
            <h3 className="text-xl font-medium text-[#2D1B36] mb-2">PCOS Predictor</h3>
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

          {/* Thyroid Predictor */}
          <div className={`${cardClass} md:col-span-4`}>
            <div className={iconWrapClass}><Brain weight="duotone" className="w-6 h-6 text-indigo-500" /></div>
            <h3 className="text-xl font-medium text-[#2D1B36] mb-2">Thyroid Predictor</h3>
            <div className="h-3 w-full bg-[#2D1B36]/5 rounded-full overflow-hidden mt-8 relative">
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: `${thyroidRiskScore}%` }} 
                transition={{ duration: 1.5, ease: "easeOut" }} 
                className={`h-full bg-gradient-to-r ${thyroidRiskScore > 50 ? 'from-amber-400 to-red-500' : 'from-emerald-400 to-amber-400'}`} 
              />
            </div>
            <p className="text-sm font-medium text-[#2D1B36]/60 mt-4 text-right">
              {thyroidRiskScore > 50 ? `Elevated Risk (${Math.round(thyroidRiskScore)}%)` : `Low Risk (${Math.round(thyroidRiskScore)}%)`}
            </p>
          </div>

          <div 
            onClick={() => window.print()}
            className={`${cardClass} md:col-span-4 flex flex-col justify-center items-center text-center group cursor-pointer print:hidden`}
          >
            <div className="w-20 h-20 rounded-full bg-white/50 border border-white/40 shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-md transition-all duration-500">
              <FilePdf weight="duotone" className="w-8 h-8 text-[#2D1B36]" />
            </div>
            <h3 className="text-lg font-medium text-[#2D1B36]">Doctor Summary</h3>
            <p className="text-sm text-[#2D1B36]/60 mt-2">Generate your Menstrual PDF report for your next doctor visit.</p>
          </div>
        </motion.div>

        {/* --- PRINT ONLY LAYOUT --- */}
        <div className="hidden print:block w-full px-8 text-black bg-white">
          {/* PAGE 1: Personal Details */}
          <div className="min-h-[100vh] flex flex-col justify-center" style={{ pageBreakAfter: 'always' }}>
            <div className="text-center mb-16">
              <h1 className="text-5xl font-bold mb-4 text-[#2D1B36]">Sakhi Health Report</h1>
              <p className="text-xl text-gray-500">Menstrual Health & Wellness Profile</p>
            </div>
            
            <div className="max-w-2xl mx-auto w-full bg-gray-50 rounded-2xl p-10 border border-gray-200">
              <h2 className="text-3xl font-semibold mb-8 text-[#2D1B36] border-b pb-4">Personal Details</h2>
              <div className="space-y-6 text-xl">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500 font-medium">Name</span>
                  <span className="font-semibold">{displayName}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500 font-medium">Email</span>
                  <span className="font-semibold">{session?.user?.email}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500 font-medium">Average Cycle Length</span>
                  <span className="font-semibold">{profile?.cycle_length_avg || 28} days</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500 font-medium">Period Duration</span>
                  <span className="font-semibold">{profile?.period_duration || 5} days</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500 font-medium">Diagnosed Conditions</span>
                  <span className="font-semibold">{profile?.diagnosed_conditions?.join(', ') || 'None'}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* PAGE 2: Doctor Summary */}
          <div className="min-h-[90vh] pt-12" style={{ pageBreakAfter: 'always' }}>
            <h2 className="text-4xl font-bold mb-8 text-[#2D1B36] border-b pb-4">Written Summarization</h2>
            
            <div className="bg-pink-50 rounded-2xl p-8 mb-10 border border-pink-100">
              <h3 className="text-2xl font-semibold mb-4 text-[#2D1B36]">Clinical Overview</h3>
              <p className="text-xl leading-relaxed text-[#2D1B36]/80">
                Based on recent tracking, {displayName}'s menstrual cycle is currently averaging {cycleAvg} days. 
                The patient has tracked {logs.length} daily logs over the past period.
                {isPcosRisk ? " There are indicators of elevated PCOS risk based on symptom patterns and/or clinical history." : " PCOS risk indicators appear low."}
                {profile?.diagnosed_conditions?.includes("Hypothyroidism") ? " The patient has a clinical history of Hypothyroidism which may impact cycle regularity and fatigue levels." : ""}
                {" "}The patient's next cycle is predicted to start in approximately {daysUntil} days.
              </p>
            </div>

            <h3 className="text-2xl font-semibold mt-12 mb-6 text-[#2D1B36]">Recent Daily Logs</h3>
            <table className="w-full text-left text-lg">
              <thead>
                 <tr className="bg-gray-100">
                   <th className="p-4 rounded-tl-lg font-semibold">Date</th>
                   <th className="p-4 font-semibold">Flow Intensity</th>
                   <th className="p-4 font-semibold">Cramps (0-10)</th>
                   <th className="p-4 rounded-tr-lg font-semibold">Symptoms</th>
                 </tr>
              </thead>
              <tbody>
                {logs.slice(-14).reverse().map((l: any, i: number) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="p-4 text-gray-600">{new Date(l.log_date).toLocaleDateString()}</td>
                    <td className="p-4">{l.flow_intensity}</td>
                    <td className="p-4">{l.cramps_severity}</td>
                    <td className="p-4">{l.symptoms?.join(', ') || 'None'}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500 italic">No recent logs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
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
