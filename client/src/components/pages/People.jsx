import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

import websiteBg from "../../assets/WEBSITE_BG.png";
import crewPlaceholder from "../../assets/crew_placeholder.png";
import linkedinImg from "../../assets/linkedin.png";
import unknownImg from "../../assets/People/volunteer/unknown.jpg";

import facultyCsvRaw from "../../assets/People/faculty.csv?raw";
import volunteerCsvRaw from "../../assets/People/volunteer.csv?raw";

// Dynamic import of faculty images from the assets folder
const facultyImageModules = import.meta.glob("../../assets/People/faculty/*.jpg", {
  eager: true,
  import: "default"
});

// Dynamic import of volunteer images from the assets folder
const volunteerImageModules = import.meta.glob(
  "../../assets/People/volunteer/*.{png,jpg,jpeg,webp}",
  {
    eager: true,
    import: "default"
  }
);

const getFacultyImage = (picNo) => {
  if (!picNo) return crewPlaceholder;
  const fileName = picNo.trim();

  // Try direct key match first
  const directKey = `../../assets/People/faculty/${fileName}`;
  if (facultyImageModules[directKey]) {
    return facultyImageModules[directKey];
  }

  // Fallback match by filename suffix
  for (const [key, val] of Object.entries(facultyImageModules)) {
    if (key.endsWith(`/${fileName}`) || key.endsWith(`\\${fileName}`)) {
      return val;
    }
  }

  return crewPlaceholder;
};

const getVolunteerImage = (picNo) => {
  if (!picNo) return unknownImg;
  const fileName = picNo.trim();

  // Numbers 22, 25, 30, 32 pictures are missing -> use unknown.jpg
  const missingPics = ["22.png", "25.png", "30.png", "32.png", "22", "25", "30", "32"];
  if (missingPics.includes(fileName)) {
    return unknownImg;
  }

  // Try direct key match
  const directKey = `../../assets/People/volunteer/${fileName}`;
  if (volunteerImageModules[directKey]) {
    return volunteerImageModules[directKey];
  }

  // Fallback match by filename suffix
  for (const [key, val] of Object.entries(volunteerImageModules)) {
    if (key.endsWith(`/${fileName}`) || key.endsWith(`\\${fileName}`)) {
      return val;
    }
  }

  return unknownImg;
};

// Fallback data in case the raw CSV file cannot be loaded directly
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

function parseFacultyCsv(csvText) {
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
        id: `fac-${i}`,
        position,
        name,
        post,
        picNo
      });
    }
  }

  return records;
}

// Async fetcher for Faculty Data: each position in its own section/row
const fetchFacultyData = async () => {
  const parsed = parseFacultyCsv(facultyCsvRaw);
  const rawList = parsed.length > 0 ? parsed : FALLBACK_FACULTY_DATA;

  const populated = rawList.map((item) => ({
    ...item,
    dept: item.post,
    img: getFacultyImage(item.picNo)
  }));

  // Preserve order of appearance of each position from faculty.csv
  const groupsMap = new Map();
  for (const item of populated) {
    if (!groupsMap.has(item.position)) {
      groupsMap.set(item.position, []);
    }
    groupsMap.get(item.position).push(item);
  }

  const sections = [];
  for (const [position, members] of groupsMap.entries()) {
    const title = members.length > 1 && !position.toLowerCase().endsWith("s")
      ? `${position}s`
      : position;

    sections.push({
      id: position.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      position,
      title,
      members
    });
  }

  return sections;
};

// Volunteer fallback data in case raw volunteer.csv cannot be loaded
const FALLBACK_VOLUNTEER_DATA = [
  { id: "vol-1", post: "Event Management Core", name: "Arslan Shabbir", year: "4th Year, BCA, CSE", picNo: "1.png", socialMedia: "https://www.linkedin.com/in/arslan-shabbir-" },
  { id: "vol-2", post: "Non-Technical", name: "Masuma Khanam", year: "4th Year, Btech, Mechanical", picNo: "2.png", socialMedia: "" },
  { id: "vol-3", post: "Sponsorship Outreach", name: "Rifat Sarkar", year: "2nd Year, Btech, Electrical", picNo: "3.png", socialMedia: "https://www.linkedin.com/in/rifat-sarkar-7971b8381" },
  { id: "vol-4", post: "Non-Technical", name: "Md Sahid Hossain Mondal", year: "3rd Year, Btech, Mechanical", picNo: "4.png", socialMedia: "https://www.instagram.com/your_mshm" },
  { id: "vol-5", post: "Tech Team", name: "Gulam Hasnain Raza", year: "3rd Year, Btech, CSE", picNo: "5.png", socialMedia: "https://www.linkedin.com/in/gulam-hasnain-raza-aa385a325" },
  { id: "vol-6", post: "Host / Anchoring", name: "Safiullah Haque", year: "5th Year, MSc, Chemistry", picNo: "6.png", socialMedia: "" },
  { id: "vol-7", post: "Sponsorship Outreach", name: "Naim Abdullah", year: "2nd Year, Btech, Electrical", picNo: "7.png", socialMedia: "https://www.linkedin.com/in/naim-abdullah-2328b437a" },
  { id: "vol-8", post: "Decorations and Kits", name: "Md Sharique Siddiqui", year: "3rd Year, Btech, Mechanical", picNo: "8.png", socialMedia: "https://www.linkedin.com/in/md-sharique-siddiqui" },
  { id: "vol-9", post: "Non-Technical", name: "Bakhtiar Kharaz", year: "3rd Year, Btech, Electrical", picNo: "9.png", socialMedia: "https://in.linkedin.com/in/bakhtiar-kharaz-225271356" },
  { id: "vol-10", post: "Non-Technical", name: "Alisha Hasan", year: "4th Year, Btech, Mechanical", picNo: "10.png", socialMedia: "https://www.linkedin.com/in/alisha-hasan-36945b33b" },
  { id: "vol-11", post: "Non-Technical", name: "Sk Momen Ali", year: "3rd Year, Btech, Mechanical", picNo: "11.png", socialMedia: "" },
  { id: "vol-12", post: "Non-Technical", name: "Khandekar Md Zidan", year: "3rd Year, Btech, Civil", picNo: "12.png", socialMedia: "" },
  { id: "vol-13", post: "Non-Technical", name: "Akhtarul Islam", year: "2nd Year, Btech, Mechanical", picNo: "13.png", socialMedia: "https://www.linkedin.com/in/md-akhtarul-islam-7b4482384" },
  { id: "vol-14", post: "Non-Technical", name: "Wasiu Islam", year: "3rd Year, Btech, Electrical", picNo: "14.png", socialMedia: "" },
  { id: "vol-15", post: "Tech Team", name: "Md Yousuf Mallik", year: "3rd Year, Btech, CSE", picNo: "15.png", socialMedia: "https://www.linkedin.com/in/yousuf-mallik/" },
  { id: "vol-16", post: "Tech Team", name: "Ekramul Quader", year: "3rd Year, Btech, CSE", picNo: "16.png", socialMedia: "https://www.linkedin.com/in/ekramul-quader-523a9a418/" },
  { id: "vol-17", post: "Event Management Core", name: "Anirban Ahamed", year: "4th Year, Btech, Civil", picNo: "17.png", socialMedia: "https://www.linkedin.com/in/anirban-ahamed-99671428b" },
  { id: "vol-18", post: "Tech Team", name: "Syed Tabrez", year: "3rd Year, Btech, CSE", picNo: "18.png", socialMedia: "https://www.linkedin.com/in/syed-tabrez-868111294" },
  { id: "vol-19", post: "Sponsorship Outreach", name: "Inzamam Ul Haque", year: "4th Year, Btech, Electrical", picNo: "19.png", socialMedia: "https://www.linkedin.com/in/inzamam-ul-haque-6a9534290" },
  { id: "vol-20", post: "Non-Technical", name: "Mehek Sultana", year: "3rd Year, BCA, CSE", picNo: "20.png", socialMedia: "https://www.linkedin.com/in/mehek-sultana-217b98360" },
  { id: "vol-21", post: "Non-Technical", name: "Syed Mustafijur Rahaman", year: "1st Year, MTech, CSE", picNo: "21.png", socialMedia: "" },
  { id: "vol-22", post: "Non-Technical", name: "Abdur Raihan Pramanik", year: "2nd Year, BSc, Physics", picNo: "22.png", socialMedia: "" },
  { id: "vol-23", post: "Photographer", name: "Asanuddin Sk", year: "3rd Year, Btech, Mechanical", picNo: "23.png", socialMedia: "https://www.linkedin.com/in/asanuddin-sk-818216388" },
  { id: "vol-24", post: "Non-Technical", name: "Iffat Zareen", year: "3rd Year, BCA, CSE", picNo: "24.png", socialMedia: "https://www.linkedin.com/in/iffat-zareen-26377b399" },
  { id: "vol-25", post: "Non-Technical", name: "Humayun Kabir", year: "4th Year, MSc, Physics", picNo: "25.png", socialMedia: "" },
  { id: "vol-26", post: "Non-Technical", name: "Sk Nazmul Alam", year: "3rd Year, Btech, Mechanical", picNo: "26.png", socialMedia: "https://www.linkedin.com/in/nazmul-alam-90581b318" },
  { id: "vol-27", post: "Non-Technical", name: "Salehin Sk", year: "2nd Year, Btech, Electrical", picNo: "27.png", socialMedia: "https://www.linkedin.com/in/salehin-sk-7112a7372" },
  { id: "vol-28", post: "Tech Team", name: "Saikat Kar", year: "2nd Year, Btech, CSE", picNo: "28.png", socialMedia: "https://www.linkedin.com/in/saikat-kar-61569b37b" },
  { id: "vol-29", post: "Anchoring", name: "Shamina Kosar", year: "2nd Year, Btech, Electrical", picNo: "29.png", socialMedia: "https://www.linkedin.com/in/shamina-kosar-9a9036391" },
  { id: "vol-30", post: "Non-Technical", name: "Sudipta Pal", year: "4th Year, Btech, Electrical", picNo: "30.png", socialMedia: "" },
  { id: "vol-31", post: "Non-Technical", name: "Omega Mondal", year: "3rd Year, BSc, Chemistry", picNo: "31.png", socialMedia: "" },
  { id: "vol-32", post: "Non-Technical", name: "Samim Seikh", year: "2nd Year, Btech, Electrical", picNo: "32.png", socialMedia: "" },
  { id: "vol-33", post: "Non-Technical", name: "Syed Nawazish Ahsan", year: "4th Year, Btech, Electrical", picNo: "33.png", socialMedia: "" }
];

// Helper to parse CSV lines with quoted commas
function parseCSVLine(line) {
  const result = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "," && !inQuotes) {
      result.push(cur.trim());
      cur = "";
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

function parseVolunteerCsv(csvText) {
  if (!csvText || typeof csvText !== "string") return [];
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = parseCSVLine(line);
    if (parts.length >= 4) {
      const post = parts[0].trim();
      const name = parts[1].trim();
      const year = parts[2].trim();
      const picNo = parts[3].trim();
      const socialMedia = (parts[4] || "").trim();

      records.push({
        id: `vol-${i}`,
        post,
        name,
        year,
        picNo,
        socialMedia
      });
    }
  }

  return records;
}

// Async fetcher for Volunteer Data in strict requested order:
// 1. Tech Team
// 2. Host
// 3. Event Management Core
// 4. Sponsorship Outreach
// 5. Decorations & Kits
// 6. Non-Technical
const fetchVolunteerData = async () => {
  const parsed = parseVolunteerCsv(volunteerCsvRaw);
  const rawList = parsed.length > 0 ? parsed : FALLBACK_VOLUNTEER_DATA;

  const populated = rawList.map((item) => ({
    ...item,
    img: getVolunteerImage(item.picNo)
  }));

  const sections = [
    { id: "tech-team", title: "TECH TEAM", members: [] },
    { id: "host", title: "HOST", members: [] },
    { id: "event-management-core", title: "EVENT MANAGEMENT CORE", members: [] },
    { id: "sponsorship", title: "SPONSORSHIP OUTREACH", members: [] },
    { id: "decorations", title: "DECORATIONS & KITS", members: [] },
    { id: "non-technical", title: "NON-TECHNICAL", members: [] }
  ];

  for (const item of populated) {
    const postLower = item.post.toLowerCase();

    if (postLower.includes("tech team") || (postLower.includes("tech") && !postLower.includes("non"))) {
      sections[0].members.push({ ...item, displayPost: item.post });
    } else if (postLower.includes("host") || postLower.includes("anchor")) {
      sections[1].members.push({ ...item, displayPost: "Host / Anchoring" });
    } else if (postLower.includes("event management")) {
      sections[2].members.push({ ...item, displayPost: item.post });
    } else if (postLower.includes("sponsorship")) {
      sections[3].members.push({ ...item, displayPost: item.post });
    } else if (postLower.includes("decoration")) {
      sections[4].members.push({ ...item, displayPost: item.post });
    } else {
      // Non-technical, general volunteers, and photographer
      sections[5].members.push({ ...item, displayPost: item.post });
    }
  }

  // Only return sections with members
  return sections.filter((sec) => sec.members.length > 0);
};

// Interactive Faculty Card styled with #6f2138 hover effects, accent line, and post color
function FacultyCard({ member, index }) {
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

// Volunteer Card: Supports 3D Card Flip for members with LinkedIn, and shimmer beam for members without
function VolunteerCard({ member, index }) {
  const hasLinkedin = Boolean(
    member.socialMedia && member.socialMedia.toLowerCase().includes("linkedin")
  );
  const [isFlipped, setIsFlipped] = useState(false);

  // If no LinkedIn: Keep shimmering effect and standard hover lift
  if (!hasLinkedin) {
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
              e.currentTarget.src = unknownImg;
            }}
            className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-500 ease-out"
          />
        </div>

        {/* Member Details */}
        <div className="w-full space-y-1 z-20 mt-auto">
          <div className="w-8 h-1 bg-[#6f2138] rounded-full mb-1.5 group-hover:w-16 transition-all duration-300" />
          <h4 className="font-heading font-black text-sm sm:text-base text-slate-900 group-hover:text-[#6f2138] uppercase tracking-wider line-clamp-2 leading-tight transition-colors duration-300">
            {member.name}
          </h4>
          <p className="font-body font-bold text-xs sm:text-sm text-[#6f2138] leading-snug transition-colors duration-300">
            {member.displayPost || member.post}
          </p>
          {member.year && (
            <p className="font-body text-[11px] sm:text-xs text-slate-500 font-semibold leading-tight">
              {member.year}
            </p>
          )}
        </div>
      </motion.div>
    );
  }

  // If member has LinkedIn: 3D Card Flip on hover/click with LinkedIn branding & direct profile link
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
      className="w-full h-full relative"
      style={{ perspective: 1200 }}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
      onClick={() => setIsFlipped((prev) => !prev)}
    >
      <motion.div
        className="w-full h-full relative"
        style={{ transformStyle: "preserve-3d" }}
        animate={{
          rotateY: isFlipped ? 180 : 0,
          y: isFlipped ? -10 : 0,
          scale: isFlipped ? 1.04 : 1
        }}
        transition={{
          duration: 0.6,
          ease: [0.23, 1, 0.32, 1]
        }}
      >
        {/* FRONT FACE */}
        <div
          className="group relative bg-white/95 rounded-2xl p-4 sm:p-5 border-4 border-white shadow-[0_15px_35px_rgba(0,0,0,0.6)] hover:shadow-[0_25px_50px_rgba(111,33,56,0.45),0_0_25px_rgba(111,33,56,0.25)] hover:border-[#6f2138]/50 transition-colors duration-300 flex flex-col items-start text-left cursor-pointer overflow-hidden w-full h-full"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden"
          }}
        >
          {/* Subtle LinkedIn Indicator Badge on Front Face */}
          <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-[#6f2138] text-white px-2 py-1 rounded-full shadow-md text-[10px] font-heading font-black tracking-wider uppercase group-hover:scale-105 transition-transform">
            <img src={linkedinImg} alt="LinkedIn" className="w-3.5 h-3.5 object-contain" />
            <span className="hidden sm:inline">Connect</span>
          </div>

          {/* Ambient #6f2138 Glow Bloom */}
          <div className="absolute -inset-1 bg-[#6f2138] rounded-2xl opacity-0 group-hover:opacity-40 blur-md transition-opacity duration-300 pointer-events-none -z-10" />

          {/* Card Image Container (1:1 Aspect Ratio) */}
          <div className="w-full aspect-square rounded-xl overflow-hidden mb-4 bg-slate-100 border border-slate-200 shadow-inner flex items-center justify-center">
            <img
              src={member.img}
              alt={member.name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = unknownImg;
              }}
              className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-500 ease-out"
            />
          </div>

          {/* Member Details */}
          <div className="w-full space-y-1 z-20 mt-auto">
            <div className="w-8 h-1 bg-[#6f2138] rounded-full mb-1.5 group-hover:w-16 transition-all duration-300" />
            <h4 className="font-heading font-black text-sm sm:text-base text-slate-900 group-hover:text-[#6f2138] uppercase tracking-wider line-clamp-2 leading-tight transition-colors duration-300">
              {member.name}
            </h4>
            <p className="font-body font-bold text-xs sm:text-sm text-[#6f2138] leading-snug transition-colors duration-300">
              {member.displayPost || member.post}
            </p>
            {member.year && (
              <p className="font-body text-[11px] sm:text-xs text-slate-500 font-semibold leading-tight">
                {member.year}
              </p>
            )}
          </div>
        </div>

        {/* BACK FACE */}
        <div
          className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#6f2138] via-[#5c1a2d] to-[#45101f] text-white rounded-2xl p-5 border-4 border-white shadow-[0_25px_50px_rgba(111,33,56,0.6),0_0_30px_rgba(111,33,56,0.3)] flex flex-col items-center justify-between text-center cursor-pointer overflow-hidden"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)"
          }}
          onClick={() => {
            window.open(member.socialMedia, "_blank", "noopener,noreferrer");
          }}
        >
          {/* Ambient Bloom on Back Face */}
          <div className="absolute -inset-1 bg-[#6f2138] rounded-2xl opacity-60 blur-md pointer-events-none -z-10" />

          {/* Top Profile Summary */}
          <div className="w-full flex flex-col items-center pt-2">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/80 shadow-md bg-white/10 mb-2.5 flex-shrink-0">
              <img
                src={member.img}
                alt={member.name}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = unknownImg;
                }}
                className="w-full h-full object-cover"
              />
            </div>
            <h4 className="font-heading font-black text-sm sm:text-base text-white uppercase tracking-wider line-clamp-2 leading-tight">
              {member.name}
            </h4>
            <p className="font-body font-bold text-xs text-rose-200 mt-1">
              {member.displayPost || member.post}
            </p>
            {member.year && (
              <p className="font-body text-[11px] text-white/70 font-medium">
                {member.year}
              </p>
            )}
          </div>

          {/* Center LinkedIn Logo Highlight */}
          <div className="my-auto py-2 flex flex-col items-center">
            <div className="p-3 bg-white/15 rounded-2xl backdrop-blur-sm border border-white/20 shadow-inner hover:scale-110 transition-transform duration-300">
              <img
                src={linkedinImg}
                alt="LinkedIn"
                className="w-10 h-10 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
              />
            </div>
          </div>

          {/* Bottom Call to Action Button */}
          <a
            href={member.socialMedia}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="w-full py-2.5 px-4 bg-white text-[#6f2138] hover:bg-rose-50 active:bg-slate-100 rounded-xl font-heading text-xs font-black tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer"
          >
            <img src={linkedinImg} alt="" className="w-4 h-4 object-contain" />
            <span>CONNECT ON LINKEDIN</span>
          </a>
        </div>
      </motion.div>
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
      <h2 
        className="font-heading font-black text-white tracking-widest uppercase mb-6 sm:mb-8 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] text-center px-2"
        style={{ fontSize: "clamp(1.2rem, 3.2vw, 2.2rem)" }}
      >
        {title}
      </h2>

      <div className="flex flex-wrap justify-center gap-6 sm:gap-8 w-full max-w-5xl">
        {members.map((member, idx) => (
          <div
            key={member.id}
            className="w-full sm:w-[calc(50%-1rem)] md:w-[calc(33.333%-1.5rem)] max-w-xs flex"
          >
            <FacultyCard member={member} index={idx} />
          </div>
        ))}
      </div>
    </motion.section>
  );
}

// Section Wrapper for Volunteer Rows
function VolunteerPositionSection({ title, members }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5 }}
      className="w-full flex flex-col items-center mb-14 sm:mb-16"
    >
      <h2
        className="font-heading font-black text-white tracking-widest uppercase mb-6 sm:mb-8 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] text-center px-2"
        style={{ fontSize: "clamp(1.2rem, 3.2vw, 2.2rem)" }}
      >
        {title}
      </h2>

      <div className="flex flex-wrap justify-center gap-6 sm:gap-8 w-full max-w-5xl">
        {members.map((member, idx) => (
          <div
            key={member.id}
            className="w-full sm:w-[calc(50%-1rem)] md:w-[calc(33.333%-1.5rem)] max-w-xs flex"
          >
            <VolunteerCard member={member} index={idx} />
          </div>
        ))}
      </div>
    </motion.section>
  );
}

export default function People({ onRegisterClick }) {
  const { data: facultySections = [] } = useQuery({
    queryKey: ["facultyPeopleData"],
    queryFn: fetchFacultyData,
    staleTime: 1000 * 60 * 10
  });

  const { data: volunteerSections = [] } = useQuery({
    queryKey: ["volunteerPeopleData"],
    queryFn: fetchVolunteerData,
    staleTime: 1000 * 60 * 10
  });

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

        {/* FACULTY POSITIONS */}
        <div className="w-full max-w-5xl space-y-4">
          {facultySections.map((section) => (
            <PositionSection
              key={section.id}
              title={section.title}
              members={section.members}
            />
          ))}
        </div>

        {/* VOLUNTEER SECTION DIVIDER & HEADING */}
        <div className="w-full max-w-5xl my-10 sm:my-14 flex items-center justify-center gap-4">
          <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-white/40 to-white/10" />
          <span className="font-heading font-black text-white/90 tracking-widest text-lg sm:text-2xl uppercase px-4 py-2 border-2 border-white/40 rounded-full bg-black/40 backdrop-blur-sm shadow-[0_0_20px_rgba(111,33,56,0.5)]">
            STUDENT VOLUNTEERS
          </span>
          <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent via-white/40 to-white/10" />
        </div>

        {/* VOLUNTEER SUB-SECTIONS (Host, Event Management, Sponsorship, Decorations, Non-Technical) */}
        <div className="w-full max-w-5xl space-y-4">
          {volunteerSections.map((section) => (
            <VolunteerPositionSection
              key={section.id}
              title={section.title}
              members={section.members}
            />
          ))}
        </div>

        {/* FOOTER */}
        <footer className="w-full pt-10 border-t-2 border-white/20 text-center font-body text-sm sm:text-base font-bold text-white/70 mt-12">
          <p>Contact us at <a href="mailto:aura@aliah.ac.in" className="text-white underline font-black hover:text-purple-300">aura@aliah.ac.in</a></p>
        </footer>
      </div>
    </div>
  );
}
