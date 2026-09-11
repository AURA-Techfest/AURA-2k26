import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

import websiteBg from "../../assets/WEBSITE_BG.png";
import crewPlaceholder from "../../assets/crew_placeholder.png";

// Async fetcher for Crew / Team Data using TanStack Query
const fetchCrewData = async () => {
  return {
    organisingCommittee: [
      { id: "org-1", name: "Member Name", role: "Role", dept: "Department", img: crewPlaceholder },
      { id: "org-2", name: "Member Name", role: "Role", dept: "Department", img: crewPlaceholder },
      { id: "org-3", name: "Member Name", role: "Role", dept: "Department", img: crewPlaceholder },
      { id: "org-4", name: "Member Name", role: "Role", dept: "Department", img: crewPlaceholder },
      { id: "org-5", name: "Member Name", role: "Role", dept: "Department", img: crewPlaceholder },
      { id: "org-6", name: "Member Name", role: "Role", dept: "Department", img: crewPlaceholder }
    ],
    nonTechnicalTeam: [
      { id: "non-1", name: "Member Name", role: "Role", dept: "Department", img: crewPlaceholder },
      { id: "non-2", name: "Member Name", role: "Role", dept: "Department", img: crewPlaceholder },
      { id: "non-3", name: "Member Name", role: "Role", dept: "Department", img: crewPlaceholder }
    ],
    ourHosts: [
      { id: "host-1", name: "Member Name", role: "Role", dept: "Department", img: crewPlaceholder },
      { id: "host-2", name: "Member Name", role: "Role", dept: "Department", img: crewPlaceholder },
      { id: "host-3", name: "Member Name", role: "Role", dept: "Department", img: crewPlaceholder }
    ],
    techTeam: [
      { id: "tech-1", name: "Member Name", role: "Role", dept: "Department", img: crewPlaceholder },
      { id: "tech-2", name: "Member Name", role: "Role", dept: "Department", img: crewPlaceholder },
      { id: "tech-3", name: "Member Name", role: "Role", dept: "Department", img: crewPlaceholder }
    ]
  };
};

// Interactive 3D Flash Card Component
function FlashCard({ member, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, rotateY: -65, scale: 0.85, y: 30 }}
      whileInView={{ opacity: 1, rotateY: 0, scale: 1, y: 0 }}
      viewport={{ once: false, margin: "-40px" }}
      transition={{
        duration: 0.6,
        delay: (index % 3) * 0.12,
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
      className="group relative bg-white/95 rounded-2xl p-4 sm:p-5 border-4 border-white shadow-[0_15px_35px_rgba(0,0,0,0.6)] hover:shadow-[0_25px_50px_rgba(0,0,0,0.8)] transition-all duration-300 flex flex-col items-start text-left cursor-pointer transform-gpu overflow-hidden"
      style={{ perspective: 1000 }}
    >
      {/* Flash Card Shimmer Light Effect on Hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none z-10" />

      {/* Card Image Container */}
      <div className="w-full aspect-[4/3] rounded-xl overflow-hidden mb-4 bg-slate-100 border border-slate-200 shadow-inner">
        <img
          src={member.img}
          alt={member.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Member Details */}
      <div className="w-full space-y-1 z-20">
        <h4 className="font-heading font-black text-sm sm:text-base text-slate-900 uppercase tracking-wider line-clamp-1">
          {member.name}
        </h4>
        <p className="font-body font-bold text-xs text-slate-600">
          {member.role}
        </p>
        <p className="font-body text-[11px] text-slate-500 font-medium">
          {member.dept}
        </p>
      </div>
    </motion.div>
  );
}

// Section Wrapper for Team Categories
function CrewSection({ title, members }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, margin: "-60px" }}
      transition={{ duration: 0.6 }}
      className="w-full flex flex-col items-center mb-16"
    >
      <h2 
        className="font-heading font-black text-white tracking-widest uppercase mb-8 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] text-center"
        style={{ fontSize: "clamp(1.25rem, 3.5vw, 2.25rem)" }}
      >
        {title}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 w-full max-w-5xl">
        {members.map((member, idx) => (
          <FlashCard key={member.id} member={member} index={idx} />
        ))}
      </div>
    </motion.section>
  );
}

export default function People({ onRegisterClick }) {
  const { data: crewData } = useQuery({
    queryKey: ["meetOurCrewData"],
    queryFn: fetchCrewData,
    staleTime: 1000 * 60 * 10
  });

  const organisingCommittee = crewData?.organisingCommittee || [];
  const nonTechnicalTeam = crewData?.nonTechnicalTeam || [];
  const ourHosts = crewData?.ourHosts || [];
  const techTeam = crewData?.techTeam || [];

  return (
    <div
      className="min-h-screen w-full relative bg-cover bg-center overflow-x-hidden font-sans text-white select-none"
      style={{ backgroundImage: `url(${websiteBg})`, backgroundAttachment: "fixed" }}
    >
      {/* Dark Overlay for high contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/70 to-black/95 pointer-events-none z-0" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8 flex flex-col items-center text-center">
        
        {/* NON-STICKY TOP HEADER */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full flex items-center justify-between py-5 mb-12 border-b-2 border-white/30"
        >
          <Link
            to="/"
            className="px-5 py-2 border-2 border-white rounded-full bg-black/60 hover:bg-white hover:text-black text-white font-heading text-xs sm:text-sm font-black tracking-widest uppercase transition-all shadow-md"
          >
            HOME
          </Link>

          <h1 
            className="font-heading font-black text-white tracking-widest uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
            style={{ fontSize: "clamp(1.5rem, 4.5vw, 3.25rem)" }}
          >
            MEET OUR CREW
          </h1>

          <button
            type="button"
            onClick={onRegisterClick}
            className="px-5 py-2 border-2 border-white rounded-full bg-black/60 hover:bg-white hover:text-black text-white font-heading text-xs sm:text-sm font-black tracking-widest uppercase transition-all shadow-md cursor-pointer"
          >
            JOIN US
          </button>
        </motion.header>

        {/* CREW CATEGORIES */}
        <div className="w-full max-w-5xl space-y-4">
          <CrewSection
            title="THE ORGANISING COMMITTEE"
            members={organisingCommittee}
          />

          <CrewSection
            title="NON-TECHNICAL TEAM"
            members={nonTechnicalTeam}
          />

          <CrewSection
            title="OUR HOSTS"
            members={ourHosts}
          />

          <CrewSection
            title="TECH TEAM"
            members={techTeam}
          />
        </div>

        {/* FOOTER */}
        <footer className="w-full pt-10 border-t-2 border-white/20 text-center font-body text-sm sm:text-base font-bold text-white/70 mt-12">
          <p>Contact us at <a href="mailto:aura@aliah.ac.in" className="text-white underline font-black hover:text-purple-300">aura@aliah.ac.in</a></p>
        </footer>
      </div>
    </div>
  );
}
