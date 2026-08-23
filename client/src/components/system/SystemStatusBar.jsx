import React, { useEffect, useState } from "react";
import clsx from "clsx";
import LedIndicator from "../ui/LedIndicator";
import { HACKATHON_INFO } from "../../data/hackathonData";

export default function SystemStatusBar({ scrollProgress, systemState, onNavClick }) {
  const [activeSection, setActiveSection] = useState("hero");

  // Map scroll progress (0 to 100) to narrative stages
  let powerPercent = Math.min(15 + Math.floor(scrollProgress * 0.85), 100);
  if (systemState > 0 && powerPercent < 87) {
    powerPercent = Math.max(powerPercent, 87); // Boost power if core initialized
  }

  let statusText = "SYSTEM OFFLINE";
  let ledStatus = "STANDBY";

  if (powerPercent >= 100) {
    statusText = "SYSTEM FULLY OPERATIONAL";
    ledStatus = "ONLINE";
  } else if (powerPercent >= 85) {
    statusText = "BUILD PROTOCOL ACTIVE";
    ledStatus = "ONLINE";
  } else if (powerPercent >= 60) {
    statusText = "MISSION BRIEFING LOADED";
    ledStatus = "ONLINE";
  } else if (powerPercent >= 40) {
    statusText = "HARDWARE MODULES ONLINE";
    ledStatus = "ONLINE";
  } else if (powerPercent > 15) {
    statusText = "CORE INITIALIZING";
    ledStatus = "PENDING";
  }

  // Detect which section is active in viewport
  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        "hero",
        "mission",
        "hardware",
        "tracks",
        "timeline",
        "prizes",
        "faq",
        "register",
      ];
      const scrollPos = window.scrollY + window.innerHeight / 3;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { id: "mission", num: "01", label: "MISSION" },
    { id: "hardware", num: "02", label: "HARDWARE" },
    { id: "tracks", num: "03", label: "TRACKS" },
    { id: "timeline", num: "04", label: "TIMELINE" },
    { id: "prizes", num: "05", label: "PRIZES" },
    { id: "faq", num: "06", label: "FAQ" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-cyber-dark/95 border-b-2 border-cyber-copper shadow-[0_4px_20px_rgba(0,0,0,0.85)] select-none">
      
      {/* Top telemetry diagnostic strip */}
      <div className="bg-[#1b100e] border-b border-cyber-brown/30 px-4 py-1.5 flex flex-wrap justify-between items-center text-[8px] sm:text-[9px] font-mono text-cyber-muted tracking-wider gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <LedIndicator status={ledStatus} size="sm" />
            <span className="text-cyber-teal-light font-bold glow-teal">SYS_STATUS: {statusText}</span>
          </div>
          <span className="hidden sm:inline">|</span>
          <span className="hidden sm:inline">CORE_POWER: <span className="text-cyber-amber font-bold">{powerPercent}%</span></span>
          <span className="hidden md:inline">|</span>
          <span className="hidden md:inline">NODE_TELEMETRY: <span className="text-cyber-teal font-bold">{HACKATHON_INFO.telemetry.network}</span></span>
        </div>

        {/* Scroll status bar visual */}
        <div className="flex items-center gap-2">
          <span className="hidden xs:inline">CHARGE_GRID:</span>
          <div className="w-24 h-2.5 bg-black/50 border border-cyber-brown/40 p-0.5 flex">
            <div
              className="h-full bg-cyber-teal transition-all duration-100"
              style={{ width: `${powerPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main navigation row */}
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo label */}
        <button
          onClick={() => onNavClick("hero")}
          className="interactive font-display font-black text-sm tracking-wider text-cyber-light-copper hover:text-cyber-teal-light transition-colors duration-100 flex items-center gap-1.5 cursor-pointer"
        >
          <span className="text-cyber-teal font-mono text-xs font-bold">[HACK]</span>
          <span>{HACKATHON_INFO.name}</span>
        </button>

        {/* Desktop Nav menu */}
        <nav className="hidden md:flex items-center gap-6 font-mono text-[10px] tracking-widest font-bold">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavClick(item.id)}
              className={clsx(
                "interactive transition-colors duration-100 uppercase cursor-pointer hover:text-cyber-teal-light py-1",
                activeSection === item.id
                  ? "text-cyber-teal border-b-2 border-cyber-teal glow-teal"
                  : "text-cyber-text/70"
              )}
            >
              <span className="text-cyber-muted font-normal mr-1">{item.num}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Action button */}
        <button
          onClick={() => onNavClick("register")}
          className="interactive border border-cyber-teal bg-cyber-teal/5 hover:bg-cyber-teal hover:text-cyber-bg text-cyber-teal text-[10px] font-mono font-bold tracking-widest uppercase px-4 py-1.5 transition-all duration-150 transform active:scale-95 shadow-[0_0_8px_rgba(95,166,167,0.15)] cursor-pointer"
        >
          INITIALIZE BUILD
        </button>
      </div>

    </header>
  );
}
