import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function ControlRoomHero({ onStartCore, systemState }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [switches, setSwitches] = useState({
    grid: true,
    telemetry: true,
    sensor: false,
  });

  const handleMouseMove = (e) => {
    // Normalized offset from center of viewport (-1 to 1)
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;
    setMousePos({ x, y });
  };

  return (
    <div
      className="relative w-full h-full bg-cyber-bg grid-bg flex flex-col items-center justify-start p-4 md:p-6 overflow-y-auto overflow-x-hidden"
      onMouseMove={handleMouseMove}
      style={{ perspective: "1000px" }}
    >
      {/* Decorative overhead support girders (1980s retro geometric layout) */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#1c110e] to-transparent opacity-60 z-10 pointer-events-none" />

      {/* Structural panel seams in backgrounds */}
      <div className="absolute top-0 bottom-0 left-12 w-0.5 bg-cyber-brown/15 border-r border-cyber-copper/5 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-12 w-0.5 bg-cyber-brown/15 border-l border-cyber-copper/5 pointer-events-none" />

      {/* Main Cockpit Panel (3D Tilting) */}
      <motion.div
        animate={{
          rotateY: mousePos.x * 3, // Subtle pan left/right
          rotateX: -mousePos.y * 3, // Subtle pan up/down
        }}
        transition={{ type: "tween", ease: "easeOut", duration: 0.8 }}
        style={{ transformStyle: "preserve-3d" }}
        className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10"
      >
      </motion.div>
    </div>
  );
}
