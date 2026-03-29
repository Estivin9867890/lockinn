"use client";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  accentColor?: string;
}

const sizes = { sm: "max-w-[400px]", md: "max-w-[520px]", lg: "max-w-[640px]" };

export default function Modal({
  open, onClose, title, description, children, size = "md", accentColor = "#5B9CF6",
}: ModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) {
      window.addEventListener("keydown", handleKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        /* Overlay plein écran — centrage flex */
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/30 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Panel — scale-up Apple style */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ type: "spring", bounce: 0.28, duration: 0.4 }}
            className={`relative z-10 w-full ${sizes[size]}`}
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.97)",
                backdropFilter: "blur(40px) saturate(200%)",
                WebkitBackdropFilter: "blur(40px) saturate(200%)",
                border: "1px solid rgba(255,255,255,0.7)",
                boxShadow: "0 32px 96px rgba(0,0,0,0.22), 0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)",
              }}
            >
              {/* Accent bar */}
              <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}80, transparent)` }} />

              {/* Header */}
              <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-black/5">
                <div>
                  <h2 className="text-[16px] font-semibold text-gray-900">{title}</h2>
                  {description && <p className="text-[12px] text-gray-400 mt-0.5">{description}</p>}
                </div>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors ml-4 flex-shrink-0"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-5">{children}</div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Form primitives ──────────────────────────────────────────────────────────

export function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputBase = {
  background: "rgba(0,0,0,0.04)",
  border: "1px solid rgba(0,0,0,0.08)",
} as const;
const inputFocus = {
  background: "rgba(91,156,246,0.06)",
  border: "1px solid rgba(91,156,246,0.45)",
} as const;

export function FormInput({ placeholder, value, onChange, type = "text", required, min, max, step }: {
  placeholder?: string; value: string | number; onChange: (v: string) => void;
  type?: string; required?: boolean; min?: number; max?: number; step?: number;
}) {
  return (
    <input
      type={type} value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} required={required} min={min} max={max} step={step}
      className="w-full px-3.5 py-2.5 rounded-xl text-[14px] text-gray-800 outline-none transition-all"
      style={inputBase}
      onFocus={(e) => Object.assign(e.target.style, inputFocus)}
      onBlur={(e) => Object.assign(e.target.style, inputBase)}
    />
  );
}

export function FormSelect({ value, onChange, options }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full px-3.5 py-2.5 rounded-xl text-[14px] text-gray-800 outline-none transition-all appearance-none cursor-pointer"
      style={inputBase}>
      {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  );
}

export function FormTextarea({ placeholder, value, onChange, rows = 3 }: {
  placeholder?: string; value: string; onChange: (v: string) => void; rows?: number;
}) {
  return (
    <textarea value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} rows={rows}
      className="w-full px-3.5 py-2.5 rounded-xl text-[14px] text-gray-800 outline-none resize-none transition-all"
      style={inputBase}
      onFocus={(e) => Object.assign(e.target.style, inputFocus)}
      onBlur={(e) => Object.assign(e.target.style, inputBase)} />
  );
}

export function SubmitButton({ label, loading, color = "#5B9CF6", onClick }: {
  label: string; loading?: boolean; color?: string; onClick?: () => void;
}) {
  return (
    <motion.button
      type={onClick ? "button" : "submit"} onClick={onClick} disabled={loading}
      whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: loading ? 1 : 0.98 }}
      className="w-full py-3 rounded-xl text-[14px] font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
      style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, boxShadow: `0 4px 16px ${color}40` }}>
      {loading ? (
        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Enregistrement…</>
      ) : label}
    </motion.button>
  );
}

// ─── Confirm dialog (suppression) ────────────────────────────────────────────

export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = "Supprimer", confirmColor = "#F87171" }: {
  open: boolean; onClose: () => void; onConfirm: () => void;
  title: string; message: string; confirmLabel?: string; confirmColor?: string;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm" accentColor={confirmColor}>
      <div className="space-y-5">
        <p className="text-[14px] text-gray-600 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-medium text-gray-600 bg-black/5 hover:bg-black/8 transition-all">
            Annuler
          </button>
          <motion.button onClick={onConfirm} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all"
            style={{ background: confirmColor, boxShadow: `0 4px 14px ${confirmColor}40` }}>
            {confirmLabel}
          </motion.button>
        </div>
      </div>
    </Modal>
  );
}
