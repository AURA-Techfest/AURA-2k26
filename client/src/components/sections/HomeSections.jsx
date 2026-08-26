import React from "react";
import heroBg from "../../assets/HERO_SECTION_BG.png";
import websiteBg from "../../assets/WEBSITE_BG.png";
import aliahLogo from "../../assets/ALIAH_LOGO_WHITE.png";

// Reusable typographic heading matching the exact design
const GiantAHeading = ({ topText, bottomText }) => {
  return (
    <div className="flex items-center text-left font-heading text-white select-none h-[7.5rem] md:h-[10rem]">
      {/* Giant letter 'A' */}
      <span className="text-[10rem] md:text-[13rem] font-black leading-[0.68] tracking-tighter">A</span>
      {/* Container for the two stacked lines */}
      <div className="flex flex-col justify-between h-[4.2rem] md:h-[5.8rem] pl-2 md:pl-3">
        <span className="text-2xl md:text-5xl font-black tracking-widest uppercase leading-none">{topText}</span>
        <span className="text-2xl md:text-5xl font-black tracking-widest uppercase leading-none">{bottomText}</span>
      </div>
    </div>
  );
};

function HomeSections({ onRegisterClick }) {
  return (
    <div className="flex flex-col w-full pl-0 md:pl-16">
      {/* 1. HERO SECTION */}
      <section
        id="hero"
        className="h-screen w-full relative flex items-center justify-start px-8 md:px-24 overflow-hidden"
        style={{
          background: `url(${heroBg}) no-repeat center right/cover`,
        }}
      >
        {/* Left Side Overlay for dark-tint reading */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b0909] via-[#0b0909]/80 to-transparent z-10" />

        <div className="relative z-20 max-w-2xl text-left flex flex-col justify-center mt-8">
          {/* Typographic Title matching Image 1 */}
          <GiantAHeading topText="URA" bottomText="2K26" />
          
          <h2 className="font-heading text-sm md:text-lg tracking-widest text-white uppercase font-black mt-8">
            Hardware Hackathon of Aliah University
          </h2>

          {/* Vertically stacked outline pill buttons matching Image 1 */}
          <div className="flex flex-col gap-4 mt-8 w-full max-w-[240px]">
            <button
              onClick={onRegisterClick}
              className="px-8 py-3 border-2 border-white rounded-full bg-black/40 hover:bg-white hover:text-black text-white font-heading text-xs font-bold tracking-widest uppercase transition-all duration-200 text-center cursor-pointer"
            >
              Register Now
            </button>
            <button
              onClick={onRegisterClick}
              className="px-8 py-3 border-2 border-white rounded-full bg-black/40 hover:bg-white hover:text-black text-white font-heading text-xs font-bold tracking-widest uppercase transition-all duration-200 text-center cursor-pointer"
            >
              Login
            </button>
          </div>
        </div>
      </section>

      {/* 2. ABOUT THE EVENT SECTION - Normal WEBSITE_BG */}
      <section
        id="event"
        className="h-screen w-full relative flex flex-col justify-between pt-12 pb-8 px-8 md:pt-16 md:pb-12 md:px-16 lg:pt-20 lg:pb-16 lg:px-24 overflow-hidden"
      >
        <div 
          className="absolute inset-0 bg-cover bg-center pointer-events-none z-0" 
          style={{ backgroundImage: `url(${websiteBg})` }}
        />
        
        {/* Top: Title */}
        <div className="relative z-10 self-start mt-0">
          <GiantAHeading topText="BOUT" bottomText="THE EVENT" />
        </div>

        {/* Center: Empty Space (matching PDF design, no extra text) */}
        <div className="flex-grow" />

        {/* Bottom: Centered Button */}
        <div className="relative z-10 flex justify-center pb-4">
          <button
            onClick={onRegisterClick}
            className="px-10 py-3.5 border-2 border-white rounded-full bg-black/40 hover:bg-white hover:text-black text-white font-heading text-xs font-bold tracking-widest uppercase transition-all duration-200 cursor-pointer shadow-lg"
          >
            Register Now
          </button>
        </div>
      </section>

      {/* 3. ABOUT ALIAH UNIVERSITY SECTION - Reversed WEBSITE_BG (scale-x-[-1]) */}
      <section
        id="about"
        className="h-screen w-full relative flex flex-col justify-between pt-12 pb-8 px-8 md:pt-16 md:pb-12 md:px-16 lg:pt-20 lg:pb-16 lg:px-24 overflow-hidden border-t border-white/5"
      >
        <div 
          className="absolute inset-0 bg-cover bg-center pointer-events-none z-0" 
          style={{ backgroundImage: `url(${websiteBg})`, transform: "scaleX(-1) rotate(180deg)" }}
        />
        
        {/* Top: Title */}
        <div className="relative z-10 self-start mt-0">
          <GiantAHeading topText="BOUT" bottomText="ALIAH UNIVERSITY" />
        </div>

        {/* Center: Logo on the left, shifted up */}
        <div className="relative z-10 flex items-start justify-start flex-grow -mt-4 md:-mt-8">
          <div className="p-4 rounded-full bg-black/10 border border-white/5">
            <img
              src={aliahLogo}
              alt="Aliah University Logo"
              className="w-36 h-36 md:w-48 md:h-48 object-contain filter drop-shadow-[0_0_15px_rgba(255,255,255,0.08)]"
            />
          </div>
        </div>

        <div className="h-10" />
      </section>

      {/* 4. NOTIFICATIONS SECTION - Reversed WEBSITE_BG (scale-x-[-1]) */}
      <section
        id="notifications"
        className="h-screen w-full relative flex flex-col justify-start p-8 md:p-16 lg:p-24 overflow-hidden border-t border-white/5"
      >
        <div 
          className="absolute inset-0 bg-cover bg-center pointer-events-none z-0" 
          style={{ backgroundImage: `url(${websiteBg})`, transform: "scaleX(-1) rotate(180deg)" }}
        />
        
        {/* Top: Title */}
        <div className="relative z-10 self-start mt-8">
          <h2 className="font-heading text-4xl md:text-5.5xl font-black text-white tracking-widest uppercase">
            Notifications
          </h2>
        </div>
      </section>

      {/* 5. GALLERY SECTION - Reversed WEBSITE_BG (scale-x-[-1]) */}
      <section
        id="gallery"
        className="h-screen w-full relative flex flex-col justify-between p-8 md:p-16 lg:p-24 overflow-hidden border-t border-white/5"
      >
        <div 
          className="absolute inset-0 bg-cover bg-center pointer-events-none z-0" 
          style={{ backgroundImage: `url(${websiteBg})`, transform: "scaleX(-1) rotate(180deg)" }}
        />
        
        {/* Top: Title */}
        <div className="relative z-10 self-start mt-8">
          <h2 className="font-heading text-4xl md:text-5.5xl font-black text-white tracking-widest uppercase">
            Gallery
          </h2>
        </div>

        {/* Center: Coming Soon */}
        <div className="relative z-10 flex flex-col items-center justify-center flex-grow text-center">
          <h3 className="font-heading text-2xl md:text-4xl font-black text-white/90 tracking-[0.2em] uppercase select-none">
            Coming Soon
          </h3>
        </div>

        <div className="h-10" />
      </section>

      {/* 6. CONTACT US SECTION - Reversed WEBSITE_BG (scale-x-[-1]) */}
      <section
        id="contact"
        className="h-screen w-full relative flex flex-col justify-start p-8 md:p-16 lg:p-24 overflow-hidden border-t border-white/5"
      >
        <div 
          className="absolute inset-0 bg-cover bg-center pointer-events-none z-0" 
          style={{ backgroundImage: `url(${websiteBg})`, transform: "scaleX(-1) rotate(180deg)" }}
        />
        
        {/* Top: Title */}
        <div className="relative z-10 self-start mt-8">
          <h2 className="font-heading text-4xl md:text-5.5xl font-black text-white tracking-widest uppercase">
            Contact Us
          </h2>
        </div>
      </section>

      {/* 7. FOOTER SECTION - With message: footer will be here */}
      <footer className="py-16 bg-[#080606] border-t border-white/5 flex items-center justify-center text-center">
        <span className="font-heading text-xs uppercase tracking-[0.25em] text-white/30">
          footer will be here
        </span>
      </footer>
    </div>
  );
}

export default HomeSections;
