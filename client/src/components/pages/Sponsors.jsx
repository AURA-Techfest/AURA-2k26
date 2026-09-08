import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../layout/Navbar";
import auraLogo from "../../assets/AURA_26_LOGO.png";

export default function Sponsors({ onRegisterClick }) {
  return (
    <div className="bg-[#0b0909] min-h-screen text-white relative select-none">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1.5px,transparent_1.5px)] [background-size:28px_28px] pointer-events-none z-10" />

      {/* Main Sticky Navbar */}
      <Navbar onRegisterClick={onRegisterClick} />

      {/* Hero Header Section */}
      <main className="relative z-20 pt-32 pb-20 px-4 sm:px-6 md:px-12 max-w-6xl mx-auto flex flex-col items-center text-center">
        <img
          src={auraLogo}
          alt="AURA 2K26"
          className="w-16 md:w-24 h-auto mb-6 filter brightness-125 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
        />

        <span className="px-4 py-1.5 rounded-full border border-purple-400/40 bg-purple-950/30 text-purple-300 font-heading text-xs font-bold tracking-widest uppercase mb-4 shadow-sm">
          Partnerships & Alliances
        </span>

        <h1 className="font-heading font-black text-3xl sm:text-5xl md:text-6xl uppercase tracking-wider text-white mb-6">
          OUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-300 to-pink-500">SPONSORS</span>
        </h1>

        <p className="font-body text-white/70 text-sm sm:text-base md:text-lg max-w-2xl leading-relaxed mb-12">
          AURA 2K26 is proudly backed by leading technology pioneers, academic champions, and industry visionaries shaping the future of robotics and innovation.
        </p>

        {/* Sponsor Grid Placeholder Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full mb-16">
          {[
            { category: "Title Sponsor", title: "Coming Soon", tier: "Platinum Tier" },
            { category: "Powered By", title: "Coming Soon", tier: "Gold Tier" },
            { category: "Associate Partner", title: "Coming Soon", tier: "Silver Tier" }
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-black/50 border border-white/15 backdrop-blur-md rounded-2xl p-8 flex flex-col items-center justify-center hover:border-purple-400/50 transition-all duration-300 shadow-xl group"
            >
              <span className="text-xs font-mono font-bold text-purple-300 tracking-wider uppercase mb-2">
                {item.category}
              </span>
              <h3 className="font-heading font-black text-xl text-white/90 group-hover:text-white transition-colors mb-2">
                {item.title}
              </h3>
              <span className="text-[11px] font-heading tracking-widest text-white/40 uppercase">
                {item.tier}
              </span>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-purple-950/40 via-black/60 to-purple-950/40 border border-white/20 rounded-2xl p-8 max-w-2xl w-full flex flex-col items-center">
          <h3 className="font-heading font-black text-lg sm:text-xl uppercase tracking-wider text-white mb-2">
            Interested in Sponsoring AURA 2K26?
          </h3>
          <p className="font-body text-xs sm:text-sm text-white/60 mb-6">
            Partner with Eastern India's largest technical festival and connect with over 5,000+ top engineering innovators.
          </p>
          <a
            href="mailto:sponsorship@aura-techfest.org"
            className="px-6 py-2.5 rounded-full border border-white/40 bg-white text-black font-heading text-xs font-black tracking-widest uppercase hover:bg-purple-300 transition-all duration-200 shadow-lg"
          >
            Become a Sponsor
          </a>
        </div>

        <div className="mt-12">
          <Link
            to="/"
            className="font-heading text-xs font-black tracking-widest uppercase text-white/60 hover:text-white transition-colors flex items-center gap-2"
          >
            ← Back to Homepage
          </Link>
        </div>
      </main>
    </div>
  );
}
