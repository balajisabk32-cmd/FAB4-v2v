"use client";

import React from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, ReferenceLine
} from "recharts";

const chartConfig = {
  stroke: "#c084fc",
  fill: "#fbcfe8",
  grid: "rgba(255,255,255,0.2)",
  text: "#2D1B36"
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-white/50 text-sm text-[#2D1B36]">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color || p.fill || chartConfig.text }}>
            {p.name}: <span className="font-semibold">{p.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// A. Pregnancy Week Progress
export const PregnancyWeekProgress = ({ weeks }: { weeks: number }) => {
  const progressPercent = Math.min((weeks / 40) * 100, 100);
  return (
    <div className="w-full">
      <div className="flex justify-between text-sm font-semibold text-[#2D1B36] mb-2">
        <span>Week {weeks}</span>
        <span>40 Weeks</span>
      </div>
      <div className="h-4 w-full bg-black/5 rounded-full overflow-hidden border border-white/20 shadow-inner">
        <div 
          className="h-full bg-gradient-to-r from-pink-400 to-purple-500 transition-all duration-1000 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};

// B. Baby Growth Timeline
export const BabyGrowthTimeline = ({ weeks }: { weeks: number }) => {
  const fruits = [
    { w: 8, fruit: "🫐 Blueberry" },
    { w: 12, fruit: "🍋 Plum" },
    { w: 16, fruit: "🥑 Avocado" },
    { w: 20, fruit: "🥭 Mango" },
    { w: 24, fruit: "🌽 Ear of Corn" },
    { w: 28, fruit: "🍆 Eggplant" },
    { w: 32, fruit: "🍈 Squash" },
    { w: 36, fruit: "🍉 Watermelon" },
    { w: 40, fruit: "🎃 Pumpkin" }
  ];

  return (
    <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2 pt-2">
      {fruits.map((f, i) => (
        <div key={i} className={`flex flex-col items-center justify-center w-24 h-24 shrink-0 rounded-[2rem] border-2 transition-all ${weeks >= f.w ? (weeks === f.w || (weeks > f.w && weeks < (fruits[i+1]?.w || 41)) ? "border-purple-400 bg-purple-50 scale-105 shadow-md" : "border-white/50 bg-white/40 opacity-60") : "border-black/5 bg-black/5 opacity-40 grayscale"}`}>
          <span className="text-sm font-semibold text-[#2D1B36]/60">Week {f.w}</span>
          <span className="text-3xl mt-1">{f.fruit.split(" ")[0]}</span>
          <span className="text-[10px] uppercase font-bold text-[#2D1B36]/40 mt-1">{f.fruit.split(" ")[1]}</span>
        </div>
      ))}
    </div>
  );
};

// C. Weight Gain
export const WeightGainChart = ({ data }: { data: any[] }) => {
  const chartData = data.slice(-30).map(log => ({
    date: new Date(log.log_date).getDate().toString(),
    weight: log.weight
  }));

  const minW = Math.floor(Math.min(...chartData.map(d => d.weight)) - 1);
  const maxW = Math.ceil(Math.max(...chartData.map(d => d.weight)) + 1);

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

// D. Blood Pressure
export const BloodPressureChart = ({ data }: { data: any[] }) => {
  const chartData = data.slice(-14).map(log => ({
    date: new Date(log.log_date).getDate().toString(),
    systolic: log.blood_pressure_systolic,
    diastolic: log.blood_pressure_diastolic
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartConfig.grid} vertical={false} />
        <XAxis dataKey="date" stroke={chartConfig.text} opacity={0.6} fontSize={12} tickLine={false} axisLine={false} />
        <YAxis domain={[50, 160]} stroke={chartConfig.text} opacity={0.6} fontSize={12} tickLine={false} axisLine={false} />
        <ReferenceLine y={140} stroke="#ef4444" strokeDasharray="3 3" />
        <Tooltip content={<CustomTooltip />} />
        <Line type="monotone" dataKey="systolic" name="Systolic" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
        <Line type="monotone" dataKey="diastolic" name="Diastolic" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

// E. Blood Sugar
export const BloodSugarChart = ({ data }: { data: any[] }) => {
  const chartData = data.slice(-14).map(log => ({
    date: new Date(log.log_date).getDate().toString(),
    sugar: log.blood_sugar
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorSugar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={chartConfig.grid} vertical={false} />
        <XAxis dataKey="date" stroke={chartConfig.text} opacity={0.6} fontSize={12} tickLine={false} axisLine={false} />
        <YAxis domain={[60, 150]} stroke={chartConfig.text} opacity={0.6} fontSize={12} tickLine={false} axisLine={false} />
        <ReferenceLine y={95} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'top', value: 'Fasting Target', fill: '#10b981', fontSize: 10 }} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="sugar" name="Blood Sugar" stroke="#f59e0b" fillOpacity={1} fill="url(#colorSugar)" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// F. Baby Movement Count
export const BabyMovementChart = ({ data }: { data: any[] }) => {
  const chartData = data.slice(-7).map(log => ({
    date: new Date(log.log_date).getDate().toString(),
    morning: log.baby_movement?.morning || 0,
    afternoon: log.baby_movement?.afternoon || 0,
    night: log.baby_movement?.night || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartConfig.grid} vertical={false} />
        <XAxis dataKey="date" stroke={chartConfig.text} opacity={0.6} fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke={chartConfig.text} opacity={0.6} fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.4)' }} />
        <Bar dataKey="morning" name="Morning" stackId="a" fill="#fde047" />
        <Bar dataKey="afternoon" name="Afternoon" stackId="a" fill="#fb923c" />
        <Bar dataKey="night" name="Night" stackId="a" fill="#6366f1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

// G. Appointment Timeline
export const AppointmentTimeline = ({ appointments }: { appointments: any[] }) => {
  return (
    <div className="flex flex-col gap-4 mt-2">
      {appointments.map((apt, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${apt.completed ? "bg-emerald-400 text-white" : "bg-black/10 border border-black/20"}`}>
            {apt.completed && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            )}
          </div>
          <div className={`text-lg font-medium ${apt.completed ? "text-[#2D1B36]" : "text-[#2D1B36]/50 line-through"}`}>
            {apt.name}
          </div>
        </div>
      ))}
    </div>
  );
};

// H. Mood Tracker
export const MoodTrackerChart = ({ data }: { data: any[] }) => {
  const moodScore: any = { "Happy": 4, "Calm": 3, "Fatigued": 2, "Anxious": 1, "Irritable": 0 };
  const moodColors: any = { 4: "#34d399", 3: "#60a5fa", 2: "#94a3b8", 1: "#fbbf24", 0: "#ef4444" };
  
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
        <YAxis domain={[0, 4]} ticks={[0,1,2,3,4]} stroke={chartConfig.text} opacity={0.6} fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => Object.keys(moodScore).find(k => moodScore[k] === val) || ""} />
        <Tooltip content={<CustomTooltip />} />
        <Line type="stepAfter" dataKey="moodVal" name="Mood" stroke="#818cf8" strokeWidth={2} dot={(props: any) => {
          const { cx, cy, payload } = props;
          return <circle cx={cx} cy={cy} r={5} fill={moodColors[payload.moodVal] || "#000"} stroke="none" />;
        }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

// I. Nutrition Score
export const NutritionScoreChart = ({ nutrition }: { nutrition: any }) => {
  if (!nutrition) return null;
  const data = [
    { name: 'Protein', value: nutrition.protein, fill: '#ec4899' },
    { name: 'Iron', value: nutrition.iron, fill: '#ef4444' },
    { name: 'Calcium', value: nutrition.calcium, fill: '#eab308' },
    { name: 'Water', value: nutrition.water, fill: '#3b82f6' }
  ];

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie data={data} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
};

// J. Sleep Graph
export const PregnancySleepGraph = ({ data }: { data: any[] }) => {
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
