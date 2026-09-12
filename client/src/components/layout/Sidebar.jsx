import React from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import eventIcon from "../../assets/event.png";
import aboutIcon from "../../assets/about.png";
import notificationIcon from "../../assets/notification.png";
import galleryIcon from "../../assets/gallery.png";
import mailIcon from "../../assets/mail.png";
import auraLogo from "../../assets/AURA_26_LOGO.png";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const { scrollYProgress } = useScroll();
  const smoothScrollProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });
  
  const dotY = useTransform(smoothScrollProgress, [0, 1], [0, 30]);

  const sidebarItems = [
    { icon: eventIcon, target: "event", tooltip: "The Event", isSvg: false },
    { icon: aboutIcon, target: "about", tooltip: "About Us", isSvg: false },
    { icon: notificationIcon, target: "notifications", tooltip: "Timeline", isSvg: false },
    { icon: galleryIcon, target: "gallery", tooltip: "Gallery", isSvg: false },
    { icon: "sponsor", path: "/sponsors", isRoute: true, tooltip: "SPONSORS", isSvg: true, svgType: "sponsor" },
    { icon: "people", path: "/people", isRoute: true, tooltip: "People", isSvg: true, svgType: "people" },
    { icon: mailIcon, target: "contact", tooltip: "Contact Us", isSvg: false }
  ];

  const handleNavClick = (item) => {
    if (item.isRoute) {
      navigate(item.path);
    } else {
      if (location.pathname !== "/") {
        navigate("/", { state: { scrollTo: item.target } });
        setTimeout(() => {
          const el = document.getElementById(item.target);
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        const el = document.getElementById(item.target);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const renderSvgIcon = (type) => {
    if (type === "sponsor") {
      return (
        <svg
          className="w-5 h-5 text-white filter brightness-200 transition-transform duration-200 group-hover:scale-110"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 15 10-15-10-5zM2 7h20" />
        </svg>
      );
    }
    if (type === "people") {
      return (
        <svg
          className="w-5 h-5 text-white filter brightness-200 transition-transform duration-200 group-hover:scale-110"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    }
    return null;
  };

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-16 bg-[#6f2138] border-r border-[#8d2a47] flex-col items-center z-40 shadow-[4px_0_24px_rgba(111,33,56,0.3)] select-none">
      {/* Top logo block matching header */}
      <div className="h-18 flex items-center justify-center w-full px-2">
        <img 
          src={auraLogo} 
          alt="AURA" 
          onClick={() => {
            if (location.pathname !== "/") navigate("/");
            else {
              const el = document.getElementById("hero");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }
          }}
          className="w-11 h-auto object-contain cursor-pointer select-none filter brightness-200 hover:scale-105 transition-transform"
        />
      </div>

      <div className="flex flex-col gap-3.5 items-center flex-grow pt-3">
        {sidebarItems.map((item, idx) => (
          <div key={idx} className="relative group flex items-center justify-center">
            <button
              onClick={() => handleNavClick(item)}
              aria-label={item.tooltip}
              className={`w-10 h-10 flex items-center justify-center rounded-xl bg-black/15 hover:bg-white/15 active:bg-white/25 border transition-all duration-200 cursor-pointer shadow-md ${
                item.isRoute && location.pathname === item.path
                  ? "border-white bg-white/20 shadow-lg scale-105"
                  : "border-white/10 hover:border-white/30"
              }`}
            >
              {item.isSvg ? (
                renderSvgIcon(item.svgType)
              ) : (
                <img
                  src={item.icon}
                  alt={item.tooltip}
                  className="w-5 h-5 object-contain filter invert brightness-200 transition-transform duration-200 group-hover:scale-110"
                />
              )}
            </button>
            
            {/* Tooltip */}
            <div className="absolute left-16 px-3 py-1.5 rounded-lg bg-black/90 text-xs font-heading font-bold text-white uppercase tracking-wider whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-50 border border-white/15 shadow-[0_4px_16px_rgba(0,0,0,0.6)] backdrop-blur-md">
              {item.tooltip}
            </div>
          </div>
        ))}
      </div>
      
      {/* Functional Scroll Indicator at bottom of sidebar */}
      <div 
        className="w-1.5 h-12 bg-white/20 rounded-full p-0.5 overflow-hidden mb-6 relative cursor-pointer group"
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
