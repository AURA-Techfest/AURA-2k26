import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import websiteBg from "../../assets/WEBSITE_BG.png";
import auraLogo from "../../assets/AURA_26_LOGO.png";

const GALLERY_DATA = {
  "2024": [
    {
      id: "2024-01",
      src: "https://res.cloudinary.com/dpw89wko7/image/upload/v1789209443/AURA_24_-_01.JPG_ktxaqc.jpg",
      span: "col-span-1 sm:col-span-2 lg:col-span-2 row-span-2",
    },
    {
      id: "2024-02",
      src: "https://res.cloudinary.com/dpw89wko7/image/upload/v1789209435/AURA_24_-_02.JPG_hp8ixv.jpg",
      span: "col-span-1 sm:col-span-1 lg:col-span-1 row-span-1",
    },
    {
      id: "2024-03",
      src: "https://res.cloudinary.com/dpw89wko7/image/upload/v1789209406/AURA_24_-_03.JPG_abo96k.jpg",
      span: "col-span-1 sm:col-span-1 lg:col-span-1 row-span-1",
    },
    {
      id: "2024-04",
      src: "https://res.cloudinary.com/dpw89wko7/image/upload/v1789209396/AURA_24_-_04.JPG_uyprih.jpg",
      span: "col-span-1 sm:col-span-1 lg:col-span-1 row-span-1",
    },
    {
      id: "2024-05",
      src: "https://res.cloudinary.com/dpw89wko7/image/upload/v1789209402/AURA_24_-_05.JPG_xm80ja.jpg",
      span: "col-span-1 sm:col-span-1 lg:col-span-1 row-span-1",
    },
    {
      id: "2024-06",
      src: "https://res.cloudinary.com/dpw89wko7/image/upload/v1789209399/AURA_24_-_06.JPG_qgbs0e.jpg",
      span: "col-span-1 sm:col-span-2 lg:col-span-1 row-span-1",
    },
    {
      id: "2024-07",
      src: "https://res.cloudinary.com/dpw89wko7/image/upload/v1789209381/AURA_24_-_07.JPG_iv7a6r.jpg",
      span: "col-span-1 sm:col-span-1 lg:col-span-1 row-span-1",
    },
    {
      id: "2024-08",
      src: "https://res.cloudinary.com/dpw89wko7/image/upload/v1789209359/AURA_24_-_08.JPG_ustb2g.jpg",
      span: "col-span-1 sm:col-span-2 lg:col-span-2 row-span-1",
    },
  ],
  "2025": [],
  "2026": [],
};

const AVAILABLE_YEARS = ["2026", "2025", "2024"];

export default function GalleryDetail({ onRegisterClick }) {
  const { year } = useParams();
  const navigate = useNavigate();

  const selectedYear = year && AVAILABLE_YEARS.includes(year) ? year : "2024";
  const photos = GALLERY_DATA[selectedYear] || [];
  const hasPhotos = photos.length > 0;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [selectedYear]);

  return (
    <div
      className="min-h-screen w-full relative bg-cover bg-center overflow-y-auto custom-scrollbar py-8 px-4 sm:px-6 md:px-10 lg:px-16 flex flex-col items-center justify-start text-white select-none font-body"
      style={{ backgroundImage: `url(${websiteBg})`, backgroundAttachment: "fixed" }}
    >
      {/* Dark Overlay with Cosmic Tint */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/75 to-black/95 pointer-events-none z-0" />

      {/* Top Header Actions Bar */}
      <header className="relative z-20 w-full max-w-7xl flex items-center justify-between mb-8 pb-4 border-b border-white/20">
        <button
          onClick={() => navigate("/")}
          className="px-5 sm:px-6 py-2 border-2 border-white rounded-full bg-black/50 hover:bg-white hover:text-black text-white font-heading text-xs sm:text-sm font-black tracking-widest uppercase transition-all duration-200 cursor-pointer shadow-lg flex items-center gap-2"
        >
          ← HOME
        </button>

        <div className="flex flex-col items-center">
          <h1
            className="font-heading font-black text-white tracking-widest uppercase text-center drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
            style={{ fontSize: "clamp(1.25rem, 3.5vw, 2.5rem)" }}
          >
            AURA {selectedYear} GALLERY
          </h1>
        </div>

        <button
          onClick={onRegisterClick}
          className="px-5 sm:px-6 py-2 border-2 border-white rounded-full bg-black/50 hover:bg-white hover:text-black text-white font-heading text-xs sm:text-sm font-black tracking-widest uppercase transition-all duration-200 cursor-pointer shadow-lg"
        >
          JOIN US
        </button>
      </header>

      {/* Year Selector Tabs */}
      <div className="relative z-20 flex items-center justify-center gap-3 sm:gap-4 mb-10 flex-wrap">
        {AVAILABLE_YEARS.map((yr) => {
          const isActive = yr === selectedYear;
          return (
            <button
              key={yr}
              onClick={() => navigate(`/gallery/${yr}`)}
              className={`px-6 py-2.5 rounded-full font-heading text-xs sm:text-sm font-black tracking-widest uppercase transition-all duration-200 cursor-pointer flex items-center gap-2 shadow-lg ${
                isActive
                  ? "bg-white text-black border-2 border-white shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                  : "bg-black/60 text-white/80 border border-white/30 hover:border-white hover:text-white hover:bg-black/80"
              }`}
            >
              <span>{yr}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="relative z-20 w-full max-w-7xl">
        {hasPhotos ? (
          /* Bento-Style Clean Static Image Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 auto-rows-[280px] sm:auto-rows-[300px] mb-16">
            {photos.map((item, index) => (
              <div
                key={item.id}
                className={`relative rounded-2xl overflow-hidden border-2 border-white/30 shadow-[0_15px_35px_rgba(0,0,0,0.8)] bg-black/40 ${
                  item.span || ""
                }`}
              >
                <img
                  src={item.src}
                  alt={`AURA Gallery Item ${index + 1}`}
                  loading="lazy"
                  className="w-full h-full object-cover object-center"
                />
              </div>
            ))}
          </div>
        ) : (
          /* Empty / Coming Soon State for years with no photos */
          <div
            className="w-full border-2 border-white/60 rounded-3xl backdrop-blur-xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] my-12 p-8 sm:p-12 md:p-16 flex flex-col items-center text-center max-w-2xl mx-auto"
            style={{
              background:
                "radial-gradient(circle at 50% 0%, rgba(119, 32, 61, 0.85), rgba(20, 20, 35, 0.9))",
            }}
          >
            <img
              src={auraLogo}
              alt="AURA 2K26"
              className="w-20 sm:w-28 h-auto mb-6 filter brightness-125 drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]"
            />

            <span className="px-5 py-1.5 rounded-full border border-cyan-400/50 bg-cyan-950/40 text-cyan-300 font-heading text-xs font-black tracking-widest uppercase mb-6 shadow-md">
              AURA {selectedYear} EVENT GALLERY
            </span>

            <h2 className="font-heading font-black text-3xl sm:text-5xl text-white uppercase tracking-widest mb-4 drop-shadow-xl">
              COMING SOON
            </h2>

            <p className="font-body text-sm sm:text-base md:text-lg font-bold text-white/80 max-w-xl leading-relaxed mb-8">
              The official photo gallery and highlights for{" "}
              <span className="text-cyan-300 font-black">AURA {selectedYear}</span> are being curated. Check out our previous edition gallery to relive the moments!
            </p>

            <button
              onClick={() => navigate("/gallery/2024")}
              className="px-8 py-3 border-2 border-white rounded-full bg-white text-black hover:bg-cyan-300 font-heading text-xs sm:text-sm font-black tracking-widest uppercase transition-all shadow-xl cursor-pointer"
            >
              ← VIEW AURA 2024 GALLERY
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="w-full max-w-7xl pt-8 pb-4 border-t border-white/20 text-center font-body text-xs sm:text-sm font-bold text-white/70">
        <p>
          AURA 2K26 • Aliah University • Official Event Photo Archives • Contact us at{" "}
          <a href="mailto:aura@aliah.ac.in" className="text-white underline font-black hover:text-cyan-300">
            aura@aliah.ac.in
          </a>
        </p>
      </footer>
    </div>
  );
}

