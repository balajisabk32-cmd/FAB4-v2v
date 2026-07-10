"use client";

import React from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Cell, ReferenceLine
} from "recharts";

const chartConfig = {
  stroke: "#c084fc", // purple-400
  fill: "#fbcfe8",   // pink-200
  grid: "rgba(255,255,255,0.2)",
  text: "#2D1B36"
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-white/50 text-sm text-[#2D1B36]">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color || chartConfig.text }}>
            {p.name}: <span className="font-semibold">{p.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// 1. Cycle Length Trend
export const CycleLengthChart = ({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={250}>
    <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke={chartConfig.grid} vertical={false} />
      <XAxis dataKey="month" stroke={chartConfig.text} opacity={0.6} fontSize={12} tickLine={false} axisLine={false} />
      <YAxis stroke={chartConfig.text} opacity={0.6} fontSize={12} tickLine={false} axisLine={false} />
      <Tooltip content={<CustomTooltip />} />
      <Line type="monotone" dataKey="cycleLength" name="Cycle Length (Days)" stroke="#ec4899" strokeWidth={3} dot={{ r: 4, fill: "#ec4899" }} activeDot={{ r: 6 }} />
    </LineChart>
  </ResponsiveContainer>
);

// 2. Period Duration Trend
export const PeriodDurationChart = ({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={250}>
    <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke={chartConfig.grid} vertical={false} />
      <XAxis dataKey="month" stroke={chartConfig.text} opacity={0.6} fontSize={12} tickLine={false} axisLine={false} />
      <YAxis stroke={chartConfig.text} opacity={0.6} fontSize={12} tickLine={false} axisLine={false} />
      <Tooltip content={<CustomTooltip />} />
      <Line type="stepAfter" dataKey="periodDuration" name="Bleeding Days" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, fill: "#f43f5e" }} />
    </LineChart>
  </ResponsiveContainer>
);

// 3. Symptom Frequency
export const SymptomFrequencyChart = ({ data }: { data: any[] }) => {
  // Aggregate symptoms from logs
  const symMap: any = {};
  data.forEach(log => {
    if (log.symptoms) {
      log.symptoms.forEach((s: string) => {
        if (s !== 'None') symMap[s] = (symMap[s] || 0) + 1;
      });
    }
  });
  const chartData = Object.keys(symMap).map(k => ({ name: k, count: symMap[k] })).sort((a,b) => b.count - a.count).slice(0, 5);

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartConfig.grid} vertical={false} />
        <XAxis dataKey="name" stroke={chartConfig.text} opacity={0.6} fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke={chartConfig.text} opacity={0.6} fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.4)' }} />
        <Bar dataKey="count" name="Days Experienced" fill="#a78bfa" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

// 4. Mood vs Cycle Phase
export const MoodCycleChart = ({ data }: { data: any[] }) => {
  // Map mood to a numerical value for the line chart
  const moodScore: any = { "Happy": 5, "Calm": 4, "Fatigued": 3, "Anxious": 2, "Irritable": 1, "Sad": 0 };
  const moodColors: any = { 5: "#34d399", 4: "#60a5fa", 3: "#fbbf24", 2: "#f97316", 1: "#ef4444", 0: "#64748b" };
  
  const chartData = data.slice(-14).map(log => ({
    date: new Date(log.log_date).getDate().toString(),
    moodVal: moodScore[log.mood] !== undefined ? moodScore[log.mood] : null,
    moodName: log.mood
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartConfig.grid} vertical={false} />
        <XAxis dataKey="date" stroke={chartConfig.text} opacity={0.6} fontSize={12} tickLine={false} axisLine={false} />
        <YAxis domain={[0, 5]} ticks={[0,1,2,3,4,5]} stroke={chartConfig.text} opacity={0.6} fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => Object.keys(moodScore).find(k => moodScore[k] === val) || ""} />
        <Tooltip content={<CustomTooltip />} />
        <Line type="monotone" dataKey="moodVal" name="Mood" stroke="#818cf8" strokeWidth={2} dot={(props: any) => {
          const { cx, cy, payload } = props;
          return <circle cx={cx} cy={cy} r={5} fill={moodColors[payload.moodVal] || "#000"} stroke="none" />;
        }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

// 5. Flow Intensity
export const FlowIntensityChart = ({ data }: { data: any[] }) => {
  const flowScore: any = { "None": 0, "Spotting": 1, "Light": 2, "Moderate": 3, "Heavy": 4, "Very Heavy": 5 };
  const chartData = data.slice(-14).map(log => ({
    date: new Date(log.log_date).getDate().toString(),
    intensity: flowScore[log.flow_intensity] || 0,
    flowName: log.flow_intensity
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartConfig.grid} vertical={false} />
        <XAxis dataKey="date" stroke={chartConfig.text} opacity={0.6} fontSize={12} tickLine={false} axisLine={false} />
        <YAxis domain={[0, 5]} ticks={[0,1,2,3,4,5]} stroke={chartConfig.text} opacity={0.6} fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => Object.keys(flowScore).find(k => flowScore[k] === val) || ""} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.4)' }} />
        <Bar dataKey="intensity" name="Flow" fill="#fda4af" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.intensity > 3 ? "#e11d48" : entry.intensity > 1 ? "#fb7185" : "#ffe4e6"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

// 6. Pain Trend
export const PainTrendChart = ({ data }: { data: any[] }) => {
  const chartData = data.slice(-14).map(log => ({
    date: new Date(log.log_date).getDate().toString(),
    pain: log.cramps_severity || 0
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorPain" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={chartConfig.grid} vertical={false} />
        <XAxis dataKey="date" stroke={chartConfig.text} opacity={0.6} fontSize={12} tickLine={false} axisLine={false} />
        <YAxis domain={[0, 10]} stroke={chartConfig.text} opacity={0.6} fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="pain" name="Pain Score" stroke="#f43f5e" fillOpacity={1} fill="url(#colorPain)" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// 7. Weight Trend
export const WeightTrendChart = ({ data }: { data: any[] }) => {
  const chartData = data.slice(-30).filter(log => log.weight).map(log => ({
    date: new Date(log.log_date).getDate().toString(),
    weight: log.weight
  }));

  // Find min/max for domain scaling to make the line look dynamic
  const minW = Math.min(...chartData.map(d => d.weight)) - 1;
  const maxW = Math.max(...chartData.map(d => d.weight)) + 1;

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartConfig.grid} vertical={false} />
        <XAxis dataKey="date" stroke={chartConfig.text} opacity={0.6} fontSize={12} tickLine={false} axisLine={false} />
        <YAxis domain={[minW, maxW]} stroke={chartConfig.text} opacity={0.6} fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Line type="monotone" dataKey="weight" name="Weight (kg)" stroke="#0ea5e9" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

// 8. Sleep Hours
export const SleepHoursChart = ({ data }: { data: any[] }) => {
  const chartData = data.slice(-14).map(log => ({
    date: new Date(log.log_date).getDate().toString(),
    sleep: log.sleep_hours || 0
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
         <defs>
          <linearGradient id="colorSleep" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={chartConfig.grid} vertical={false} />
        <XAxis dataKey="date" stroke={chartConfig.text} opacity={0.6} fontSize={12} tickLine={false} axisLine={false} />
        <YAxis domain={[0, 12]} stroke={chartConfig.text} opacity={0.6} fontSize={12} tickLine={false} axisLine={false} />
        <ReferenceLine y={8} stroke="#10b981" strokeDasharray="3 3" />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="sleep" name="Sleep (Hours)" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorSleep)" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// 9. Ovulation & Fertile Window Calendar
export const OvulationCalendar = ({ profile }: { profile: any }) => {
  if (!profile) return null;
  
  // Calculate next few days
  const today = new Date();
  const days = [];
  
  // Find cycle day (mock logic based on last period)
  const lastP = new Date(profile.last_period_start);
  const diffTime = Math.abs(today.getTime() - lastP.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const currentCycleDay = diffDays % (profile.cycle_length_avg || 28);
  
  for (let i = -3; i <= 10; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const cDay = (currentCycleDay + i) % (profile.cycle_length_avg || 28);
    const isPeriod = cDay < (profile.period_duration || 5);
    const isFertile = cDay >= 10 && cDay <= 15;
    const isOvulation = cDay === 14;
    
    days.push({
      date: d.getDate(),
      dayName: d.toLocaleString('default', { weekday: 'short' }),
      isPeriod,
      isFertile,
      isOvulation,
      isToday: i === 0
    });
  }

  return (
    <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-4 mt-4 w-full">
      {days.map((d, idx) => (
        <div 
          key={idx} 
          className={`shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center border-2 transition-all ${
            d.isToday ? "border-[#2D1B36] scale-105 shadow-md bg-white" : "border-white/40 bg-white/30"
          } ${d.isPeriod ? "bg-red-50 border-red-200" : d.isFertile ? "bg-emerald-50 border-emerald-200" : ""}`}
        >
          <span className="text-xs font-semibold uppercase text-[#2D1B36]/50 mb-1">{d.dayName}</span>
          <span className={`text-xl font-bold ${d.isPeriod ? "text-red-500" : d.isFertile ? "text-emerald-500" : "text-[#2D1B36]"}`}>
            {d.date}
          </span>
          {d.isOvulation && <span className="text-[10px] bg-emerald-500 text-white px-1.5 rounded-full mt-1">OVU</span>}
          {d.isPeriod && !d.isOvulation && <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1"></span>}
        </div>
      ))}
    </div>
  );
};
