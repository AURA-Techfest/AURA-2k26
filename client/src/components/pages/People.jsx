import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

import websiteBg from "../../assets/WEBSITE_BG.png";
import crewPlaceholder from "../../assets/crew_placeholder.png";
import facultyCsvRaw from "../../assets/People/faculty.csv?raw";
import volunteerCsvRaw from "../../assets/People/volunteer.csv?raw";

// Dynamic import of faculty and volunteer images from the assets folder
const facultyImageModules = import.meta.glob("../../assets/People/faculty/*.{jpg,jpeg,png}", {
  eager: true,
  import: "default"
});

const volunteerImageModules = import.meta.glob("../../assets/People/volunteers/*.{jpg,jpeg,png}", {
  eager: true,
  import: "default"
});

const getPersonImage = (picNo, type = "faculty") => {
  if (!picNo) return crewPlaceholder;
  const fileName = picNo.trim();

  const imageModules = type === "volunteer" ? volunteerImageModules : facultyImageModules;
  const folderPath = type === "volunteer" ? "../../assets/People/volunteers" : "../../assets/People/faculty";

  // Try direct key match first
  const directKey = `${folderPath}/${fileName}`;
  if (imageModules[directKey]) {
    return imageModules[directKey];
  }

  // Fallback match by filename suffix
  for (const [key, val] of Object.entries(imageModules)) {
    if (key.endsWith(`/${fileName}`) || key.endsWith(`\\${fileName}`)) {
      return val;
    }
  }

  return crewPlaceholder;
};

// Fallback data for Faculty
const FALLBACK_FACULTY_DATA = [
  { id: "fac-1", position: "Chief Patron", name: "Hon'ble Vice-Chancellor", post: "Aliah University", picNo: "1.jpg" },
  { id: "fac-2", position: "Patron", name: "Registrar", post: "Aliah University", picNo: "2.jpg" },
  { id: "fac-3", position: "Co-Patron", name: "Dean", post: "Faculty of Science and Engineering", picNo: "3.jpg" },
  { id: "fac-4", position: "Organising Secretary", name: "Dr. Rumpa Saha", post: "Dept. of Electrical Engineering", picNo: "4.jpg" },
  { id: "fac-5", position: "Jt. Organising Secretary", name: "Prof. Shamim Haidar", post: "Dept. of Mechanical Engineering", picNo: "5.jpg" },
  { id: "fac-6", position: "Convener", name: "Mr. Pallav Dutta", post: "Dept. of Electrical Engineering", picNo: "6.jpg" },
  { id: "fac-7", position: "Co-Convener", name: "Prof. Mukandar Sekh", post: "Dept. of Mechanical Engineering", picNo: "7.jpg" },
  { id: "fac-8", position: "Executive Member", name: "Prof. Sk. Monowar Hossein", post: "Dept. of Math & Statistics", picNo: "8.jpg" },
  { id: "fac-9", position: "Executive Member", name: "Prof. Md. Mehedi Kalam", post: "Department of Physics", picNo: "9.jpg" },
  { id: "fac-10", position: "Executive Member", name: "Prof. Sk. Md. Obaidullah", post: "Dept of CSE", picNo: "10.jpg" },
  { id: "fac-11", position: "Executive Member", name: "Prof. Quazi Mohammad Alfred", post: "Dept. of ECE", picNo: "11.jpg" },
  { id: "fac-12", position: "Executive Member", name: "Dr. Samiran Sur", post: "Dept. of Mgmt. Sc. & Business Admn.", picNo: "12.jpg" },
  { id: "fac-13", position: "Executive Member", name: "Dr. Mohd Sayeed Ul Hasan", post: "Dept. of Civil Engineering", picNo: "13.jpg" },
  { id: "fac-14", position: "Executive Member", name: "Dr. Rafiqul Haque", post: "Dept. of Mechanical Engineering", picNo: "14.jpg" },
  { id: "fac-15", position: "Executive Member", name: "Dr. Mehboob Hoque", post: "Dept. Biological Sciences", picNo: "15.jpg" },
  { id: "fac-16", position: "Executive Member", name: "Dr. Mustafa Jahir Raihan", post: "Dept. of Chemistry", picNo: "16.jpg" },
  { id: "fac-17", position: "Executive Member", name: "Dr. Moumita Chatterjee", post: "Dept. of CSE", picNo: "17.jpg" },
  { id: "fac-18", position: "Executive Member", name: "Dr. Chowdhury Aminul Islam", post: "Dept. of Physics", picNo: "18.jpg" },
  { id: "fac-19", position: "Executive Member", name: "Dr. Md. Jakir Hossain Molla", post: "Training & Placement Officer", picNo: "19.jpg" },
  { id: "fac-20", position: "Executive Member", name: "Mr. Asif Iqbal", post: "Tech. Asst. (Gr-I), Dept. of CSE", picNo: "20.jpg" },
  { id: "fac-21", position: "Executive Member", name: "Mr. Sk. Hasibur Rahman", post: "Accountant", picNo: "21.jpg" }
];

// Fallback data for Tech Team / Volunteers (Yousuf, Hasnain, Ekramul, Tabrez, Saikat)
const FALLBACK_VOLUNTEER_DATA = [
  { id: "vol-1", position: "Tech Team", name: "Yousuf", post: "Tech Team / Developer", picNo: "yousuf.jpg" },
  { id: "vol-2", position: "Tech Team", name: "Hasnain", post: "Tech Team / Developer", picNo: "hasnain.jpg" },
  { id: "vol-3", position: "Tech Team", name: "Ekramul", post: "Tech Team / UI & Developer", picNo: "ekramul.jpg" },
  { id: "vol-4", position: "Tech Team", name: "Tabrez", post: "Tech Team / Full Stack Developer", picNo: "tabrez.jpg" },
  { id: "vol-5", position: "Tech Team", name: "Saikat", post: "Tech Team / Developer", picNo: "saikat.jpg" }
];

function parseCsvRecords(csvText, idPrefix = "person") {
  if (!csvText || typeof csvText !== "string") return [];
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(",");
    if (parts.length >= 4) {
      const position = parts[0].trim();
      const name = parts[1].trim();
      const picNo = parts[parts.length - 1].trim();
      const post = parts.slice(2, parts.length - 1).join(",").trim();

      records.push({
        id: `${idPrefix}-${i}`,
        position,
        name,
        post,
        picNo
      });
    }
  }

  return records;
}

// Async fetcher for People Data (Faculty Sections & Tech Team)
const fetchPeopleData = async () => {
  // Parse Faculty
  const parsedFaculty = parseCsvRecords(facultyCsvRaw, "fac");
  const rawFacultyList = parsedFaculty.length > 0 ? parsedFaculty : FALLBACK_FACULTY_DATA;

  const populatedFaculty = rawFacultyList.map((item) => ({
    ...item,
    dept: item.post,
    img: getPersonImage(item.picNo, "faculty")
  }));

  const groupsMap = new Map();
  for (const item of populatedFaculty) {
    if (!groupsMap.has(item.position)) {
      groupsMap.set(item.position, []);
    }
    groupsMap.get(item.position).push(item);
  }

  const facultySections = [];
  for (const [position, members] of groupsMap.entries()) {
    const title = members.length > 1 && !position.toLowerCase().endsWith("s")
      ? `${position}s`
      : position;

    facultySections.push({
      id: position.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      position,
      title,
      members
    });
  }

  // Parse Tech Team / Volunteers
  const parsedVolunteers = parseCsvRecords(volunteerCsvRaw, "vol");
  const rawVolunteerList = parsedVolunteers.length > 0 ? parsedVolunteers : FALLBACK_VOLUNTEER_DATA;

  const techTeamMembers = rawVolunteerList.map((item) => ({
    ...item,
    dept: item.post,
    img: getPersonImage(item.picNo, "volunteer")
  }));

  return { facultySections, techTeamMembers };
};

// Interactive Person Card styled with #6f2138 hover effects, accent line, and post color
function PersonCard({ member, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{
        duration: 0.5,
        delay: (index % 3) * 0.1,
        type: "spring",
        stiffness: 140,
        damping: 16
      }}
      whileHover={{
        y: -10,
        scale: 1.04,
        transition: { type: "spring", stiffness: 350, damping: 20 }
      }}
      whileTap={{ scale: 0.98 }}
      className="group relative bg-white/95 rounded-2xl p-4 sm:p-5 border-4 border-white shadow-[0_15px_35px_rgba(0,0,0,0.6)] hover:shadow-[0_25px_50px_rgba(111,33,56,0.45),0_0_25px_rgba(111,33,56,0.25)] hover:border-[#6f2138]/50 transition-all duration-300 flex flex-col items-start text-left cursor-pointer overflow-hidden w-full h-full"
    >
      {/* Ambient #6f2138 Glow Bloom on Hover */}
      <div className="absolute -inset-1 bg-[#6f2138] rounded-2xl opacity-0 group-hover:opacity-40 blur-md transition-opacity duration-300 pointer-events-none -z-10" />

      {/* Shimmer Light Reflection Beam on Hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out pointer-events-none z-10" />

      {/* Card Image Container (1:1 Aspect Ratio) */}
      <div className="w-full aspect-square rounded-xl overflow-hidden mb-4 bg-slate-100 border border-slate-200 shadow-inner flex items-center justify-center">
        <img
          src={member.img}
          alt={member.name}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = crewPlaceholder;
          }}
          className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-500 ease-out"
        />
      </div>

      {/* Member Details: Just Name and Post with #6f2138 Color Accent */}
      <div className="w-full space-y-1.5 z-20 mt-auto">
        {/* Color Accent Bar in #6f2138 */}
        <div className="w-8 h-1 bg-[#6f2138] rounded-full mb-1.5 group-hover:w-16 transition-all duration-300" />

        {/* Member Name */}
        <h4 className="font-heading font-black text-sm sm:text-base text-slate-900 group-hover:text-[#6f2138] uppercase tracking-wider line-clamp-2 leading-tight transition-colors duration-300">
          {member.name}
        </h4>

        {/* Member Post (Dept / Affiliation) in #6f2138 */}
        <p className="font-body font-bold text-xs sm:text-sm text-[#6f2138] leading-snug transition-colors duration-300">
          {member.post}
        </p>
      </div>
    </motion.div>
  );
}

// Section Wrapper for Each Position Row
function PositionSection({ title, members }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5 }}
      className="w-full flex flex-col items-center mb-14 sm:mb-16"
    >
      <h3 
        className="font-heading font-black text-white tracking-widest uppercase mb-6 sm:mb-8 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] text-center px-2"
        style={{ fontSize: "clamp(1.2rem, 3.2vw, 2.2rem)" }}
      >
        {title}
      </h3>

      <div className="flex flex-wrap justify-center gap-6 sm:gap-8 w-full max-w-5xl">
        {members.map((member, idx) => (
          <div
            key={member.id}
            className="w-full sm:w-[calc(50%-1rem)] md:w-[calc(33.333%-1.5rem)] max-w-xs flex"
          >
            <PersonCard member={member} index={idx} />
          </div>
        ))}
      </div>
    </motion.section>
  );
}

export default function People({ onRegisterClick }) {
  const { data: peopleData = { facultySections: [], techTeamMembers: [] } } = useQuery({
    queryKey: ["peopleCrewData"],
    queryFn: fetchPeopleData,
    staleTime: 1000 * 60 * 10
  });

  const { facultySections, techTeamMembers } = peopleData;

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

        <div className="w-full max-w-5xl space-y-12">
          {/* SECTION 1: ORGANISING COMMITTEE & FACULTY */}
          <div className="space-y-6">
            <h2 
              className="font-heading font-black text-white tracking-widest uppercase mb-8 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] text-center border-b-2 border-white/20 pb-4"
              style={{ fontSize: "clamp(1.4rem, 4vw, 2.5rem)" }}
            >
              ORGANISING COMMITTEE
            </h2>

            {facultySections.map((section) => (
              <PositionSection
                key={section.id}
                title={section.title}
                members={section.members}
              />
            ))}
          </div>

          {/* SECTION 2: TECH TEAM (VOLUNTEERS) */}
          <div className="space-y-6 pt-8 border-t-2 border-white/20">
            <h2 
              className="font-heading font-black text-white tracking-widest uppercase mb-8 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] text-center border-b-2 border-white/20 pb-4"
              style={{ fontSize: "clamp(1.4rem, 4vw, 2.5rem)" }}
            >
              TECH TEAM
            </h2>

            <div className="flex flex-wrap justify-center gap-6 sm:gap-8 w-full max-w-5xl">
              {techTeamMembers.map((member, idx) => (
                <div
                  key={member.id}
                  className="w-full sm:w-[calc(50%-1rem)] md:w-[calc(33.333%-1.5rem)] max-w-xs flex"
                >
                  <PersonCard member={member} index={idx} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="w-full pt-10 border-t-2 border-white/20 text-center font-body text-sm sm:text-base font-bold text-white/70 mt-16">
          <p>Contact us at <a href="mailto:aura@aliah.ac.in" className="text-white underline font-black hover:text-purple-300">aura@aliah.ac.in</a></p>
        </footer>
      </div>
    </div>
  );
}

