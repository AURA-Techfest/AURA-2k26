import React from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import heroBg from "../../assets/HERO_SECTION_BG.png";
import websiteBg from "../../assets/WEBSITE_BG.png";
import aliahLogo from "../../assets/ALIAH_LOGO_WHITE.png";
import auraLogo from "../../assets/AURA_26_LOGO.png";
import crewPlaceholder from "../../assets/crew_placeholder.png";

// Reusable typographic heading matching the exact design with fluid responsive sizing using CSS clamp()
const GiantAHeading = ({ topText, bottomText }) => {
  return (
    <div 
      className="flex items-center text-left font-heading text-white select-none"
      style={{ height: 'clamp(3.5rem, 9.5vw, 8.5rem)' }}
    >
      {/* Giant letter 'A' */}
      <span 
        className="font-black leading-[0.68] tracking-tighter shrink-0"
        style={{ fontSize: 'clamp(4.5rem, 13vw, 12.5rem)' }}
      >
        A
      </span>
      {/* Container for the two stacked lines */}
      <div 
        className="flex flex-col justify-between pl-2 md:pl-3 min-w-0"
        style={{ height: 'clamp(2.5rem, 6vw, 5.5rem)' }}
      >
        <span 
          className="font-black tracking-wider md:tracking-widest uppercase leading-none whitespace-nowrap"
          style={{ fontSize: 'clamp(1.1rem, 3.2vw, 3.2rem)' }}
        >
          {topText}
        </span>
        <span 
          className="font-black tracking-wider md:tracking-widest uppercase leading-none whitespace-nowrap"
          style={{ fontSize: 'clamp(1.1rem, 3.2vw, 3.2rem)' }}
        >
          {bottomText}
        </span>
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
      className="absolute flex flex-col text-left justify-start w-[240px] select-text z-10 font-bold"
      style={{ left: `${event.x}px`, top: `${event.y}px`, opacity, scale, y }}
    >
      <span className="text-xs sm:text-sm font-mono font-black tracking-widest text-white/80 uppercase">
        // {event.stage}
      </span>
      <h3 className="font-heading text-base sm:text-lg font-black uppercase mt-1 text-white leading-tight drop-shadow-md">
        {event.title}
      </h3>
      {event.date && (
        <span className="font-mono text-sm sm:text-base font-black text-white mt-1.5 drop-shadow">
          {event.date}
        </span>
      )}
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
        r="7"
        fill="#1c1919"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="3"
      />
      {/* Highlight active white dot */}
      <motion.circle
        cx={event.dotX}
        cy={event.dotY}
        r="8"
        fill="white"
        stroke="#0b0909"
        strokeWidth="3"
        style={{ opacity, scale }}
        className="filter drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]"
      />
    </>
  );
};

const TIMELINE_EVENTS = [
  {
    stage: "Stage 1.1",
    title: "Abstraction Submission Start",
    date: "29 Aug, 2026",
    t: 0.05,
    x: 140,
    y: 0,
    dotX: 180,
    dotY: 160
  },
  {
    stage: "Stage 1.2",
    title: "Abstraction Submission End",
    date: "30 Sep, 2026",
    t: 0.20,
    x: 470,
    y: 0,
    dotX: 510,
    dotY: 160
  },
  {
    stage: "Stage 1.3",
    title: "Abstract Acceptance Notification",
    date: "5 Oct, 2026",
    t: 0.35,
    x: 820,
    y: 0,
    dotX: 860,
    dotY: 160
  },
  {
    stage: "Stage 2.1",
    title: "Login to Pay Window Opens",
    date: "N/A",
    t: 0.50,
    x: 640,
    y: 380,
    dotX: 680,
    dotY: 340
  },
  {
    stage: "Stage 2.2",
    title: "Login to Pay Window Ends",
    date: "N/A",
    t: 0.65,
    x: 260,
    y: 380,
    dotX: 300,
    dotY: 340
  },
  {
    stage: "Stage 3",
    title: "Preliminary Round",
    date: "19 Nov, 2026",
    t: 0.80,
    x: 260,
    y: 560,
    dotX: 300,
    dotY: 520
  },
  {
    stage: "Stage 4",
    title: "Final Round",
    date: "20 Nov, 2026",
    t: 0.95,
    x: 640,
    y: 560,
    dotX: 680,
    dotY: 520
  }
];

function HomeSections({ onRegisterClick }) {
  const navigate = useNavigate();
  const timelineRef = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start 70%", "end 80%"]
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
        {/* Background Image Container */}
        <div 
          className="absolute inset-0 bg-cover bg-[position:74%_center] md:bg-[position:center_right] pointer-events-none z-0" 
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
          
          <h2 
            className="font-heading tracking-widest text-white uppercase font-black mt-8"
            style={{ fontSize: 'clamp(0.85rem, 1.8vw, 1.25rem)' }}
          >
            Hardware Hackathon of Aliah University
          </h2>

          {/* Vertically stacked outline pill buttons */}
          <div className="flex flex-col gap-4 mt-8 w-full max-w-[240px]">
            <button
              onClick={onRegisterClick}
              className="px-8 py-3 border-2 border-white rounded-full bg-black/40 hover:bg-white hover:text-black text-white font-heading text-xs font-bold tracking-widest uppercase transition-all duration-200 text-center cursor-pointer shadow-lg"
            >
              Register Now
            </button>
            <button
              type="button"
              onClick={() => alert("AURA 2K26 Official Event Brochure will be available for download soon!")}
              className="px-8 py-3 border-2 border-white rounded-full bg-black/40 hover:bg-white hover:text-black text-white font-heading text-xs font-bold tracking-widest uppercase transition-all duration-200 text-center cursor-pointer shadow-lg"
            >
              Download Brochure
            </button>
          </div>
        </motion.div>
      </section>

      {/* 2. ABOUT THE EVENT SECTION */}
      <section
        id="event"
        className="min-h-screen w-full relative flex flex-col justify-between pt-16 sm:pt-20 pb-16 px-4 sm:px-8 md:px-16 lg:px-24 overflow-hidden"
      >
        <div 
          className="absolute inset-0 bg-cover bg-center pointer-events-none z-0" 
          style={{ backgroundImage: `url(${websiteBg})` }}
        />
        
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

        {/* Center content: Text description in columns with clamp() typography */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-100px" }}
          transition={{ duration: 1.0, ease: "easeOut", delay: 0.15 }}
          className="relative z-20 text-white font-body font-bold max-w-5xl mt-8 flex-grow flex flex-col justify-center select-text"
          style={{ fontSize: 'clamp(0.95rem, 1.4vw, 1.25rem)', lineHeight: 'clamp(1.6rem, 2.2vw, 2.2rem)' }}
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
              <p className=""><strong className="text-white">Dates:</strong> 19th & 20th November, 2026</p>
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

      {/* 3. ABOUT ALIAH UNIVERSITY SECTION */}
      <section
        id="about"
        className="min-h-screen w-full relative flex flex-col justify-start py-16 sm:py-20 px-4 sm:px-8 md:px-16 lg:px-24 overflow-hidden border-t border-white/5"
      >
        <div 
          className="absolute inset-0 bg-cover bg-center pointer-events-none z-0" 
          style={{ backgroundImage: `url(${websiteBg})`, transform: "scaleX(-1) rotate(180deg)" }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#0b0909] via-[#0b0909]/80 to-transparent z-10" />
        
        {/* Top: Giant A Heading & Borderless Logo with Key University Highlights */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 1.0, ease: "easeOut" }}
          className="relative z-20 self-start mt-0 flex flex-col items-start gap-4 w-full"
        >
          <GiantAHeading topText="BOUT" bottomText="ALIAH UNIVERSITY" />

          {/* Header Content Row: Borderless Logo on Left + Key University Highlights on Right */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-center w-full max-w-6xl mt-2 select-none">
            {/* Borderless Logo directly under heading */}
            <div className="md:col-span-4 lg:col-span-3 flex justify-start items-center">
              <img
                src={aliahLogo}
                alt="Aliah University Official Seal Logo"
                style={{ width: 'clamp(8.5rem, 16vw, 14rem)', height: 'clamp(8.5rem, 16vw, 14rem)' }}
                className="object-contain filter drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]"
              />
            </div>

            {/* University Quick Facts / Legacy Highlights filling space to the right of logo */}
            <div className="md:col-span-8 lg:col-span-9 flex flex-col justify-center gap-2.5 text-left border-l-0 md:border-l border-white/20 pl-0 md:pl-8">
              <div className="flex flex-wrap items-center gap-2.5 font-mono text-[11px] md:text-xs font-bold text-white/80 uppercase">
                <span className="bg-white/10 px-3 py-1 rounded-full text-white border border-white/20">
                  Heritage Est. 1780 • University Status 2008
                </span>
                <span className="bg-white/10 px-3 py-1 rounded-full text-white border border-white/20">
                  State University • Govt. of West Bengal
                </span>
              </div>
              <h3 className="font-heading text-sm md:text-base font-bold text-white uppercase tracking-wider mt-1">
                240+ Years of Academic Heritage & Technological Excellence
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs md:text-sm font-body text-white/80 font-semibold pt-1">
                <div>• <strong className="text-white">Main Hub:</strong> New Town Campus (Engineering & Science)</div>
                <div>• <strong className="text-white">City Campuses:</strong> Park Circus & Taltala</div>
                <div>• <strong className="text-white">Departments:</strong> CSE, ECE, Civil, ME, EE, Sciences</div>
                <div>• <strong className="text-white">Recognition:</strong> Minority State Univ (Act XXVII, 2007)</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Center: University Description Text */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-100px" }}
          transition={{ duration: 1.0, ease: "easeOut", delay: 0.15 }}
          className="relative z-20 text-white font-body font-bold max-w-5xl mt-6 flex-grow flex flex-col justify-start select-text w-full text-left"
          style={{ fontSize: 'clamp(0.95rem, 1.4vw, 1.25rem)', lineHeight: 'clamp(1.6rem, 2.2vw, 2.2rem)' }}
        >
          <div className="columns-1 md:columns-2 gap-10 md:gap-16 w-full">
            <p className="mb-6">
              Aliah University started its glorious journey from the academic session 2008-09 with great potential and immense visual. It is found that this university is harmonizing our tradition and have emerged as a unique institution for higher education and in research field.
            </p>
            <p className="mb-6">
              As per the Parliament Act, 2007, Section 3 (3), it has conferred the status of a minority educational institution. It is an autonomous body under the Department of Minority Affairs and Madrasah Education, Government of West Bengal. The students belonging to any race, creed, caste or class, this University has played a crucial and leading role in the advancement of higher education in both socially and economically.
            </p>
          </div>
        </motion.div>
      </section>

      {/* 4. TIMELINE SECTION - Reversed WEBSITE_BG */}
      <section
        id="notifications"
        ref={timelineRef}
        className="min-h-screen w-full relative flex flex-col justify-start py-12 sm:py-16 px-4 sm:px-8 md:px-16 lg:px-24 overflow-hidden border-t border-white/5"
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
          className="relative z-20 self-start mt-4 mb-4"
        >
          <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-widest uppercase drop-shadow-xl">
            TIMELINE
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
                d="M 150,160 L 900,160 C 970,160 1020,205 1020,250 C 1020,295 970,340 900,340 L 150,340 C 80,340 30,385 30,430 C 30,475 80,520 150,520 L 900,520"
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="4"
                strokeDasharray="6 6"
              />
              {/* Animated white drawing path */}
              <motion.path
                d="M 150,160 L 900,160 C 970,160 1020,205 1020,250 C 1020,295 970,340 900,340 L 150,340 C 80,340 30,385 30,430 C 30,475 80,520 150,520 L 900,520"
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
          <div className="grid grid-cols-1 gap-10 relative z-10 block md:hidden">
            {TIMELINE_EVENTS.map((event, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, margin: "-80px" }}
                transition={{ duration: 0.8, ease: "easeOut", delay: idx * 0.1 }}
                className="flex flex-col text-left justify-start pl-12 relative z-10 font-bold"
              >
                <span className="text-xs font-mono font-black tracking-widest text-white/80 uppercase">// {event.stage}</span>
                <h3 className="font-heading text-lg sm:text-xl font-black uppercase mt-1 text-white">{event.title}</h3>
                {event.date && <span className="font-mono text-sm sm:text-base font-black text-white mt-1.5">{event.date}</span>}
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* 5. GALLERY SECTION - 3D YEAR FLASH CARDS MATCHING MOCKUP */}
      <section
        id="gallery"
        className="min-h-[50vh] md:min-h-screen w-full relative flex flex-col justify-between py-12 sm:py-20 px-4 sm:px-8 md:px-16 lg:px-24 overflow-hidden border-t border-white/5"
      >
        <div 
          className="absolute inset-0 bg-cover bg-center pointer-events-none z-0" 
          style={{ backgroundImage: `url(${websiteBg})`, transform: "scaleX(-1) rotate(180deg)" }}
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b0909] via-[#0b0909]/80 to-transparent z-10" />
        
        {/* Title */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-40px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-20 self-start mt-2 sm:mt-4 md:mt-8 mb-10"
        >
          <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-widest uppercase drop-shadow-xl">
            GALLERY
          </h2>
        </motion.div>

        {/* 3D Year Flash Cards Container */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-50px" }}
          transition={{ duration: 0.8 }}
          className="relative z-20 w-full max-w-5xl mx-auto my-auto py-8"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 w-full">
            {["2026", "2025", "2024"].map((year, idx) => (
              <motion.div
                key={year}
                initial={{ opacity: 0, rotateY: -70, scale: 0.85, y: 40 }}
                whileInView={{ opacity: 1, rotateY: 0, scale: 1, y: 0 }}
                viewport={{ once: false, margin: "-40px" }}
                transition={{
                  duration: 0.7,
                  delay: idx * 0.15,
                  type: "spring",
                  stiffness: 180,
                  damping: 18
                }}
                whileHover={{
                  scale: 1.06,
                  rotateY: 6,
                  rotateX: -4,
                  translateY: -8,
                  transition: { duration: 0.25 }
                }}
                onClick={() => navigate(`/gallery/${year}`)}
                className="group relative bg-white/95 rounded-2xl p-4 sm:p-5 border-4 border-white shadow-[0_15px_35px_rgba(0,0,0,0.6)] hover:shadow-[0_25px_50px_rgba(0,0,0,0.8)] transition-all duration-300 flex flex-col items-center justify-center cursor-pointer transform-gpu overflow-hidden text-slate-900"
                style={{ perspective: 1000 }}
              >
                {/* Shimmer light beam effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none z-10" />

                {/* Card Image Box */}
                <div className="w-full aspect-[4/3] rounded-xl overflow-hidden mb-4 bg-slate-100 border border-slate-200 shadow-inner">
                  <img
                    src={crewPlaceholder}
                    alt={`AURA ${year}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Year Label */}
                <h3 className="font-heading font-black text-2xl sm:text-3xl text-slate-700 uppercase tracking-widest">
                  {year}
                </h3>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="h-4" />
      </section>

      {/* 6. CONNECT WITH US SECTION */}
      <section
        id="contact"
        className="min-h-[50vh] md:min-h-screen w-full relative flex flex-col justify-between py-12 sm:py-20 px-4 sm:px-8 md:px-16 lg:px-24 overflow-hidden border-t border-white/5"
      >
        <div 
          className="absolute inset-0 bg-cover bg-center pointer-events-none z-0" 
          style={{ backgroundImage: `url(${websiteBg})` }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#0b0909] via-[#0b0909]/80 to-transparent z-10" />
        
        {/* Title */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-40px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-20 self-start mt-2 sm:mt-4 md:mt-8 mb-12"
        >
          <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-widest uppercase drop-shadow-xl">
            CONNECT WITH US
          </h2>
        </motion.div>

        {/* 2-Column Contact Links */}
        <div className="relative z-20 w-full max-w-5xl mx-auto my-auto py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 text-left">
            
            {/* Left Column: Emails */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, margin: "-50px" }}
              transition={{ duration: 0.7 }}
              className="space-y-8"
            >
              {/* Email 1 */}
              <motion.a
                whileHover={{ x: 6, scale: 1.02 }}
                transition={{ duration: 0.2 }}
                href="mailto:aura@aliah.ac.in"
                className="flex items-center gap-5 text-white hover:text-cyan-300 transition-colors group cursor-pointer"
              >
                <div className="w-14 h-12 sm:w-16 sm:h-14 border-2 border-white rounded-2xl flex items-center justify-center bg-black/40 group-hover:border-cyan-300 group-hover:bg-cyan-950/40 transition-all shrink-0 shadow-lg">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white group-hover:text-cyan-300 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <span className="font-body font-bold text-lg sm:text-xl md:text-2xl tracking-wide break-all">
                  aura@aliah.ac.in
                </span>
              </motion.a>

              {/* Email 2 */}
              <motion.a
                whileHover={{ x: 6, scale: 1.02 }}
                transition={{ duration: 0.2 }}
                href="mailto:aura.technical@aliah.ac.in"
                className="flex items-center gap-5 text-white hover:text-cyan-300 transition-colors group cursor-pointer"
              >
                <div className="w-14 h-12 sm:w-16 sm:h-14 border-2 border-white rounded-2xl flex items-center justify-center bg-black/40 group-hover:border-cyan-300 group-hover:bg-cyan-950/40 transition-all shrink-0 shadow-lg">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white group-hover:text-cyan-300 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <span className="font-body font-bold text-lg sm:text-xl md:text-2xl tracking-wide break-all">
                  aura.technical@aliah.ac.in
                </span>
              </motion.a>
            </motion.div>

            {/* Right Column: Social Links */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, margin: "-50px" }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="space-y-8"
            >
              {/* LinkedIn */}
              <motion.a
                whileHover={{ x: 6, scale: 1.02 }}
                transition={{ duration: 0.2 }}
                href="https://www.linkedin.com/search/results/all/?keywords=Aliah%20university%27s%20research%20aspirations"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-5 text-white hover:text-cyan-300 transition-colors group cursor-pointer"
              >
                <div className="w-14 h-12 sm:w-16 sm:h-14 border-2 border-white rounded-2xl flex items-center justify-center bg-black/40 group-hover:border-cyan-300 group-hover:bg-cyan-950/40 transition-all shrink-0 shadow-lg">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white group-hover:text-cyan-300 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.7a1.63 1.63 0 1 0 0 3.26 1.63 1.63 0 0 0 0-3.26Z" />
                  </svg>
                </div>
                <span className="font-body font-bold text-lg sm:text-xl md:text-2xl tracking-wide">
                  Aliah university's research aspirations
                </span>
              </motion.a>

              {/* Facebook */}
              <motion.a
                whileHover={{ x: 6, scale: 1.02 }}
                transition={{ duration: 0.2 }}
                href="https://www.facebook.com/search/top?q=Aliah%20university%27s%20research%20aspirations"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-5 text-white hover:text-cyan-300 transition-colors group cursor-pointer"
              >
                <div className="w-14 h-12 sm:w-16 sm:h-14 border-2 border-white rounded-2xl flex items-center justify-center bg-black/40 group-hover:border-cyan-300 group-hover:bg-cyan-950/40 transition-all shrink-0 shadow-lg">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white group-hover:text-cyan-300 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H7.5v-3H10V9.5C10 7.01 11.49 5.6 13.78 5.6c1.1 0 2.25.2 2.25.2v2.47h-1.27c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 3h-2.33v6.8c4.56-.93 8-4.96 8-9.8z" />
                  </svg>
                </div>
                <span className="font-body font-bold text-lg sm:text-xl md:text-2xl tracking-wide">
                  Aliah university's research aspirations
                </span>
              </motion.a>
            </motion.div>

          </div>
        </div>

        <div className="h-4" />
      </section>

      {/* 7. FOOTER SECTION (STATIC BG, ANIMATED CONTENT COLUMNS) */}
      <footer 
        className="py-12 sm:py-16 relative overflow-hidden border-t border-white/10 text-white font-body"
      >
        <div 
          className="absolute inset-0 bg-cover bg-center pointer-events-none z-0" 
          style={{ backgroundImage: `url(${websiteBg})`, transform: "scaleX(-1) rotate(180deg)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b0909] via-[#0b0909]/80 to-transparent z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6 items-start relative z-20 text-left">
          
          {/* Column 1 (Far Left): AURA Logo & Tagline */}
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="flex flex-col items-start gap-3"
          >
            <motion.div
              whileHover={{ scale: 1.05, rotate: 1 }}
              onClick={() => {
                const el = document.getElementById("hero");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="cursor-pointer select-none"
            >
              <img
                src={auraLogo}
                alt="AURA 2K26 Logo"
                className="h-24 sm:h-28 md:h-32 object-contain filter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
              />
            </motion.div>
            <div className="text-white/70 space-y-1.5 text-xs leading-relaxed max-w-xs">
              <p className="font-heading text-xs font-bold uppercase tracking-wider text-white">
                AURA 2K26 • Technical Fest
              </p>
              <p className="text-white/80 font-medium">
                Aliah University, Newtown Campus, Kolkata. Discover, Design, and Disrupt the future of hardware technologies.
              </p>
              <p className="text-[11px] text-white/40 pt-1 font-mono">
                © {new Date().getFullYear()} AURA Committee. All rights reserved.
              </p>
            </div>
          </motion.div>

          {/* Column 2: NAVIGATION */}
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex flex-col items-start gap-3"
          >
            <h3 className="font-heading text-sm font-black uppercase tracking-widest text-white border-b-2 border-white/30 pb-1 w-full">
              NAVIGATION
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm font-bold text-white/80">
              <li>
                <button
                  onClick={onRegisterClick}
                  className="hover:text-cyan-300 transition-colors cursor-pointer text-left uppercase font-heading text-xs tracking-wider"
                >
                  • Register Now
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    const el = document.getElementById("contact");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="hover:text-cyan-300 transition-colors cursor-pointer text-left uppercase font-heading text-xs tracking-wider"
                >
                  • Contact Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate("/people")}
                  className="hover:text-cyan-300 transition-colors cursor-pointer text-left uppercase font-heading text-xs tracking-wider"
                >
                  • People
                </button>
              </li>
            </ul>
          </motion.div>

          {/* Column 3: LOCATED AT */}
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="flex flex-col items-start gap-3"
          >
            <h3 className="font-heading text-sm font-black uppercase tracking-widest text-white border-b-2 border-white/30 pb-1 w-full">
              LOCATED AT
            </h3>
            <div className="text-xs sm:text-sm font-body font-semibold text-white/80 leading-relaxed space-y-1">
              <p className="font-bold text-white uppercase font-heading text-xs tracking-wider">
                Aliah University
              </p>
              <p>Action Area IIA, Newtown</p>
              <p>Kolkata, West Bengal 700160</p>
              <p className="text-white text-xs font-mono font-bold pt-1">
                India
              </p>
            </div>
          </motion.div>

          {/* Column 4: LEGAL */}
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex flex-col items-start gap-3"
          >
            <h3 className="font-heading text-sm font-black uppercase tracking-widest text-white border-b-2 border-white/30 pb-1 w-full">
              LEGAL
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm font-bold text-white/80">
              <li>
                <button
                  onClick={() => alert("AURA 2K26 Privacy Policy: We respect your data privacy and ensure all team and participant data is securely protected.")}
                  className="hover:text-cyan-300 transition-colors cursor-pointer text-left uppercase font-heading text-xs tracking-wider"
                >
                  • Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => alert("AURA 2K26 Terms of Service: All hardware competition submissions must strictly follow Aliah University hackathon code of conduct.")}
                  className="hover:text-cyan-300 transition-colors cursor-pointer text-left uppercase font-heading text-xs tracking-wider"
                >
                  • Terms of Service
                </button>
              </li>
            </ul>
          </motion.div>

          {/* Column 5 (Far Right): VENUE MAP */}
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="flex flex-col gap-3 w-full"
          >
            <div className="flex justify-between items-center select-none border-b-2 border-white/30 pb-1 w-full">
              <h3 className="font-heading text-xs font-black uppercase tracking-widest text-white">
                VENUE MAP
              </h3>
              <a
                href="https://maps.app.goo.gl/5Wo4F19PLej4Fw9f7"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] uppercase font-mono tracking-widest text-white hover:underline"
              >
                Maps ↗
              </a>
            </div>
            
            {/* Embedded map iframe */}
            <div className="w-full h-40 sm:h-44 rounded-xl overflow-hidden border-2 border-white/20 relative z-30 shadow-lg">
              <iframe
                title="Aliah University Newtown Campus Map"
                src="https://maps.google.com/maps?q=Aliah%20University%20New%20Town%20Campus&t=&z=15&ie=UTF8&iwloc=&output=embed"
                className="w-full h-full border-0 grayscale invert opacity-80 hover:opacity-100 transition-all duration-300"
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </motion.div>

        </div>
      </footer>
    </div>
  );
}

export default HomeSections;
