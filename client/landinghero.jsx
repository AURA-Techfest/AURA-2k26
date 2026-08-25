import React from 'react';

export default function LandingHero({ onStartRegistration }) {
  return (
    <div className="min-h-screen bg-[#0B1F3A] text-white font-inter flex flex-col justify-between selection:bg-[#2563EB] selection:text-white">
      {/* Top Navigation */}
      <header className="border-b border-[#CBD5E1]/15 bg-[#0B1F3A]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="bg-[#2563EB] text-white text-xs font-bold px-3 py-1 rounded-full font-poppins tracking-wider">
              AURA 2026
            </span>
            <span className="text-xs text-[#CBD5E1] font-medium hidden sm:inline">
              Aliah University Tech Fest
            </span>
          </div>
          <button
            onClick={onStartRegistration}
            className="bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-md shadow-blue-500/20"
          >
            Register Project
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-16 text-center flex-1 flex flex-col justify-center items-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#123B66] border border-[#CBD5E1]/20 text-xs font-semibold text-blue-300 mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          19–20 November 2026 • Live Exhibition Track
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold font-poppins tracking-tight leading-tight mb-6">
          DISCOVER. DESIGN.<br />
          <span className="text-[#2563EB]">DISRUPT.</span>
        </h1>

        <p className="max-w-2xl text-sm sm:text-base text-[#F8FAFC]/80 leading-relaxed mb-10 font-normal">
          Showcase your physical working hardware prototypes at AURA 2026. Join student innovators across robotics, IoT, embedded systems, assistive tech, and AI-enabled hardware.
        </p>

        {/* Highlight Stats / Rules Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl mb-10 text-left">
          <div className="bg-[#123B66]/60 border border-[#CBD5E1]/20 rounded-xl p-4">
            <span className="text-xs font-semibold text-blue-300 block mb-1">TEAM SIZE</span>
            <p className="text-sm font-bold text-white">2 – 4 Members</p>
            <span className="text-[11px] text-[#64748B]">Inter-college teams permitted</span>
          </div>

          <div className="bg-[#123B66]/60 border border-[#CBD5E1]/20 rounded-xl p-4">
            <span className="text-xs font-semibold text-blue-300 block mb-1">PROTOTYPE RULE</span>
            <p className="text-sm font-bold text-white">Physical Working Model</p>
            <span className="text-[11px] text-[#64748B]">Must support live demonstration</span>
          </div>

          <div className="bg-[#123B66]/60 border border-[#CBD5E1]/20 rounded-xl p-4">
            <span className="text-xs font-semibold text-blue-300 block mb-1">REGISTRATION FEE</span>
            <p className="text-sm font-bold text-white">₹0 / ₹400</p>
            <span className="text-[11px] text-[#64748B]">₹400 only if ≥50% external</span>
          </div>
        </div>

        {/* Primary CTA Trigger */}
        <button
          onClick={onStartRegistration}
          className="group relative inline-flex items-center gap-3 bg-[#2563EB] hover:bg-blue-600 text-white font-poppins font-bold text-sm sm:text-base px-8 py-4 rounded-xl transition shadow-xl shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98]"
        >
          Initialize Registration
          <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#CBD5E1]/10 py-6 text-center text-xs text-[#64748B]">
        AURA 2026 • Annual Technical Festival of Aliah University
      </footer>
    </div>
  );
}