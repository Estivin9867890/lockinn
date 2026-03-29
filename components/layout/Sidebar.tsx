"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, MapPin, Apple, Wallet, Film,
  Package, Command, Zap, Settings, LogOut, Calendar, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useSettings } from "@/contexts/SettingsContext";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, color: "#5B9CF6" },
  { href: "/calendar", label: "Calendrier", icon: Calendar, color: "#FB923C" },
  { href: "/notes", label: "Notes", icon: FileText, color: "#A78BFA" },
  { href: "/sport", label: "Sport & Map", icon: MapPin, color: "#34D399" },
  { href: "/nutrition", label: "Nutrition", icon: Apple, color: "#FB923C" },
  { href: "/budget", label: "Budget", icon: Wallet, color: "#F472B6" },
  { href: "/media", label: "Media Vault", icon: Film, color: "#A78BFA" },
  { href: "/inventory", label: "Inventaire", icon: Package, color: "#FBBF24" },
];

export default function Sidebar({ onCommandOpen }: { onCommandOpen: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { settings } = useSettings();
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email ?? "");
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const initials = (settings.display_name || userEmail || "?")
    .split(" ").map((w) => w[0]?.toUpperCase()).slice(0, 2).join("");

  return (
    <aside className="sidebar fixed left-0 top-0 h-full w-[240px] z-30 flex flex-col py-6 px-3">
      {/* Logo */}
      <div className="px-3 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md"
            style={{ background: "linear-gradient(135deg, #5B9CF6, #A78BFA)" }}>
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-gray-800 leading-tight">LockIn</p>
            <p className="text-[11px] text-gray-400">Second Cerveau</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
          Navigation
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}
                className={cn("nav-item relative", isActive && "active")}>
                {isActive && (
                  <motion.div layoutId="active-nav"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.9)", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }} />
                )}
                <span className="relative w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: isActive ? `${item.color}20` : "transparent" }}>
                  <Icon className="w-4 h-4 relative" style={{ color: isActive ? item.color : undefined }} />
                </span>
                <span className="relative text-[13px]">{item.label}</span>
                {isActive && <span className="relative ml-auto w-1.5 h-1.5 rounded-full" style={{ background: item.color }} />}
              </motion.div>
            </Link>
          );
        })}

        {/* Settings */}
        <div className="pt-3 mt-3 border-t border-black/5">
          <Link href="/settings">
            <motion.div whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}
              className={cn("nav-item relative", pathname === "/settings" && "active")}>
              {pathname === "/settings" && (
                <motion.div layoutId="active-nav" className="absolute inset-0 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.9)", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }} />
              )}
              <span className="relative w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: pathname === "/settings" ? "#9CA3AF20" : "transparent" }}>
                <Settings className="w-4 h-4 relative text-gray-500" />
              </span>
              <span className="relative text-[13px]">Réglages</span>
            </motion.div>
          </Link>
        </div>
      </nav>

      {/* CMD+K + User */}
      <div className="mt-4 px-1 space-y-1">
        <button onClick={onCommandOpen}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-black/5 hover:bg-black/8 transition-all group">
          <Command className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
          <span className="text-[13px] text-gray-400 group-hover:text-gray-600 transition-colors flex-1 text-left">Commandes</span>
          <kbd className="text-[10px] bg-white/80 border border-black/10 rounded-md px-1.5 py-0.5 text-gray-400 shadow-sm">⌘K</kbd>
        </button>

        {/* User card */}
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-black/5 transition-colors group">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-semibold shadow-sm flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #5B9CF6, #A78BFA)" }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-gray-700 truncate">{settings.display_name || "Moi"}</p>
            <p className="text-[10px] text-gray-400 truncate">{userEmail}</p>
          </div>
          <button onClick={handleLogout}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-red-50"
            title="Déconnexion">
            <LogOut className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      </div>
    </aside>
  );
}
