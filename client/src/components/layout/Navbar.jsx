import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import auraLogo from "../../assets/AURA_26_LOGO.png";
import eventIcon from "../../assets/event.png";
import aboutIcon from "../../assets/about.png";
import notificationIcon from "../../assets/notification.png";
import galleryIcon from "../../assets/gallery.png";
import mailIcon from "../../assets/mail.png";

function Navbar({ onRegisterClick }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: "The Event", target: "event", icon: eventIcon, isSvg: false },
    { label: "About Us", target: "about", icon: aboutIcon, isSvg: false },
    { label: "Timeline", target: "notifications", icon: notificationIcon, isSvg: false },
    { label: "Gallery", target: "gallery", icon: galleryIcon, isSvg: false },
    { label: "SPONSORS", path: "/sponsors", isRoute: true, isSvg: true, svgType: "sponsor" },
    { label: "People", path: "/people", isRoute: true, isSvg: true, svgType: "people" },
    { label: "Contact Us", target: "contact", icon: mailIcon, isSvg: false }
  ];

  const handleNavClick = (item) => {
    setMobileMenuOpen(false);
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

  const renderSvgIcon = (type, className = "w-3.5 h-3.5 text-white") => {
    if (type === "sponsor") {
      return (
        <svg
          className={className}
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
          className={className}
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
    <>
      <nav className="navbar-glass fixed top-0 left-0 md:left-16 right-0 h-16 md:h-18 px-4 sm:px-6 md:px-12 flex items-center justify-between z-50 border-b border-white/5 backdrop-blur-md">
        {/* Mobile Header: Left Brand Logo */}
        <div className="flex items-center gap-3 md:hidden">
          <img
            src={auraLogo}
            alt="AURA 2K26"
            onClick={() => {
              if (location.pathname !== "/") navigate("/");
              else {
                const el = document.getElementById("hero");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className="w-9 h-auto object-contain cursor-pointer select-none filter brightness-200"
          />
        </div>

        {/* Desktop Spacer to balance centering */}
        <div className="w-28 hidden lg:block" />

        {/* Centered Navigation Links (Desktop) */}
        <div className="hidden md:flex items-center gap-3 md:gap-4 lg:gap-6 flex-grow justify-center">
          {navItems.map((item) => {
            const isActiveRoute = item.isRoute && location.pathname === item.path;
            return (
              <button
                key={item.label}
                onClick={() => handleNavClick(item)}
                className={`group flex items-center gap-1.5 font-heading text-[10px] md:text-xs uppercase tracking-widest transition-all duration-200 cursor-pointer ${
                  isActiveRoute
                    ? "text-white font-black border-b border-white/80 pb-0.5"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {item.isSvg ? (
                  renderSvgIcon(item.svgType, "w-3.5 h-3.5 text-white/80 group-hover:text-white filter brightness-200 transition-opacity")
                ) : (
                  <img
                    src={item.icon}
                    alt=""
                    className="w-3.5 h-3.5 object-contain filter invert brightness-200 opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                )}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Action Container (Desktop & Mobile) */}
        <div className="flex items-center gap-3 w-auto lg:w-28 justify-end shrink-0">
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              if (onRegisterClick) onRegisterClick();
            }}
            className="px-3.5 sm:px-4.5 py-1.5 sm:py-2 border-2 border-white rounded-full bg-black/40 hover:bg-white hover:text-black text-white font-heading text-[9px] sm:text-[10px] font-black tracking-widest uppercase transition-all duration-200 cursor-pointer shadow-lg"
          >
            Register
          </button>

          {/* Hamburger Menu Toggle (Mobile Only) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-white/20 bg-black/50 text-white hover:bg-white/10 transition-colors"
          >
            <svg
              className="w-5 h-5 text-white transition-transform duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Animated Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-x-0 top-16 z-40 bg-[#0b0909]/95 backdrop-blur-xl border-b border-white/15 px-6 py-8 flex flex-col gap-6 md:hidden shadow-2xl"
          >
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item)}
                  className="flex items-center gap-3 text-left font-heading text-sm uppercase tracking-widest text-white/80 hover:text-white py-2 border-b border-white/5 transition-colors"
                >
                  {item.isSvg ? (
                    renderSvgIcon(item.svgType, "w-4 h-4 text-white/80 filter brightness-200")
                  ) : (
                    <img
                      src={item.icon}
                      alt=""
                      className="w-4 h-4 object-contain filter invert brightness-200 opacity-80"
                    />
                  )}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onRegisterClick) onRegisterClick();
                }}
                className="w-full py-3 border-2 border-white rounded-full bg-white text-black font-heading text-xs font-black tracking-widest uppercase transition-all shadow-lg"
              >
                Register Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;
