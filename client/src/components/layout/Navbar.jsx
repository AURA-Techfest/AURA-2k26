import React from "react";

function Navbar() {
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
    <nav className="navbar-glass fixed top-0 left-16 right-0 h-18 px-6 md:px-12 flex items-center justify-center z-50">
      {/* Centered Navigation Links matching the screenshot */}
      <div className="flex items-center gap-6 md:gap-12">
        {navItems.map((item) => (
          <button
            key={item.target}
            onClick={() => handleScroll(item.target)}
            className="font-heading text-xs md:text-sm uppercase tracking-widest text-white/70 hover:text-white transition-colors duration-200 cursor-pointer"
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

export default Navbar;
