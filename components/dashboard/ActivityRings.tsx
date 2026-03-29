"use client";
import { motion } from "framer-motion";
import { useSettings } from "@/contexts/SettingsContext";

interface RingProps {
  current: number;
  target: number;
  color: string;
  size: number;
  strokeWidth: number;
  delay: number;
}

function Ring({ current, target, color, size, strokeWidth, delay }: RingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(current / target, 1);
  const dashOffset = circumference * (1 - progress);

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={`${color}20`} strokeWidth={strokeWidth} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: dashOffset }}
        transition={{ duration: 1.2, delay, ease: "easeOut" }}
        style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
      />
    </svg>
  );
}

interface ActivityRingsProps {
  steps?: number;
  caloriesToday?: number;
  waterMlToday?: number;
}

export default function ActivityRings({
  steps = 0,
  caloriesToday = 0,
  waterMlToday = 0,
}: ActivityRingsProps) {
  const { settings } = useSettings();

  const rings = [
    { current: steps, target: settings.steps_goal, color: "#F87171", size: 140, strokeWidth: 14, delay: 0, label: "Pas", unit: "", icon: "🏃" },
    { current: caloriesToday, target: settings.calorie_goal, color: "#34D399", size: 108, strokeWidth: 13, delay: 0.15, label: "Cal", unit: "kcal", icon: "🔥" },
    { current: waterMlToday, target: settings.water_goal_ml, color: "#5B9CF6", size: 76, strokeWidth: 12, delay: 0.3, label: "Eau", unit: "ml", icon: "💧" },
  ];

  const avgPct = Math.round(
    rings.reduce((s, r) => s + Math.min((r.current / r.target) * 100, 100), 0) / rings.length
  );

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Stacked rings */}
      <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
        {rings.map((ring) => (
          <div key={ring.label} className="absolute inset-0 flex items-center justify-center">
            <Ring
              current={ring.current}
              target={ring.target}
              color={ring.color}
              size={ring.size}
              strokeWidth={ring.strokeWidth}
              delay={ring.delay}
            />
          </div>
        ))}
        {/* Center */}
        <div className="relative z-10 text-center">
          <motion.p
            className="text-2xl font-semibold text-gray-800 leading-none"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            {avgPct}<span className="text-sm font-medium text-gray-400">%</span>
          </motion.p>
          <p className="text-[10px] text-gray-400 font-medium mt-0.5">objectifs</p>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-2 w-full">
        {rings.map((ring) => (
          <motion.div
            key={ring.label}
            className="text-center p-2 rounded-xl"
            style={{ background: `${ring.color}10` }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <p className="text-base mb-0.5">{ring.icon}</p>
            <p className="text-[11px] font-semibold text-gray-700">
              {ring.current}{ring.unit}
            </p>
            <p className="text-[9px] text-gray-400">/ {ring.target}{ring.unit}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
