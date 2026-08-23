import React from "react";
import clsx from "clsx";

export default function CRTOverlay({ children, variant = "teal", className }) {
  return (
    <div
      className={clsx(
        "crt-screen-container w-full h-full flex flex-col relative",
        className
      )}
    >
      {/* Screen Frame Bezel Gloss reflection overlay */}
      <div className="absolute inset-0 pointer-events-none glass-shield z-20 rounded-[4px]" />

      {/* Screen contents */}
      <div
        className={clsx(
          "crt-screen flex-1 p-4 md:p-6 text-cyber-text font-mono relative overflow-y-auto",
          variant === "amber" && "crt-amber"
        )}
      >
        {/* Scanning telemetry line */}
        <div className="scanline" />

        {/* Dynamic Static Grain */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-repeat z-15" 
          style={{
            backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noiseFilter\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.65\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noiseFilter)\"/%3E%3C/svg%3E')"
          }}
        />

        {/* Real Content */}
        <div className="relative z-10 w-full h-full flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}
