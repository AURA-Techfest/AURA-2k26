import React from "react";

function Navbar({ onRegisterClick }) {
  const navItems = [
    { label: "The Event", target: "event" },
    { label: "Notifications", target: "notifications" },
    { label: "About Us", target: "about" },
    { label: "Gallery", target: "gallery" },
    { label: "Contact Us", target: "contact" }
  ];

  const handleScroll = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="navbar-glass fixed top-0 left-16 right-0 h-18 px-4 md:px-12 flex items-center justify-between z-50">
      {/* Spacer to balance the layout for desktop centering */}
      <div className="w-36 hidden lg:block" />

      {/* Centered Navigation Links */}
      <div className="flex items-center gap-4 md:gap-6 lg:gap-8 flex-grow justify-center">
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

      {/* Right side CTA Button (remains fixed on scroll) */}
      <div className="w-auto lg:w-36 flex justify-end shrink-0">
        <button
          onClick={onRegisterClick}
          className="px-4.5 py-2 border-2 border-white rounded-full bg-black/40 hover:bg-white hover:text-black text-white font-heading text-[9px] font-black tracking-widest uppercase transition-all duration-200 cursor-pointer"
        >
          Register
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
