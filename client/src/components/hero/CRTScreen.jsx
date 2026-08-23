import React from "react";
import clsx from "clsx";
import CRTOverlay from "../effects/CRTOverlay";

export default function CRTScreen({
  title = "SCREEN_01",
  freq = "42.8 MHz",
  status = "ONLINE",
  variant = "teal", // teal or amber
  className,
  children,
}) {
  return (
    <div className={clsx("flex flex-col h-full w-full", className)}>
      <CRTOverlay variant={variant} className="h-full">
        {/* Terminal Header Info Panel */}
        <div className="flex justify-between items-center text-[8px] opacity-75 border-b border-cyber-teal/20 pb-1 mb-2 font-mono uppercase tracking-wider select-none">
          <div className="flex items-center gap-1">
            <span className={clsx(
              "w-1 h-1 rounded-full",
              status === "ONLINE" ? "bg-cyan-400 animate-ping" : "bg-rose-500"
            )} />
            <span>SYS_{title} // {status}</span>
          </div>
          <div>SIG_FREQ: {freq}</div>
        </div>

        {/* Dynamic Vector/Grid background layout inside screen */}
        <div className="flex-1 flex flex-col justify-between relative overflow-hidden select-text">
          {children}

          {/* Oscilloscope mini vector graph overlay at bottom */}
          <div className="w-full h-8 opacity-25 mt-2 border-t border-dashed border-cyber-teal/25 relative pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
              <path
                d="M 0,10 Q 15,2 30,10 T 60,10 T 90,8 L 100,10"
                fill="none"
                stroke={variant === "amber" ? "#d5a23a" : "#5fa6a7"}
                strokeWidth="1"
                className="animate-[dash_5s_linear_infinite]"
              />
            </svg>
          </div>
        </div>
      </CRTOverlay>
    </div>
  );
}
