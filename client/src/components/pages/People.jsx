import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../layout/Navbar";
import auraLogo from "../../assets/AURA_26_LOGO.png";

export default function People({ onRegisterClick }) {
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
          Team & Organizing Committee
        </span>

        <h1 className="font-heading font-black text-3xl sm:text-5xl md:text-6xl uppercase tracking-wider text-white mb-6">
          MEET THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-300 to-pink-500">PEOPLE</span>
        </h1>

        <p className="font-body text-white/70 text-sm sm:text-base md:text-lg max-w-2xl leading-relaxed mb-12">
          The passionate student leaders, faculty advisors, and coordinators driving AURA 2K26 at Aliah University.
        </p>

        {/* Committee Categories */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full mb-16">
          {[
            { role: "Faculty Advisors", desc: "Mentors from Department of Computer Science & Engineering", status: "Announcing Soon" },
            { role: "Student Coordinators", desc: "Core Event Management & Logistics Team", status: "Announcing Soon" },
            { role: "Technical Leads", desc: "Hardware & Submission Portal Engineers", status: "Announcing Soon" }
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-black/50 border border-white/15 backdrop-blur-md rounded-2xl p-8 flex flex-col items-center justify-center hover:border-purple-400/50 transition-all duration-300 shadow-xl group"
            >
              <h3 className="font-heading font-black text-xl text-white mb-2 group-hover:text-purple-300 transition-colors">
                {item.role}
              </h3>
              <p className="font-body text-xs text-white/60 mb-4 leading-relaxed">
                {item.desc}
              </p>
              <span className="px-3 py-1 rounded-full bg-white/10 text-white/50 text-[10px] font-heading font-bold uppercase tracking-widest">
                {item.status}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6">
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
