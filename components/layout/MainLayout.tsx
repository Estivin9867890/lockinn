"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import CommandBar from "@/components/CommandBar";
import DynamicIsland from "@/components/DynamicIsland";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Animated background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, #5B9CF620 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #A78BFA20 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(ellipse, #34D39915 0%, transparent 70%)" }}
        />
      </div>

      <DynamicIsland />
      <Sidebar onCommandOpen={() => setCommandOpen(true)} />

      <main className="flex-1 ml-[240px] min-h-screen overflow-auto">
        <div className="p-8 max-w-[1400px]">
          {children}
        </div>
      </main>

      <CommandBar open={commandOpen} onClose={() => setCommandOpen(false)} />
    </div>
  );
}
