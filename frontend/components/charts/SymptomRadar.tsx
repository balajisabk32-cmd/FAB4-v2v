"use client";

import React from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";

interface SymptomRadarProps {
  logs: any[];
}

export default function SymptomRadar({ logs }: SymptomRadarProps) {
  // Aggregate symptom frequency across all logs
  const symptomCounts: Record<string, number> = {
    "Cramps": 0,
    "Headache": 0,
    "Bloating": 0,
    "Acne": 0,
    "Fatigue": 0,
    "Mood swings": 0
  };

  let totalLogs = logs.length;
  if (totalLogs === 0) totalLogs = 1; // Prevent division by zero

  logs.forEach(log => {
    if (log.symptoms && Array.isArray(log.symptoms)) {
      log.symptoms.forEach((sym: string) => {
        if (symptomCounts[sym] !== undefined) {
          symptomCounts[sym] += 1;
        }
      });
    }
  });

  const data = Object.keys(symptomCounts).map(key => ({
    subject: key,
    A: Math.round((symptomCounts[key] / totalLogs) * 100), // Percentage of days experienced
    fullMark: 100,
  }));

  return (
    <div className="w-full h-64 mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#2D1B36" strokeOpacity={0.1} />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#2D1B36', fontSize: 11, fontWeight: 500 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}
            labelStyle={{ color: '#2D1B36', fontWeight: 'bold' }}
            itemStyle={{ color: '#818cf8' }}
            formatter={(value) => [`${value}% of logged days`, 'Frequency']}
          />
          <Radar name="Symptoms" dataKey="A" stroke="#818cf8" strokeWidth={2} fill="#818cf8" fillOpacity={0.4} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
