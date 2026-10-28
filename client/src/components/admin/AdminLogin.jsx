import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldAlert,
  ArrowLeft,
  Sparkles,
  KeyRound,
  Sun,
  Moon,
} from "lucide-react";
import { loginAdmin } from "../../services/adminService";
import { useAdminTheme } from "../../context/AdminThemeContext";
import auraLogo from "../../assets/AURA_26_LOGO.png";

export default function AdminLogin() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { theme, toggleTheme, isLight } = useAdminTheme();

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/admin/dashboard";

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!userId.trim() || !password.trim()) {
      setError("Please enter both User ID and Password.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await loginAdmin(userId.trim(), password.trim());
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Invalid authentication credentials.");
    } finally {
      setLoading(false);
    }
  };

  const fillQuickCredentials = () => {
    setUserId("admin");
    setPassword("aura2026admin");
    setError("");
  };

  return (
    <div
      className={`min-h-screen flex flex-col justify-between relative overflow-hidden select-none font-sans transition-colors duration-200 ${
        isLight ? "bg-slate-50 text-slate-900" : "bg-[#0b0909] text-white"
      }`}
    >
      {/* Background Lighting Effects */}
      {isLight ? (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(rgba(100,116,139,0.08)_1.5px,transparent_1.5px)] [background-size:24px_24px] pointer-events-none" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-amber-200/40 via-orange-100/30 to-blue-100/40 rounded-full blur-3xl pointer-events-none" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1.5px,transparent_1.5px)] [background-size:28px_28px] pointer-events-none" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-amber-500/10 via-red-500/5 to-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        </>
      )}

      {/* Top Bar */}
      <header className="relative z-10 w-full px-6 py-6 flex items-center justify-between max-w-7xl mx-auto">
        <Link
          to="/"
          className={`inline-flex items-center gap-2 text-xs font-mono tracking-wider uppercase group transition-colors ${
            isLight
              ? "text-slate-600 hover:text-amber-600"
              : "text-zinc-400 hover:text-amber-400"
          }`}
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Main Portal</span>
        </Link>

        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono transition-colors cursor-pointer ${
              isLight
                ? "bg-white border-slate-300 text-slate-700 hover:bg-slate-100 shadow-sm"
                : "bg-white/[0.05] border-white/10 text-zinc-300 hover:bg-white/10"
            }`}
            title={`Switch to ${isLight ? "Dark" : "Light"} Theme`}
          >
            {isLight ? (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-500" />
                <span>Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Light</span>
              </>
            )}
          </button>

          <div
            className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono tracking-widest border ${
              isLight
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-white/[0.04] border-white/10 text-amber-400/90"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            SECURE CHANNEL · SSL ACTIVE
          </div>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="relative z-10 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div
            className={`relative rounded-2xl border p-8 shadow-2xl backdrop-blur-2xl overflow-hidden transition-colors ${
              isLight
                ? "bg-white/95 border-slate-200/90 shadow-slate-200/80"
                : "bg-zinc-950/80 border-white/10"
            }`}
          >
            {/* Header / Brand */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center mb-3">
                <img
                  src={auraLogo}
                  alt="AURA 2K26"
                  className="h-16 w-auto object-contain drop-shadow-[0_0_20px_rgba(213,162,58,0.3)]"
                />
              </div>
              <h1
                className={`text-2xl font-bold tracking-wider font-heading uppercase mt-1 ${
                  isLight ? "text-slate-900" : "text-white"
                }`}
              >
                Admin Console
              </h1>
              <p
                className={`text-xs font-mono tracking-wider mt-1 uppercase ${
                  isLight ? "text-slate-500" : "text-zinc-400"
                }`}
              >
                Hardware Exhibition · Control System
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 animate-shake">
                <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="text-xs text-red-600 dark:text-red-300 leading-relaxed font-mono">
                  {error}
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              {/* User ID Field */}
              <div className="space-y-1.5">
                <label
                  className={`text-[11px] font-mono tracking-widest uppercase font-semibold flex items-center gap-1.5 ${
                    isLight ? "text-slate-700" : "text-zinc-300"
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-amber-500" />
                  Admin User ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="Enter admin user ID"
                    autoComplete="username"
                    autoFocus
                    required
                    className={`w-full px-4 py-3 border rounded-xl text-sm transition-all font-mono focus:outline-none focus:ring-1 ${
                      isLight
                        ? "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-amber-500 focus:ring-amber-500/40"
                        : "bg-black/50 border-white/10 text-white placeholder-zinc-500 focus:border-amber-400 focus:ring-amber-400/50"
                    }`}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label
                  className={`text-[11px] font-mono tracking-widest uppercase font-semibold flex items-center gap-1.5 ${
                    isLight ? "text-slate-700" : "text-zinc-300"
                  }`}
                >
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    required
                    className={`w-full px-4 py-3 border rounded-xl text-sm transition-all font-mono pr-11 focus:outline-none focus:ring-1 ${
                      isLight
                        ? "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-amber-500 focus:ring-amber-500/40"
                        : "bg-black/50 border-white/10 text-white placeholder-zinc-500 focus:border-amber-400 focus:ring-amber-400/50"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors ${
                      isLight
                        ? "text-slate-400 hover:text-slate-700"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-sm tracking-widest uppercase font-mono shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    Sign In to Console
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials Helper */}
            <div
              className={`mt-6 pt-5 border-t text-center ${
                isLight ? "border-slate-200" : "border-white/5"
              }`}
            >
              <button
                type="button"
                onClick={fillQuickCredentials}
                className={`inline-flex items-center gap-2 text-xs font-mono transition-colors p-2 rounded-lg border border-dashed group ${
                  isLight
                    ? "border-slate-300 text-slate-600 hover:border-amber-500 hover:bg-slate-50"
                    : "border-white/10 text-zinc-400 hover:border-amber-500/30 hover:bg-white/[0.03]"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
                <span>
                  Fill Default Credentials:{" "}
                  <strong className={isLight ? "text-slate-900" : "text-zinc-200"}>
                    admin
                  </strong>{" "}
                  /{" "}
                  <strong className={isLight ? "text-slate-900" : "text-zinc-200"}>
                    aura2026admin
                  </strong>
                </span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className={`relative z-10 w-full py-6 text-center text-xs font-mono ${
          isLight ? "text-slate-500" : "text-zinc-600"
        }`}
      >
        AURA 2K26 Technical Exhibition · Department of Electrical Engineering, Aliah University
      </footer>
    </div>
  );
}
