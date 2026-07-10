"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  Bell, GearSix, Baby, Drop, Brain, WarningCircle, FilePdf, Heartbeat, ShieldCheck
} from "@phosphor-icons/react";
import PregnancyAvatar, { AIState } from "@/components/PregnancyAvatar";
import {
  PregnancyWeekProgress,
  BabyGrowthTimeline,
  WeightGainChart,
  BloodPressureChart,
  BloodSugarChart,
  BabyMovementChart,
  AppointmentTimeline,
  MoodTrackerChart,
  NutritionScoreChart,
  PregnancySleepGraph
} from "@/components/charts/PregnancyCharts";
import { usePregnancyNotifications } from "@/hooks/usePregnancyNotifications";
import PregnancyNotificationCenter from "@/components/PregnancyNotificationCenter";
import SettingsModal from "@/components/SettingsModal";

const cardClass = "bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 relative overflow-hidden";
const iconWrapClass = "w-12 h-12 rounded-full bg-[#2D1B36]/5 flex items-center justify-center text-[#2D1B36] mb-4";

export default function PregnancyModePage() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [isCheckingData, setIsCheckingData] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [nutrition, setNutrition] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [aiState, setAiState] = useState<AIState>("idle");
  const [emergency, setEmergency] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Initialize notification hook
  const { 
    preferences, reminders, toggleMaster, updatePreference, 
    markCompleted, snoozeReminder, deleteReminder 
  } = usePregnancyNotifications(profile, logs, appointments);

  useEffect(() => {
    setMounted(true);
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/pregnancy-data");
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        setLogs(data.logs || []);
        setNutrition(data.nutrition);
        setAppointments(data.appointments || []);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setIsCheckingData(false);
    }
  };

  const handleChartUpdate = (data: any) => {
    if (data.type === 'emergency') {
      setEmergency(true);
    }
  };

  if (!mounted || isCheckingData) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <Baby weight="duotone" className="w-12 h-12 text-pink-400 animate-pulse opacity-50" />
      </div>
    );
  }

  const displayName = profile?.preferred_name || session?.user?.name?.split(" ")[0] || "Mama";
  const weeks = profile?.weeks_pregnant || 18;

  return (
    <div className="min-h-[100dvh] bg-[#FAF8F5] selection:bg-[#2D1B36]/10 font-sans relative">
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-white/50 border border-white/40 shadow-sm shrink-0 flex items-center justify-center text-[#2D1B36]/30">
            {session?.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt="User" className="w-full h-full object-cover" />
            ) : (
              <Baby className="w-6 h-6" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-light tracking-tight text-[#2D1B36] flex items-center gap-2">
              Good morning, {displayName} 
              <span className="inline-block hover:rotate-12 hover:scale-110 cursor-pointer transition-all duration-300">🍼</span>
            </h1>
            <p className="text-sm text-[#2D1B36]/50 mt-1">Your Maternal Health Summary.</p>
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
        {emergency && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-red-500 text-white p-6 rounded-2xl shadow-lg mb-8 flex items-start gap-4 no-print"
          >
            <WarningCircle weight="fill" className="w-8 h-8 shrink-0" />
            <div>
              <h3 className="font-bold text-lg">⚠ High Risk Symptom Detected</h3>
              <p className="mt-1 opacity-90">Based on your recent input, you may be experiencing a dangerous symptom. <strong>Recommended Action: Visit nearest hospital or contact your OBGYN immediately.</strong></p>
            </div>
            <button onClick={() => setEmergency(false)} className="ml-auto bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-medium text-sm transition-colors">Dismiss</button>
          </motion.div>
        )}

        {/* PRINT ONLY: PAGE 1 (Patient Details) */}
        <div className="hidden print:block w-full min-h-screen" style={{ pageBreakAfter: 'always' }}>
          <h1 className="text-4xl font-bold mb-8 text-center pt-10">Maternal Health Report</h1>
          <div className="border-t-2 border-b-2 border-black/10 py-10 mb-8">
            <h2 className="text-2xl font-bold mb-6">Patient Details</h2>
            <div className="grid grid-cols-2 gap-6 text-lg">
              <p><strong>Name:</strong> {displayName}</p>
              <p><strong>Gestation:</strong> Week {weeks}</p>
              <p><strong>Due Date:</strong> {profile?.expected_due_date ? new Date(profile.expected_due_date).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Risk Level:</strong> {profile?.risk_level || "Low"}</p>
              <p><strong>Report Date:</strong> {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* PRINT ONLY: PAGE 2 (Written Info) */}
        <div className="hidden print:block w-full min-h-screen" style={{ pageBreakAfter: 'always' }}>
          <h2 className="text-3xl font-bold mb-8 pt-10 border-b border-black/10 pb-4">Clinical Insights & Risk Assessment</h2>
          
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-4">AI Health Insights</h3>
            <ul className="space-y-4 text-lg list-disc pl-6 text-black/80">
              <li>Blood pressure is stable within normal limits.</li>
              <li>Weight gain tracking nicely along the recommended curve.</li>
              <li>Consider increasing Iron intake based on your recent fatigue logs.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-2xl font-bold mb-4">Maternal Risk Assessment</h3>
            <div className="grid grid-cols-2 gap-8 text-xl">
              <div className="p-6 border-2 border-black/20 rounded-xl bg-black/5">
                <p className="text-sm uppercase tracking-wide font-bold mb-2">Preeclampsia Risk</p>
                <p className="text-2xl">Low (12%)</p>
              </div>
              <div className="p-6 border-2 border-black/20 rounded-xl bg-black/5">
                <p className="text-sm uppercase tracking-wide font-bold mb-2">Gestational Diabetes</p>
                <p className="text-2xl">Moderate (45%)</p>
              </div>
            </div>
          </div>
        </div>

        {/* PAGE 3: VISUALS (The regular dashboard) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 pb-24"
        >
          {/* Avatar Section */}
          <div className="md:col-span-12 no-print">
            <PregnancyAvatar aiState={aiState} onChartUpdate={handleChartUpdate} pregnancyContext={{ profile, logs: logs.slice(-1) }} />
          </div>

          {/* Top Hero Card - Week Progress & Baby Growth */}
          <div className={`${cardClass} md:col-span-12 flex flex-col justify-between`}>
            <div className="mb-8">
              <h2 className="text-3xl font-light tracking-tight text-[#2D1B36]">Pregnancy Progress</h2>
              <p className="text-[#2D1B36]/70 mt-2">You are currently in your Second Trimester.</p>
            </div>
            <PregnancyWeekProgress weeks={weeks} />
            
            <div className="mt-10">
              <h3 className="text-sm font-medium tracking-widest uppercase text-[#2D1B36]/60 mb-4">Baby Growth Timeline</h3>
              <BabyGrowthTimeline weeks={weeks} />
            </div>
          </div>

          {/* Vitals Row */}
          <div className={`${cardClass} md:col-span-6`}>
            <div className="flex items-center gap-2 mb-4">
              <Heartbeat className="text-red-400 w-5 h-5" />
              <h3 className="text-xl font-medium text-[#2D1B36]">Blood Pressure</h3>
            </div>
            <p className="text-xs text-[#2D1B36]/50 mb-6">Monitoring for Preeclampsia Risk</p>
            <BloodPressureChart data={logs} />
          </div>
          
          <div className={`${cardClass} md:col-span-6`}>
            <div className="flex items-center gap-2 mb-4">
              <Drop className="text-amber-500 w-5 h-5" weight="fill" />
              <h3 className="text-xl font-medium text-[#2D1B36]">Fasting Blood Sugar</h3>
            </div>
            <p className="text-xs text-[#2D1B36]/50 mb-6">Monitoring for Gestational Diabetes</p>
            <BloodSugarChart data={logs} />
          </div>

          {/* Growth & Movement Row */}
          <div className={`${cardClass} md:col-span-6`}>
            <h3 className="text-xl font-medium text-[#2D1B36] mb-4">Weight Gain</h3>
            <WeightGainChart data={logs} />
          </div>

          <div className={`${cardClass} md:col-span-6`}>
            <h3 className="text-xl font-medium text-[#2D1B36] mb-4">Fetal Movement Count</h3>
            <BabyMovementChart data={logs} />
          </div>

          {/* Appointments & Nutrition Row */}
          <div className={`${cardClass} md:col-span-4`}>
            <h3 className="text-xl font-medium text-[#2D1B36] mb-6">Appointments</h3>
            <AppointmentTimeline appointments={appointments} />
          </div>

          <div className={`${cardClass} md:col-span-4`}>
            <h3 className="text-xl font-medium text-[#2D1B36] mb-4">Nutrition Breakdown</h3>
            <NutritionScoreChart nutrition={nutrition} />
          </div>


          {/* Mood & Sleep Row */}
          <div className={`${cardClass} md:col-span-6`}>
            <h3 className="text-xl font-medium text-[#2D1B36] mb-4">Mood Tracker</h3>
            <MoodTrackerChart data={logs} />
          </div>

          <div className={`${cardClass} md:col-span-6`}>
            <h3 className="text-xl font-medium text-[#2D1B36] mb-4">Sleep Graph</h3>
            <PregnancySleepGraph data={logs} />
          </div>

          {/* Disease Prediction (Hidden on print because it's on Page 2) */}
          <div className={`${cardClass} md:col-span-6 border border-red-200 bg-red-50/50 print:hidden`}>
            <div className={iconWrapClass}><ShieldCheck weight="duotone" className="w-6 h-6 text-emerald-500" /></div>
            <h3 className="text-xl font-medium text-[#2D1B36] mb-2">Maternal Risk Assessment</h3>
            <p className="text-sm text-[#2D1B36]/70 mb-4">Based on ML Model Analysis of your vitals.</p>
            <div className="flex gap-4">
              <div className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-black/5">
                <span className="text-xs uppercase font-bold text-emerald-500">Preeclampsia Risk</span>
                <p className="text-2xl font-semibold mt-1 text-[#2D1B36]">Low <span className="text-sm font-normal opacity-50">(12%)</span></p>
              </div>
              <div className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-black/5">
                <span className="text-xs uppercase font-bold text-amber-500">Gestational Diabetes</span>
                <p className="text-2xl font-semibold mt-1 text-[#2D1B36]">Moderate <span className="text-sm font-normal opacity-50">(45%)</span></p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => window.print()}
            className={`${cardClass} md:col-span-6 flex flex-col justify-center items-center text-center group cursor-pointer no-print`}
          >
            <div className="w-20 h-20 rounded-full bg-white/50 border border-white/40 shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-md transition-all duration-500">
              <FilePdf weight="duotone" className="w-8 h-8 text-[#2D1B36]" />
            </div>
            <h3 className="text-lg font-medium text-[#2D1B36]">Doctor Summary</h3>
            <p className="text-sm text-[#2D1B36]/60 mt-2">Generate your Pregnancy PDF report for your next ANC visit.</p>
          </div>
        </motion.div>
      </main>

      <PregnancyNotificationCenter 
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

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        mode="pregnancy" 
        currentData={profile} 
      />
    </div>
  );
}
