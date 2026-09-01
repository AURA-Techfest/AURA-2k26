import React from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import heroBg from "../../assets/HERO_SECTION_BG.png";
import websiteBg from "../../assets/WEBSITE_BG.png";
import aliahLogo from "../../assets/ALIAH_LOGO_WHITE.png";
import auraLogo from "../../assets/AURA_26_LOGO.png";

// Reusable typographic heading matching the exact design with fluid responsive sizing
const GiantAHeading = ({ topText, bottomText }) => {
  return (
    <div className="flex items-center text-left font-heading text-white select-none h-[4rem] sm:h-[6rem] md:h-[7.5rem] lg:h-[10rem]">
      {/* Giant letter 'A' */}
      <span className="text-[5.5rem] sm:text-[8rem] md:text-[10rem] lg:text-[13rem] font-black leading-[0.68] tracking-tighter shrink-0">A</span>
      {/* Container for the two stacked lines */}
      <div className="flex flex-col justify-between h-[2.5rem] sm:h-[3.6rem] md:h-[4.2rem] lg:h-[5.8rem] pl-2 md:pl-3 min-w-0">
        <span className="text-base sm:text-2xl md:text-4xl lg:text-5xl font-black tracking-wider md:tracking-widest uppercase leading-none whitespace-nowrap">{topText}</span>
        <span className="text-base sm:text-2xl md:text-4xl lg:text-5xl font-black tracking-wider md:tracking-widest uppercase leading-none whitespace-nowrap">{bottomText}</span>
      </div>
    </div>
  );
};

const TimelineEventCard = ({ event, progress }) => {
  const opacity = useTransform(progress, [event.t - 0.05, event.t], [0, 1]);
  const scale = useTransform(progress, [event.t - 0.05, event.t], [0.9, 1]);
  const y = useTransform(progress, [event.t - 0.05, event.t], [15, 0]);

  return (
    <motion.div
      className="absolute flex flex-col text-left justify-start max-w-[200px] select-text z-10 font-bold"
      style={{ left: `${event.x}px`, top: `${event.y}px`, opacity, scale, y }}
    >
      <span className="text-xs font-mono font-black tracking-widest text-white uppercase">// {event.stage}</span>
      <h3 className="font-heading text-lg font-black uppercase mt-1 text-white">{event.title}</h3>
      <p className={`text-white mt-1 font-bold ${event.stage === "Stage 3" ? "text-[11px] tracking-tight whitespace-nowrap" : "text-sm"}`}>
        {event.detail}
      </p>
      <span className="font-mono text-sm font-bold text-white mt-2">{event.date}</span>
    </motion.div>
  );
};

const TimelineEventDot = ({ event, progress }) => {
  const opacity = useTransform(progress, [event.t - 0.03, event.t], [0, 1]);
  const scale = useTransform(progress, [event.t - 0.03, event.t], [0.6, 1.25]);

  return (
    <>
      {/* Grey base dot */}
      <circle
        cx={event.dotX}
        cy={event.dotY}
        r="6"
        fill="#1c1919"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="3"
      />
      {/* Highlight active dot */}
      <motion.circle
        cx={event.dotX}
        cy={event.dotY}
        r="7"
        fill="white"
        stroke="#0b0909"
        strokeWidth="3"
        style={{ opacity, scale }}
        className="filter drop-shadow-[0_0_8px_rgba(255,255,255,0.85)]"
      />
    </>
  );
};

const TIMELINE_EVENTS = [
  {
    stage: "Stage 1.1",
    title: "Abstract Submission (Online)",
    detail: "Last Date of Submission",
    date: "August 31, 2026",
    t: 0.08,
    x: 100,
    y: 0,
    dotX: 100,
    dotY: 160
  },
  {
    stage: "Stage 1.2",
    title: "Abstract Acceptance Notification",
    detail: "Screening results announcement",
    date: "August 31, 2026",
    t: 0.20,
    x: 480,
    y: 0,
    dotX: 480,
    dotY: 160
  },
  {
    stage: "Stage 2.1",
    title: "Registration Opens",
    detail: "Shortlisted teams registration start",
    date: "August 31, 2026",
    t: 0.32,
    x: 860,
    y: 0,
    dotX: 860,
    dotY: 160
  },
  {
    stage: "Stage 2.2",
    title: "Registration Ends",
    detail: "Standard registration window closes",
    date: "August 31, 2026",
    t: 0.44,
    x: 860,
    y: 380,
    dotX: 860,
    dotY: 340
  },
  {
    stage: "Stage 3",
    title: "Preliminary Round (Physical Mode)",
    detail: "Live prototype demonstration and presentation",
    date: "August 31, 2026",
    t: 0.56,
    x: 480,
    y: 380,
    dotX: 480,
    dotY: 340
  },
  {
    stage: "Stage 2.3",
    title: "Registration Closes",
    detail: "Registration Kits for all registered participants",
    date: "August 31, 2026",
    t: 0.68,
    x: 100,
    y: 380,
    dotX: 100,
    dotY: 340
  },
  {
    stage: "Stage 4",
    title: "Final Round (Physical Mode)",
    detail: "Grand finale assessment",
    date: "August 31, 2026",
    t: 0.80,
    x: 100,
    y: 560,
    dotX: 100,
    dotY: 520
  },
  {
    stage: "Stage 4.1",
    title: "Participation Certificates",
    detail: "To all registered participants",
    date: "August 31, 2026",
    t: 0.88,
    x: 480,
    y: 560,
    dotX: 480,
    dotY: 520
  },
  {
    stage: "Stage 4.2",
    title: "For Top Three Teams",
    detail: "Lucrative Prizes and certificates of excellence based on ranking",
    date: "August 31, 2026",
    t: 0.96,
    x: 860,
    y: 560,
    dotX: 860,
    dotY: 520
  }
];

function HomeSections({ onRegisterClick }) {
  const timelineRef = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start center", "end center"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 25,
    restDelta: 0.001
  });

  const [scale, setScale] = React.useState(1);
  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScale(1);
      } else {
        const targetWidth = 1100;
        const availableWidth = width - 128;
        const nextScale = Math.min(1, availableWidth / targetWidth);
        setScale(nextScale);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex flex-col w-full pl-0 md:pl-16">
      {/* 1. HERO SECTION */}
      <section
        id="hero"
        className="min-h-screen w-full relative flex items-center justify-start px-4 sm:px-8 md:px-24 py-20 overflow-hidden"
      >
        {/* Background Image Container with mobile-optimized position over the robot art */}
        <div 
          className="absolute inset-0 bg-cover bg-[position:82%_center] md:bg-[position:center_right] pointer-events-none z-0" 
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        {/* Left Side Overlay for dark-tint reading */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b0909] via-[#0b0909]/75 to-transparent md:via-[#0b0909]/80 z-10 pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-20 max-w-2xl text-left flex flex-col justify-center mt-8"
        >
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
        </motion.div>
      </section>

      {/* 2. ABOUT THE EVENT SECTION - Normal WEBSITE_BG */}
      <section
        id="event"
        className="min-h-screen w-full relative flex flex-col justify-between pt-16 sm:pt-20 pb-16 px-4 sm:px-8 md:px-16 lg:px-24 overflow-hidden"
      >
        {/* Background Image Container */}
        <div 
          className="absolute inset-0 bg-cover bg-center pointer-events-none z-0" 
          style={{ backgroundImage: `url(${websiteBg})` }}
        />
        
        {/* Left Side Overlay gradient for matching opacity */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b0909] via-[#0b0909]/80 to-transparent z-10" />

        {/* Top: Title */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 1.0, ease: "easeOut" }}
          className="relative z-20 self-start mt-0"
        >
          <GiantAHeading topText="BOUT" bottomText="THE EVENT" />
        </motion.div>

        {/* Center content: Text description and details in newspaper columns */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-100px" }}
          transition={{ duration: 1.0, ease: "easeOut", delay: 0.15 }}
          className="relative z-20 text-white font-body text-base md:text-lg lg:text-[20px] font-bold leading-relaxed max-w-5xl mt-8 flex-grow flex flex-col justify-center select-text"
        >
          <div className="columns-1 md:columns-2 gap-10 md:gap-16 w-full">
            <p className="mb-6">
              AURA is Aliah University’s flagship technical festival that facilitates innovation, creativity and collaboration with students and research scholars. Started in the year 2024, AURA has turn out to be a hub for technical excellence, inspiring young minds to push the boundaries in the field of hardware innovations.
            </p>
            <p className="mb-6">
              Our Mission is to endow with a platform for showcasing technical prowess, promoting knowledge and encouraging the future leaders in technology.
            </p>
            
            <div className="mt-4 select-none">
              <p className="uppercase tracking-[0.2em] text-white text-xs mb-3 font-mono font-black">// Venue & Dates</p>
              <p className="mb-2"><strong className="text-white">Venue [In-Person]:</strong> Aliah University, Newtown Campus</p>
              <p className=""><strong className="text-white">Dates:</strong> 25th & 27th February, 2025</p>
            </div>
          </div>
        </motion.div>

        {/* Bottom: Centered Button */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: false }}
          transition={{ duration: 1.0, ease: "easeOut", delay: 0.3 }}
          className="relative z-20 flex justify-center pt-8 pb-4"
        >
          <button
            onClick={onRegisterClick}
            className="px-10 py-3.5 border-2 border-white rounded-full bg-black/40 hover:bg-white hover:text-black text-white font-heading text-xs font-bold tracking-widest uppercase transition-all duration-200 cursor-pointer shadow-lg"
          >
            Register Now
          </button>
        </motion.div>
      </section>

      {/* 3. ABOUT ALIAH UNIVERSITY SECTION - Reversed WEBSITE_BG (scale-x-[-1]) */}
      <section
        id="about"
        className="min-h-screen w-full relative flex flex-col justify-start py-16 sm:py-20 px-4 sm:px-8 md:px-16 lg:px-24 overflow-hidden border-t border-white/5"
      >
        <div 
          className="absolute inset-0 bg-cover bg-center pointer-events-none z-0" 
          style={{ backgroundImage: `url(${websiteBg})`, transform: "scaleX(-1) rotate(180deg)" }}
        />

        {/* Left Side Overlay gradient for matching opacity */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b0909] via-[#0b0909]/80 to-transparent z-10" />
        
        {/* Top: Giant A Heading */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 1.0, ease: "easeOut" }}
          className="relative z-20 self-start mt-0"
        >
          <GiantAHeading topText="BOUT" bottomText="ALIAH UNIVERSITY" />
        </motion.div>

        {/* Center: University Description Text and Logo Grid (Larger Visibility) */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-100px" }}
          transition={{ duration: 1.0, ease: "easeOut", delay: 0.15 }}
          className="relative z-20 text-white font-body text-base md:text-lg lg:text-[20px] font-bold leading-relaxed max-w-6xl mt-8 flex-grow flex flex-col justify-center select-text w-full"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-16 items-center w-full">
            {/* Left description paragraphs (8 columns on lg) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <p>
                Aliah University started its glorious journey from the academic session 2008-09 with great potential and immense visual. It is found that this university is harmonizing our tradition and have emerged as a unique institution for higher education and in research field.
              </p>
              <p>
                As per the Parliament Act, 2007, Section 3 (3), it has conferred the status of a minority educational institution. It is an autonomous body under the Department of Minority Affairs and Madrasah Education, Government of West Bengal. The students belonging to any race, creed, caste or class, this University has played a crucial and leading role in the advancement of higher education in both socially and economically.
              </p>
            </div>
            
            {/* Right Logo (4 columns on lg) */}
            <div className="lg:col-span-4 flex justify-center lg:justify-end items-center select-none">
              <img
                src={aliahLogo}
                alt="Aliah University Seal Logo"
                className="w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 object-contain"
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* 4. TIMELINE SECTION - Reversed WEBSITE_BG */}
      <section
        id="notifications"
        ref={timelineRef}
        className="min-h-[135vh] w-full relative flex flex-col justify-start py-16 sm:py-20 px-4 sm:px-8 md:px-16 lg:px-24 overflow-hidden border-t border-white/5"
      >
        <div 
          className="absolute inset-0 bg-cover bg-center pointer-events-none z-0" 
          style={{ backgroundImage: `url(${websiteBg})` }}
        />

        {/* Left Side Overlay gradient for matching opacity */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b0909] via-[#0b0909]/80 to-transparent z-10" />
        
        {/* Top: Title */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 1.0, ease: "easeOut" }}
          className="relative z-20 self-start mt-4 mb-2"
        >
          <h2 className="font-heading text-4xl md:text-5.5xl font-black text-white tracking-widest uppercase">
            Timeline
          </h2>
        </motion.div>

        {/* Responsive Snake Timeline Layout (Pure Typography, No Boxes, Begins strictly below title) */}
        <div 
          className="relative z-20 w-full max-w-6xl mx-auto font-body text-white flex-grow flex flex-col justify-start mt-2 md:mt-4 pt-8 md:pt-12"
          style={{ minHeight: typeof window !== 'undefined' && window.innerWidth >= 768 ? `${(725 * scale) + 48}px` : 'auto' }}
        >
          
          {/* Mobile Animated Line (Vertical) */}
          <div className="absolute top-0 bottom-0 left-6 z-0 pointer-events-none block md:hidden">
            <svg className="h-full w-2" preserveAspectRatio="none">
              <line
                x1="4"
                y1="0"
                x2="4"
                y2="100%"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="4"
                strokeDasharray="6 6"
              />
              <motion.line
                x1="4"
                y1="0"
                x2="4"
                y2="100%"
                stroke="white"
                strokeWidth="4"
                strokeDasharray="6 6"
                style={{ pathLength: smoothProgress }}
              />
            </svg>
          </div>

          {/* Desktop Absolute Canvas scaling layout */}
          <div 
            className="relative hidden md:block origin-top-left overflow-visible"
            style={{ transform: `scale(${scale})`, width: '1100px', height: '725px' }}
          >
            {/* Timeline Winding Gaming Path SVG (Desktop) inside scaled canvas */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 1100 725" preserveAspectRatio="none">
              {/* Base grey line */}
              <path
                d="M 100,160 L 860,160 C 940,160 1020,200 1020,250 C 1020,300 940,340 860,340 L 100,340 C 40,340 20,380 20,430 C 20,480 40,520 100,520 L 980,520"
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="4"
                strokeDasharray="6 6"
              />
              {/* Animated white drawing path */}
              <motion.path
                d="M 100,160 L 860,160 C 940,160 1020,200 1020,250 C 1020,300 940,340 860,340 L 100,340 C 40,340 20,380 20,430 C 20,480 40,520 100,520 L 980,520"
                fill="none"
                stroke="white"
                strokeWidth="4"
                strokeDasharray="6 6"
                style={{ pathLength: smoothProgress }}
              />

              {/* Dynamic node dots highlighting sequentially */}
              {TIMELINE_EVENTS.map((event, idx) => (
                <TimelineEventDot key={`dot-${idx}`} event={event} progress={smoothProgress} />
              ))}
            </svg>

            {/* Dynamic cards revealing sequentially driven by path position progress */}
            {TIMELINE_EVENTS.map((event, idx) => (
              <TimelineEventCard key={`card-${idx}`} event={event} progress={smoothProgress} />
            ))}
          </div>

          {/* Mobile Linear Layout */}
          <div className="grid grid-cols-1 gap-12 relative z-10 block md:hidden">
            {TIMELINE_EVENTS.map((event, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, margin: "-80px" }}
                transition={{ duration: 1.0, ease: "easeOut", delay: idx * 0.12 }}
                className="flex flex-col text-left justify-start pl-12 relative z-10 font-bold"
              >
                <span className="text-xs font-mono font-black tracking-widest text-white uppercase">// {event.stage}</span>
                <h3 className="font-heading text-xl font-black uppercase mt-1 text-white">{event.title}</h3>
                <p className="text-sm text-white mt-1 font-bold">{event.detail}</p>
                <span className="font-mono text-sm font-bold text-white mt-2">{event.date}</span>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* 5. GALLERY SECTION - Reversed WEBSITE_BG */}
      <section
        id="gallery"
        className="min-h-[50vh] md:min-h-screen w-full relative flex flex-col justify-between py-12 sm:py-20 px-4 sm:px-8 md:px-16 lg:px-24 overflow-hidden border-t border-white/5"
      >
        <div 
          className="absolute inset-0 bg-cover bg-center pointer-events-none z-0" 
          style={{ backgroundImage: `url(${websiteBg})`, transform: "scaleX(-1) rotate(180deg)" }}
        />

        {/* Left Side Overlay gradient for matching opacity */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b0909] via-[#0b0909]/80 to-transparent z-10" />
        
        {/* Top: Title */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 1.0, ease: "easeOut" }}
          className="relative z-20 self-start mt-2 sm:mt-4 md:mt-8"
        >
          <h2 className="font-heading text-4xl md:text-5.5xl font-black text-white tracking-widest uppercase">
            Gallery
          </h2>
        </motion.div>

        {/* Center: Coming Soon */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: false }}
          transition={{ duration: 1.0, ease: "easeOut", delay: 0.1 }}
          className="relative z-20 flex flex-col items-center justify-center flex-grow text-center py-12"
        >
          <h3 className="font-heading text-2xl md:text-4xl font-black text-white/90 tracking-[0.2em] uppercase select-none animate-pulse">
            Coming Soon
          </h3>
        </motion.div>

        <div className="h-4" />
      </section>

      {/* 6. CONTACT US SECTION - Reversed WEBSITE_BG */}
      <section
        id="contact"
        className="min-h-[50vh] md:min-h-screen w-full relative flex flex-col justify-start py-12 sm:py-20 px-4 sm:px-8 md:px-16 lg:px-24 overflow-hidden border-t border-white/5"
      >
        <div 
          className="absolute inset-0 bg-cover bg-center pointer-events-none z-0" 
          style={{ backgroundImage: `url(${websiteBg})` }}
        />

        {/* Left Side Overlay gradient for matching opacity */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b0909] via-[#0b0909]/80 to-transparent z-10" />
        
        {/* Top: Title */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 1.0, ease: "easeOut" }}
          className="relative z-20 self-start mt-2 sm:mt-4 md:mt-8"
        >
          <h2 className="font-heading text-4xl md:text-5.5xl font-black text-white tracking-widest uppercase">
            Contact Us
          </h2>
        </motion.div>
      </section>

      {/* 7. FOOTER SECTION */}
      <footer className="py-12 sm:py-20 relative overflow-hidden border-t border-white/10 text-white font-body">
        {/* Background Image Container */}
        <div 
          className="absolute inset-0 bg-cover bg-center pointer-events-none z-0" 
          style={{ backgroundImage: `url(${websiteBg})`, transform: "scaleX(-1) rotate(180deg)" }}
        />
        {/* Left Side Overlay gradient for matching opacity */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b0909] via-[#0b0909]/80 to-transparent z-10" />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-8 md:px-16 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 items-center relative z-20">
          
          {/* Left Column: AURA Logo (Increased size with entry animation and hover tilt effect) */}
          <div className="flex flex-col items-start gap-4 pl-0 md:pl-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, rotate: -2 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              whileHover={{ scale: 1.05, rotate: 1 }}
              className="relative cursor-pointer select-none"
            >
              <img
                src={auraLogo}
                alt="AURA 2K26 Logo"
                className="h-36 md:h-52 lg:h-56 object-contain filter drop-shadow-[0_0_20px_rgba(255,255,255,0.06)]"
              />
            </motion.div>
            <div className="mt-2 text-white/70 space-y-2 text-sm leading-relaxed max-w-sm">
              <p className="font-heading text-xs font-bold uppercase tracking-wider text-white">
                AURA 2K26 • Annual Technical Festival
              </p>
              <p>
                Aliah University, Newtown Campus, Kolkata. Discover, Design, and Disrupt the future of hardware technologies.
              </p>
              <p className="text-xs text-white/30 pt-2 font-mono">
                © {new Date().getFullYear()} AURA Committee. All rights reserved.
              </p>
            </div>
          </div>

          {/* Right Column: Google Maps Embed and university location info */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center select-none">
              <h3 className="font-heading text-xs font-bold uppercase tracking-widest text-white/60">
                // VENUE MAP LOCATION
              </h3>
              <a
                href="https://maps.app.goo.gl/5Wo4F19PLej4Fw9f7"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] uppercase font-mono tracking-widest text-white hover:underline"
              >
                Open Google Maps ↗
              </a>
            </div>
            
            {/* Embedded map iframe (Using direct output embed query to ensure standard reliable loading) */}
            <div className="w-full h-48 rounded overflow-hidden border border-white/10 relative z-30">
              <iframe
                title="Aliah University Newtown Campus Map"
                src="https://maps.google.com/maps?q=Aliah%20University%20New%20Town%20Campus&t=&z=15&ie=UTF8&iwloc=&output=embed"
                className="w-full h-full border-0 grayscale invert opacity-75 hover:opacity-100 transition-all duration-300"
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}

export default HomeSections;
