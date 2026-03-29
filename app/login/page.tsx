"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Lock, Mail, Eye, EyeOff, Zap, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"landing" | "login" | "signup">("landing");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Si déjà connecté → redirect
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/");
    });
  }, [router]);

  const handleAuth = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError("");
    setSuccess("");

    if (mode === "signup") {
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (err) setError(err.message);
      else setSuccess("Vérifie ta boîte mail pour confirmer ton compte !");
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) setError("Email ou mot de passe incorrect.");
      else router.replace("/");
    }
    setLoading(false);
  };

  const features = [
    { icon: "🏃", label: "Sport & Carte", desc: "Suivi GPS, spots, Strava" },
    { icon: "🥗", label: "Nutrition", desc: "Macros, hydratation, repas" },
    { icon: "💰", label: "Budget", desc: "Dépenses, abonnements" },
    { icon: "🎬", label: "Media Vault", desc: "Films, séries, livres" },
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, #f0f4ff 0%, #fafafa 50%, #f5f0ff 100%)",
      }}
    >
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #5B9CF6, transparent)" }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #A78BFA, transparent)" }} />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", bounce: 0.25, duration: 0.6 }}
          className="rounded-3xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.88)",
            backdropFilter: "blur(40px) saturate(200%)",
            WebkitBackdropFilter: "blur(40px) saturate(200%)",
            border: "1px solid rgba(255,255,255,0.7)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.12), 0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
          }}
        >
          {/* Gradient bar */}
          <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, #5B9CF6, #A78BFA, #F472B6)" }} />

          <div className="p-8">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ background: "linear-gradient(135deg, #5B9CF6, #A78BFA)" }}>
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[18px] font-bold text-gray-900 leading-tight">LockIn</p>
                <p className="text-[11px] text-gray-400">Votre espace personnel</p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {/* LANDING */}
              {mode === "landing" && (
                <motion.div key="landing"
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.22 }}>
                  <h1 className="text-[26px] font-semibold text-gray-900 leading-tight mb-2">
                    Tout votre quotidien,<br />en un seul endroit.
                  </h1>
                  <p className="text-[13px] text-gray-400 mb-6 leading-relaxed">
                    Sport, nutrition, budget, médias — votre second cerveau, privé et sécurisé.
                  </p>

                  {/* Features grid */}
                  <div className="grid grid-cols-2 gap-2 mb-7">
                    {features.map((f) => (
                      <div key={f.label} className="p-3 rounded-2xl"
                        style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.05)" }}>
                        <p className="text-xl mb-1">{f.icon}</p>
                        <p className="text-[12px] font-semibold text-gray-700">{f.label}</p>
                        <p className="text-[11px] text-gray-400">{f.desc}</p>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => setMode("signup")}
                    className="w-full py-3.5 rounded-2xl text-[14px] font-semibold text-white flex items-center justify-center gap-2 mb-3 transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ background: "linear-gradient(135deg, #5B9CF6, #818CF8)", boxShadow: "0 8px 24px rgba(91,156,246,0.35)" }}>
                    Commencer l'expérience <ArrowRight className="w-4 h-4" />
                  </button>
                  <button onClick={() => setMode("login")}
                    className="w-full py-2.5 rounded-2xl text-[13px] font-medium text-gray-500 hover:text-gray-700 transition-colors">
                    Déjà un compte ? Se connecter
                  </button>
                </motion.div>
              )}

              {/* AUTH FORM */}
              {(mode === "login" || mode === "signup") && (
                <motion.div key="auth"
                  initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
                  <h2 className="text-[20px] font-semibold text-gray-900 mb-1">
                    {mode === "signup" ? "Créer un compte" : "Content de vous revoir"}
                  </h2>
                  <p className="text-[13px] text-gray-400 mb-6">
                    {mode === "signup" ? "Votre espace privé, rien qu'à vous." : "Connectez-vous à votre espace."}
                  </p>

                  <div className="space-y-3">
                    {/* Email */}
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAuth()}
                        placeholder="votre@email.com" autoComplete="email"
                        className="w-full pl-10 pr-4 py-3 rounded-xl text-[14px] text-gray-800 outline-none transition-all"
                        style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}
                        onFocus={(e) => { e.target.style.background = "rgba(91,156,246,0.06)"; e.target.style.border = "1px solid rgba(91,156,246,0.4)"; }}
                        onBlur={(e) => { e.target.style.background = "rgba(0,0,0,0.04)"; e.target.style.border = "1px solid rgba(0,0,0,0.08)"; }}
                      />
                    </div>

                    {/* Password */}
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type={showPass ? "text" : "password"} value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAuth()}
                        placeholder="Mot de passe" autoComplete={mode === "signup" ? "new-password" : "current-password"}
                        className="w-full pl-10 pr-10 py-3 rounded-xl text-[14px] text-gray-800 outline-none transition-all"
                        style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}
                        onFocus={(e) => { e.target.style.background = "rgba(91,156,246,0.06)"; e.target.style.border = "1px solid rgba(91,156,246,0.4)"; }}
                        onBlur={(e) => { e.target.style.background = "rgba(0,0,0,0.04)"; e.target.style.border = "1px solid rgba(0,0,0,0.08)"; }}
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Error / Success */}
                    <AnimatePresence>
                      {error && (
                        <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-[12px] text-red-500 px-1">{error}</motion.p>
                      )}
                      {success && (
                        <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-[12px] text-green-600 px-1">{success}</motion.p>
                      )}
                    </AnimatePresence>

                    {/* Submit */}
                    <motion.button onClick={handleAuth} disabled={loading || !email || !password}
                      whileHover={{ scale: loading ? 1 : 1.01 }} whileTap={{ scale: loading ? 1 : 0.98 }}
                      className="w-full py-3.5 rounded-2xl text-[14px] font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                      style={{ background: "linear-gradient(135deg, #5B9CF6, #818CF8)", boxShadow: "0 6px 20px rgba(91,156,246,0.35)" }}>
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : mode === "signup" ? "Créer mon espace" : "Se connecter"}
                    </motion.button>
                  </div>

                  <div className="flex items-center gap-3 mt-5">
                    <div className="flex-1 h-px bg-black/8" />
                    <span className="text-[11px] text-gray-400">ou</span>
                    <div className="flex-1 h-px bg-black/8" />
                  </div>

                  <button onClick={() => setMode(mode === "login" ? "signup" : "login")}
                    className="w-full mt-4 py-2.5 text-[13px] text-gray-500 hover:text-gray-700 transition-colors">
                    {mode === "login" ? "Pas encore de compte ? Créer le mien" : "Déjà un compte ? Se connecter"}
                  </button>
                  <button onClick={() => setMode("landing")}
                    className="w-full py-1.5 text-[12px] text-gray-400 hover:text-gray-500 transition-colors">
                    ← Retour
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <p className="text-center text-[11px] text-gray-400 mt-5">
          Données chiffrées · Espace 100% privé
        </p>
      </div>
    </div>
  );
}
