import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import auraLogo from "../../assets/AURA_26_LOGO.png";

function Navbar({ onRegisterClick }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "The Event", target: "event" },
    { label: "Timeline", target: "notifications" },
    { label: "About Us", target: "about" },
    { label: "Gallery", target: "gallery" },
    { label: "Contact Us", target: "contact" }
  ];

  const handleScroll = (id) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <nav className="navbar-glass fixed top-0 left-0 md:left-16 right-0 h-16 md:h-18 px-4 sm:px-6 md:px-12 flex items-center justify-between z-50 border-b border-white/5 backdrop-blur-md">
        {/* Mobile Header: Left Brand Logo */}
        <div className="flex items-center gap-3 md:hidden">
          <img
            src={auraLogo}
            alt="AURA 2K26"
            onClick={() => handleScroll("hero")}
            className="w-9 h-auto object-contain cursor-pointer select-none filter brightness-200"
          />
        </div>

        {/* Desktop Spacer to balance centering */}
        <div className="w-36 hidden lg:block" />

        {/* Centered Navigation Links (Desktop) */}
        <div className="hidden md:flex items-center gap-4 md:gap-6 lg:gap-8 flex-grow justify-center">
          {navItems.map((item) => (
            <button
              key={item.target}
              onClick={() => handleScroll(item.target)}
              className="font-heading text-[10px] md:text-xs uppercase tracking-widest text-white/70 hover:text-white transition-colors duration-200 cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Right Action Container (Desktop & Mobile) */}
        <div className="flex items-center gap-3 w-auto lg:w-36 justify-end shrink-0">
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onRegisterClick();
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
                  key={item.target}
                  onClick={() => handleScroll(item.target)}
                  className="text-left font-heading text-sm uppercase tracking-widest text-white/80 hover:text-white py-2 border-b border-white/5 transition-colors"
                >
                  // {item.label}
                </button>
              ))}
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onRegisterClick();
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
