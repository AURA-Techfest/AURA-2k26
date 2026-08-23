import React from "react";
import clsx from "clsx";

export default function MacTabWindow({ children, title = "AURA-2K26 // CYBERTRONIAN_HARDWARE_LAB", className }) {
  return (
    <div
      className={clsx(
        "w-full h-full rounded-xl border border-neutral-300 bg-cyber-bg shadow-[0_25px_60px_rgba(0,0,0,0.45)] flex flex-col overflow-hidden select-none",
        className
      )}
    >
      {/* Mac Header Bar */}
      <div className="bg-neutral-100 border-b border-neutral-200 px-4 py-3 flex items-center justify-between z-10">
        
        {/* Left window control nodes */}
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]" />
        </div>

        {/* Center title */}
        <div className="font-mono text-[9px] md:text-[10px] font-bold text-neutral-500 uppercase tracking-widest text-center select-text">
          {title}
        </div>

        {/* Right offset balance */}
        <div className="w-12 h-3" />

      </div>

      {/* Main Window Body Workspace */}
      <div className="flex-1 relative overflow-hidden bg-cyber-bg">
        {children}
      </div>
      
    </div>
  );
}
