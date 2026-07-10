"use client";

import React from "react";
import { ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface PainFlowCorrelationProps {
  logs: any[];
}

export default function PainFlowCorrelation({ logs }: PainFlowCorrelationProps) {
  // Map flow intensity to numerical values for bars
  const flowMap: Record<string, number> = {
    "None": 0,
    "Spotting": 1,
    "Light": 2,
    "Moderate": 3,
    "Heavy": 4,
    "Very Heavy": 5
  };

  const data = logs.slice(-7).map(log => ({
    date: new Date(log.log_date).toLocaleDateString('en-US', { weekday: 'short' }),
    cramps: log.cramps_severity || 0,
    flow: flowMap[log.flow_intensity] || 0,
  }));

  // If no logs, show some empty structure or fallback
  if (data.length === 0) {
    return <div className="w-full h-64 flex items-center justify-center text-[#2D1B36]/40 text-sm">Not enough log data to chart.</div>;
  }

  return (
    <div className="w-full h-64 mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="#2D1B36" strokeOpacity={0.05} vertical={false} />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#2D1B36', opacity: 0.5 }} />
          <YAxis yAxisId="left" hide />
          <YAxis yAxisId="right" orientation="right" hide />
          <Tooltip 
            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}
            labelStyle={{ color: '#2D1B36', fontWeight: 'bold' }}
          />
          <Bar yAxisId="left" dataKey="flow" name="Flow Intensity" fill="#fca5a5" radius={[4, 4, 0, 0]} barSize={20} opacity={0.8} />
          <Line yAxisId="right" type="monotone" dataKey="cramps" name="Cramps (0-10)" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
