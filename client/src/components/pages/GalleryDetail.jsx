import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import websiteBg from "../../assets/WEBSITE_BG.png";
import auraLogo from "../../assets/AURA_26_LOGO.png";

export default function GalleryDetail({ onRegisterClick }) {
  const { year } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const displayYear = year || "2026";

  return (
    <div
      className="min-h-screen w-full relative bg-cover bg-center overflow-y-auto custom-scrollbar py-8 px-4 sm:px-6 md:px-10 flex flex-col items-center justify-start text-white select-none font-body"
      style={{ backgroundImage: `url(${websiteBg})`, backgroundAttachment: "fixed" }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/70 to-black/95 pointer-events-none z-0" />

      {/* Top Header Actions Bar */}
      <div className="relative z-20 w-full max-w-4xl flex items-center justify-between mb-8">
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2 border-2 border-white rounded-full bg-black/40 hover:bg-white hover:text-black text-white font-heading text-xs font-black tracking-widest uppercase transition-all duration-200 cursor-pointer shadow-lg flex items-center gap-2"
        >
          ← BACK TO HOME
        </button>

        <h1
          className="font-heading font-black text-white tracking-widest uppercase text-center drop-shadow-md hidden sm:block text-2xl"
        >
          GALLERY {displayYear}
        </h1>

        <button
          onClick={onRegisterClick}
          className="px-6 py-2 border-2 border-white rounded-full bg-black/40 hover:bg-white hover:text-black text-white font-heading text-xs font-black tracking-widest uppercase transition-all duration-200 cursor-pointer shadow-lg"
        >
          JOIN US
        </button>
      </div>

      {/* Main Glass Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-20 w-full border-2 border-white/60 rounded-3xl backdrop-blur-xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] my-auto p-8 sm:p-12 md:p-16 flex flex-col items-center text-center max-w-3xl"
        style={{
          background: "radial-gradient(circle at 50% 0%, rgba(119, 32, 61, 0.85), rgba(20, 20, 35, 0.9))"
        }}
      >
        <img
          src={auraLogo}
          alt="AURA 2K26"
          className="w-20 sm:w-28 h-auto mb-6 filter brightness-125 drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]"
        />

        <span className="px-5 py-1.5 rounded-full border border-cyan-400/50 bg-cyan-950/40 text-cyan-300 font-heading text-xs font-black tracking-widest uppercase mb-6 shadow-md">
          AURA {displayYear} EVENT GALLERY
        </span>

        <h2 className="font-heading font-black text-3xl sm:text-5xl text-white uppercase tracking-widest mb-4 drop-shadow-xl">
          COMING SOON
        </h2>

        <p className="font-body text-sm sm:text-base md:text-lg font-bold text-white/80 max-w-xl leading-relaxed mb-8">
          The official photo gallery and highlights for <span className="text-cyan-300 font-black">AURA {displayYear}</span> will be published here soon. Stay tuned for project showcases, stage keynotes, and ceremony moments!
        </p>

        <button
          onClick={() => navigate("/")}
          className="px-8 py-3 border-2 border-white rounded-full bg-white text-black hover:bg-cyan-300 font-heading text-xs sm:text-sm font-black tracking-widest uppercase transition-all shadow-xl cursor-pointer"
        >
          ← EXPLORE HOMEPAGE
        </button>
      </motion.div>
    </div>
  );
}
