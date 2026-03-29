"use client";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

// Données d'énergie type journée — utilisées comme template visuel (pas de Supabase pour ce widget)
const ENERGY_TEMPLATE = [
  { time: "06h", energy: 5 },
  { time: "08h", energy: 7 },
  { time: "10h", energy: 9 },
  { time: "12h", energy: 8 },
  { time: "14h", energy: 6 },
  { time: "16h", energy: 7 },
  { time: "18h", energy: 8 },
  { time: "20h", energy: 5 },
  { time: "22h", energy: 3 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-xl px-3 py-2 text-[12px]"
        style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.5)", boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}>
        <p className="font-semibold text-gray-700 mb-1">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.name} style={{ color: entry.color }}>
            Énergie: <span className="font-semibold">{entry.value}/10</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function EnergyChart() {
  return (
    <div className="w-full h-[160px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={ENERGY_TEMPLATE} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#5B9CF6" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#5B9CF6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
          <XAxis dataKey="time" tick={{ fontSize: 10, fill: "rgba(0,0,0,0.4)" }} axisLine={false} tickLine={false} interval={1} />
          <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: "rgba(0,0,0,0.4)" }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="energy" stroke="#5B9CF6" strokeWidth={2.5}
            fill="url(#energyGradient)"
            dot={{ r: 3, fill: "#5B9CF6", strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#5B9CF6", strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
