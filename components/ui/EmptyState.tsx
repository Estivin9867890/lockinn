"use client";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  color?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  color = "#5B9CF6",
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-16 px-8 text-center"
    >
      {/* Icon ring */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", bounce: 0.4 }}
        className="mb-5 w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: `${color}15`, border: `1px solid ${color}25` }}
      >
        <Icon className="w-7 h-7" style={{ color }} />
      </motion.div>

      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-[15px] font-semibold text-gray-700 mb-2"
      >
        {title}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="text-[13px] text-gray-400 max-w-[280px] leading-relaxed"
      >
        {description}
      </motion.p>

      {action && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={action.onClick}
          className="mt-5 px-4 py-2.5 rounded-xl text-[13px] font-medium text-white transition-all"
          style={{
            background: `linear-gradient(135deg, ${color}, ${color}cc)`,
            boxShadow: `0 4px 14px ${color}40`,
          }}
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}
