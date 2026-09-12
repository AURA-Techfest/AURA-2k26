import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

import websiteBg from "../../assets/WEBSITE_BG.png";
import auraLogo from "../../assets/AURA_26_LOGO.png";

// Raw Cloudinary URLs with bento layout spans
const RAW_GALLERY_DATA = {
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
  "2025": [
    {
      id: "2025-01",
      src: "https://res.cloudinary.com/dpw89wko7/image/upload/v1789212127/AURA_25_-_01.jpg_u8du0p.jpg",
      span: "col-span-1 sm:col-span-2 lg:col-span-2 row-span-2",
    },
    {
      id: "2025-02",
      src: "https://res.cloudinary.com/dpw89wko7/image/upload/v1789212126/AURA_25_-_02.jpg_aseuwl.jpg",
      span: "col-span-1 sm:col-span-1 lg:col-span-1 row-span-1",
    },
    {
      id: "2025-03",
      src: "https://res.cloudinary.com/dpw89wko7/image/upload/v1789212124/AURA_25_-_03.jpg_xu1flx.jpg",
      span: "col-span-1 sm:col-span-1 lg:col-span-1 row-span-1",
    },
    {
      id: "2025-04",
      src: "https://res.cloudinary.com/dpw89wko7/image/upload/v1789212145/AURA_25_-_04.jpg_ewhloy.jpg",
      span: "col-span-1 sm:col-span-1 lg:col-span-2 row-span-1",
    },
    {
      id: "2025-05",
      src: "https://res.cloudinary.com/dpw89wko7/image/upload/v1789212142/AURA_25_-_05.jpg_is9mmj.jpg",
      span: "col-span-1 sm:col-span-1 lg:col-span-1 row-span-1",
    },
    {
      id: "2025-06",
      src: "https://res.cloudinary.com/dpw89wko7/image/upload/v1789212828/AURA_25_-_06.jpg_bquwbg.jpg",
      span: "col-span-1 sm:col-span-1 lg:col-span-1 row-span-2",
    },
    {
      id: "2025-07",
      src: "https://res.cloudinary.com/dpw89wko7/image/upload/v1789212827/AURA_25_-_07.jpg_e7jpye.jpg",
      span: "col-span-1 sm:col-span-1 lg:col-span-1 row-span-1",
    },
    {
      id: "2025-08",
      src: "https://res.cloudinary.com/dpw89wko7/image/upload/v1789212827/AURA_25_-_08.jpg_ea2uau.jpg",
      span: "col-span-1 sm:col-span-1 lg:col-span-1 row-span-1",
    },
    {
      id: "2025-09",
      src: "https://res.cloudinary.com/dpw89wko7/image/upload/v1789212824/AURA_25_-_09.jpg_akcdff.jpg",
      span: "col-span-1 sm:col-span-2 lg:col-span-2 row-span-1",
    },
  ],
  "2026": [],
};

const AVAILABLE_YEARS = ["2026", "2025", "2024"];

/**
 * Transforms raw Cloudinary URLs with dynamic optimizations
 * reducing image payload from ~9MB to ~120KB to eliminate page lag.
 */
function getOptimizedCloudinaryUrl(url, { width = 1000, quality = "auto", crop = "limit" } = {}) {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("cloudinary.com")) return url;
  if (url.includes("/upload/f_auto")) return url;

  const transformSegment = `f_auto,q_${quality},w_${width},c_${crop}`;
  return url.replace("/upload/", `/upload/${transformSegment}/`);
}

/**
 * Async fetcher with TanStack Query caching
 */
const fetchGalleryItems = async (year) => {
  const rawItems = RAW_GALLERY_DATA[year] || [];
  return rawItems.map((item) => ({
    ...item,
    optimizedSrc: getOptimizedCloudinaryUrl(item.src, { width: 1000, quality: "auto" }),
    fullSrc: getOptimizedCloudinaryUrl(item.src, { width: 1600, quality: "auto" }),
  }));
};

/**
 * 3D Flash Card Pure Photo Component
 */
const FlashCardPhoto = ({ item, index, onOpenLightbox }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: false, margin: "-30px" }}
      transition={{
        duration: 0.45,
        delay: (index % 3) * 0.07,
        ease: "easeOut",
      }}
      whileHover={{
        scale: 1.03,
        rotateY: 3,
        rotateX: -2,
        y: -4,
        transition: { duration: 0.2, ease: "easeOut" },
      }}
      onClick={() => onOpenLightbox(item)}
      className={`group relative rounded-2xl overflow-hidden border-2 border-white/20 hover:border-white/80 shadow-[0_15px_35px_rgba(0,0,0,0.7)] hover:shadow-[0_25px_50px_rgba(255,255,255,0.18)] bg-black/60 transition-all duration-300 transform-gpu cursor-pointer ${
        item.span || ""
      }`}
      style={{
        perspective: 1000,
        minHeight: "clamp(240px, 30vw, 340px)",
      }}
    >
      {/* Loading Skeleton */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-white/5 animate-pulse z-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      )}

      {/* Pure Optimized Photo */}
      <img
        src={item.optimizedSrc}
        alt={`AURA Gallery Photo ${index + 1}`}
        loading="lazy"
        decoding="async"
        onLoad={() => setImageLoaded(true)}
        className={`w-full h-full object-cover object-center transition-all duration-500 will-change-transform ${
          imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
        } group-hover:scale-106`}
      />

      {/* 3D Flash Card Light Sheen Beam on Hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/35 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none z-10" />

      {/* Subtle Vignette on Hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-200 pointer-events-none z-10" />
    </motion.div>
  );
};

/**
 * Clean Fullscreen Lightbox Modal with Prominent Top Back Button
 */
const LightboxModal = ({ item, onClose, onPrev, onNext }) => {
  const [modalImageLoaded, setModalImageLoaded] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onPrev, onNext]);

  if (!item) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-between p-4 sm:p-6 md:p-8 select-none"
    >
      {/* Top Action Bar with Prominent Back Button */}
      <div 
        className="w-full flex items-center justify-between z-30 pb-3 border-b border-white/15"
        style={{ maxWidth: "clamp(320px, 94vw, 1300px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="px-6 py-2 border-2 border-white rounded-full bg-black/60 hover:bg-white hover:text-black text-white font-heading text-xs sm:text-sm font-black tracking-widest uppercase transition-all duration-200 cursor-pointer shadow-lg flex items-center gap-2"
        >
          ← BACK
        </button>

        <span className="font-heading text-xs sm:text-sm font-black text-white/70 uppercase tracking-widest">
          AURA PHOTO ARCHIVE
        </span>

        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white text-white hover:text-black flex items-center justify-center transition-all cursor-pointer shadow-lg font-black text-sm"
        >
          ✕
        </button>
      </div>

      {/* Enlarged Photo Container with Fluid Clamp Dimensions */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="relative flex-grow w-full my-auto flex items-center justify-center overflow-hidden"
        style={{
          maxWidth: "clamp(320px, 94vw, 1300px)",
          height: "clamp(380px, 80vh, 850px)",
        }}
      >
        {/* Loading Spinner */}
        {!modalImageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-12 h-12 rounded-full border-3 border-white/20 border-t-white animate-spin" />
          </div>
        )}

        {/* Previous Button */}
        <button
          onClick={onPrev}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/70 hover:bg-white text-white hover:text-black border-2 border-white/40 flex items-center justify-center transition-all duration-200 cursor-pointer shadow-2xl hover:scale-110"
        >
          ←
        </button>

        {/* Next Button */}
        <button
          onClick={onNext}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/70 hover:bg-white text-white hover:text-black border-2 border-white/40 flex items-center justify-center transition-all duration-200 cursor-pointer shadow-2xl hover:scale-110"
        >
          →
        </button>

        {/* Full Image */}
        <img
          key={item.fullSrc}
          src={item.fullSrc}
          alt="AURA Gallery Enlarge View"
          onLoad={() => setModalImageLoaded(true)}
          className={`max-h-[75vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl border-2 border-white/30 transition-all duration-300 ${
            modalImageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        />
      </motion.div>

      {/* Bottom Hint */}
      <div className="w-full text-center py-2 text-white/50 text-xs font-mono">
        Use ← / → keys to navigate • Press ESC or click BACK to exit
      </div>
    </motion.div>
  );
};

export default function GalleryDetail({ onRegisterClick }) {
  const { year } = useParams();
  const navigate = useNavigate();

  const selectedYear = year && AVAILABLE_YEARS.includes(year) ? year : "2024";

  // TanStack Query for instant caching & optimized data loading
  const {
    data: photos = [],
    isLoading,
  } = useQuery({
    queryKey: ["gallery", selectedYear],
    queryFn: () => fetchGalleryItems(selectedYear),
    staleTime: 1000 * 60 * 15, // 15 mins cache
    gcTime: 1000 * 60 * 60, // 1 hour memory
  });

  const hasPhotos = photos.length > 0;

  // Lightbox State
  const [activeLightboxIndex, setActiveLightboxIndex] = useState(null);

  const handleOpenLightbox = useCallback((item) => {
    const idx = photos.findIndex((p) => p.id === item.id);
    if (idx !== -1) setActiveLightboxIndex(idx);
  }, [photos]);

  const handlePrevLightbox = useCallback(() => {
    if (activeLightboxIndex !== null) {
      setActiveLightboxIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
    }
  }, [photos.length, activeLightboxIndex]);

  const handleNextLightbox = useCallback(() => {
    if (activeLightboxIndex !== null) {
      setActiveLightboxIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
    }
  }, [photos.length, activeLightboxIndex]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [selectedYear]);

  return (
    <div
      className="min-h-screen w-full relative bg-cover bg-center overflow-y-auto custom-scrollbar py-6 sm:py-8 px-4 sm:px-6 md:px-10 lg:px-16 flex flex-col items-center justify-start text-white select-none font-body"
      style={{ backgroundImage: `url(${websiteBg})`, backgroundAttachment: "fixed" }}
    >
      {/* Cosmic Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/75 to-black/95 pointer-events-none z-0" />

      {/* Top Navigation Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-20 w-full max-w-7xl flex items-center justify-between mb-8 pb-4 border-b border-white/20"
      >
        <button
          onClick={() => navigate("/")}
          className="px-5 sm:px-6 py-2 border-2 border-white rounded-full bg-black/50 hover:bg-white hover:text-black text-white font-heading text-xs sm:text-sm font-black tracking-widest uppercase transition-all duration-200 cursor-pointer shadow-lg flex items-center gap-2"
        >
          ← HOME
        </button>

        <div className="flex flex-col items-center">
          <h1
            className="font-heading font-black text-white tracking-widest uppercase text-center drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]"
            style={{ fontSize: "clamp(1.3rem, 3.8vw, 2.7rem)" }}
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
      </motion.header>

      {/* Year Selector Tabs with 3D Pop Effect */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative z-20 flex items-center justify-center gap-3 sm:gap-4 mb-10 flex-wrap"
      >
        {AVAILABLE_YEARS.map((yr) => {
          const isActive = yr === selectedYear;
          return (
            <button
              key={yr}
              onClick={() => navigate(`/gallery/${yr}`)}
              className={`px-6 sm:px-8 py-2.5 rounded-full font-heading text-xs sm:text-sm font-black tracking-widest uppercase transition-all duration-300 cursor-pointer flex items-center gap-2 shadow-lg ${
                isActive
                  ? "bg-white text-black border-2 border-white shadow-[0_0_25px_rgba(255,255,255,0.6)] scale-105"
                  : "bg-black/60 text-white/80 border border-white/30 hover:border-white hover:text-white hover:bg-black/80 hover:scale-102"
              }`}
            >
              <span>{yr}</span>
              {isActive && (
                <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]" />
              )}
            </button>
          );
        })}
      </motion.div>

      {/* Main Content Area */}
      <div className="relative z-20 w-full max-w-7xl">
        {isLoading ? (
          /* Loading Skeletons */
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-16"
            style={{ gridAutoRows: "clamp(240px, 32vw, 320px)" }}
          >
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border-2 border-white/10 bg-white/5 animate-pulse flex items-center justify-center"
              >
                <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              </div>
            ))}
          </div>
        ) : hasPhotos ? (
          /* 3D Flash Card Pure Photo Bento Grid with Fluid Clamp Sizing */
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-16"
            style={{
              gridAutoRows: "clamp(260px, 34vw, 340px)",
              gap: "clamp(1rem, 2.5vw, 2rem)",
            }}
          >
            {photos.map((item, index) => (
              <FlashCardPhoto
                key={item.id}
                item={item}
                index={index}
                onOpenLightbox={handleOpenLightbox}
              />
            ))}
          </div>
        ) : (
          /* Coming Soon Section for 2026 */
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7 }}
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
              onClick={() => navigate("/gallery/2025")}
              className="px-8 py-3 border-2 border-white rounded-full bg-white text-black hover:bg-cyan-300 font-heading text-xs sm:text-sm font-black tracking-widest uppercase transition-all shadow-xl cursor-pointer"
            >
              ← VIEW AURA 2025 GALLERY
            </button>
          </motion.div>
        )}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {activeLightboxIndex !== null && (
          <LightboxModal
            item={photos[activeLightboxIndex]}
            onClose={() => setActiveLightboxIndex(null)}
            onPrev={handlePrevLightbox}
            onNext={handleNextLightbox}
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="w-full max-w-7xl pt-8 pb-4 border-t border-white/20 text-center font-body text-xs sm:text-sm font-bold text-white/70">
        <p>
          AURA 2K26 • Aliah University • Official Event Photo Archives • Contact us at{" "}
          <a
            href="mailto:aura@aliah.ac.in"
            className="text-white underline font-black hover:text-cyan-300"
          >
            aura@aliah.ac.in
          </a>
        </p>
      </footer>
    </div>
  );
}

