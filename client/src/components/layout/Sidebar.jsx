import React from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import eventIcon from "../../assets/event.png";
import notificationIcon from "../../assets/notification.png";
import aboutIcon from "../../assets/about.png";
import galleryIcon from "../../assets/gallery.png";
import mailIcon from "../../assets/mail.png";
import auraLogo from "../../assets/AURA_26_LOGO.png";

function Sidebar() {
  const { scrollYProgress } = useScroll();
  const smoothScrollProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });
  
  // Outer track = 48px height, 2px padding top/bottom (44px inner), inner dot = 14px height.
  // Travel distance = 44px - 14px = 30px
  const dotY = useTransform(smoothScrollProgress, [0, 1], [0, 30]);

  const sidebarItems = [
    { icon: eventIcon, target: "event", tooltip: "The Event", isSvg: false },
    { icon: aboutIcon, target: "about", tooltip: "About Us", isSvg: false },
    { icon: "timeline", target: "notifications", tooltip: "Timeline", isSvg: true },
    { icon: galleryIcon, target: "gallery", tooltip: "Gallery", isSvg: false },
    { icon: mailIcon, target: "contact", tooltip: "Contact Us", isSvg: false }
  ];

  const handleScroll = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-16 bg-[#6f2138] border-r border-[#8d2a47] flex-col items-center z-40 shadow-[4px_0_24px_rgba(111,33,56,0.3)]">
      {/* Top logo block matching the screenshot */}
      <div className="h-18 flex items-center justify-center w-full px-2">
        <img 
          src={auraLogo} 
          alt="AURA" 
          onClick={() => handleScroll("hero")}
          className="w-12 h-auto object-contain cursor-pointer select-none filter brightness-200"
        />
      </div>

      <div className="flex flex-col gap-6 items-center flex-grow pt-8">
        {sidebarItems.map((item, idx) => (
          <div key={idx} className="relative group flex items-center justify-center">
            <button
              onClick={() => handleScroll(item.target)}
              className="w-11 h-11 flex items-center justify-center rounded-lg bg-black/10 hover:bg-white/10 active:bg-white/20 border border-white/5 hover:border-white/20 transition-all duration-200 cursor-pointer shadow-inner"
            >
              {item.isSvg ? (
                <svg
                  className="w-5 h-5 text-white filter brightness-200 transition-transform duration-200 group-hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="9" />
                  <polyline points="12 7 12 12 15 15" />
                </svg>
              ) : (
                <img
                  src={item.icon}
                  alt={item.tooltip}
                  className="w-6 h-6 object-contain filter invert brightness-200 transition-transform duration-200 group-hover:scale-110"
                />
              )}
            </button>
            
            {/* Tooltip */}
            <div className="absolute left-20 px-3 py-1.5 rounded bg-black/90 text-xs font-heading font-bold text-white uppercase tracking-wider whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50 border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
              {item.tooltip}
            </div>
          </div>
        ))}
      </div>
      
      {/* Functional Scroll Indicator at bottom of sidebar */}
      <div 
        className="w-1.5 h-12 bg-white/20 rounded-full p-0.5 overflow-hidden mb-8 relative cursor-pointer group"
        title="Scroll to Top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <motion.div 
          style={{ y: dotY }}
          className="w-full h-3.5 bg-rose-400 rounded-full shadow-[0_0_8px_rgba(251,113,133,0.9)] transition-colors group-hover:bg-white" 
        />
      </div>
    </aside>
  );
}

export default Sidebar;
