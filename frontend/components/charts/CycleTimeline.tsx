"use client";

import React from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface CycleTimelineProps {
  lastPeriodStart: string;
  cycleLengthAvg: number;
}

export default function CycleTimeline({ lastPeriodStart, cycleLengthAvg }: CycleTimelineProps) {
  // Real data calculation based on last period start and cycle length
  const startDate = new Date(lastPeriodStart);
  
  const generateCycleData = () => {
    const data = [];
    for (let day = 1; day <= cycleLengthAvg; day++) {
      let phase = "Follicular";
      let hormoneLevel = 20; // Baseline
      
      // Approximating hormone curve (Estrogen/Progesterone blend for visual)
      if (day <= 5) {
        phase = "Menstruation";
        hormoneLevel = 10 + day * 2;
      } else if (day > 5 && day <= 13) {
        phase = "Follicular";
        hormoneLevel = 20 + Math.pow(day - 5, 2) * 1.5; // Estrogen peak
      } else if (day === 14) {
        phase = "Ovulation";
        hormoneLevel = 100; // Peak
      } else if (day > 14 && day <= cycleLengthAvg - 5) {
        phase = "Luteal";
        hormoneLevel = 80 - Math.pow(day - 14, 1.5); // Progesterone phase
      } else {
        phase = "Late Luteal";
        hormoneLevel = Math.max(10, 40 - (day - (cycleLengthAvg - 5)) * 5); // Drop
      }

      // Calculate the actual date
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day - 1);
      
      data.push({
        day,
        date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        phase,
        hormoneLevel: Math.round(hormoneLevel),
      });
    }
    return data;
  };

  const data = generateCycleData();
  
  // Calculate current day in cycle
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - startDate.getTime());
  const currentDay = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const normalizedCurrentDay = currentDay > cycleLengthAvg ? currentDay % cycleLengthAvg : currentDay;

  return (
    <div className="w-full h-64 mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorHormone" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f472b6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#f472b6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#2D1B36', opacity: 0.5 }} minTickGap={30} />
          <YAxis hide />
          <Tooltip 
            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}
            labelStyle={{ color: '#2D1B36', fontWeight: 'bold' }}
            itemStyle={{ color: '#ec4899' }}
            formatter={(value, name, props) => [props.payload.phase, 'Phase']}
          />
          <Area type="monotone" dataKey="hormoneLevel" stroke="#f472b6" strokeWidth={3} fillOpacity={1} fill="url(#colorHormone)" />
          {normalizedCurrentDay > 0 && normalizedCurrentDay <= cycleLengthAvg && (
            <ReferenceLine x={data[normalizedCurrentDay - 1]?.date} stroke="#6366f1" strokeDasharray="3 3" label={{ position: 'top', value: 'Today', fill: '#6366f1', fontSize: 12, fontWeight: 'bold' }} />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
