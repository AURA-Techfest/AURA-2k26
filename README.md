# ⚡ AURA 2K26 — Aliah University Annual Techfest

<div align="center">

  <img src="client/src/assets/AURA_26_LOGO.png" alt="AURA 2K26 Logo" width="220" />

  <p align="center">
    <strong>Where Ideas Meet Innovation — Aliah University's Research Aspirations</strong>
  </p>
  <p align="center">
    The official full-stack digital platform for <strong>AURA 2K26</strong>, the flagship annual national hardware techfest of <strong>Aliah University, Kolkata</strong>.
  </p>

  <p align="center">
    <a href="https://aura2k26.com"><strong>🌐 Live Website: aura2k26.com</strong></a> •
    <a href="#-tech-stack"><strong>🛠️ Tech Stack</strong></a> •
    <a href="#-core-features"><strong>✨ Core Features</strong></a> •
    <a href="#-upcoming-features--roadmap"><strong>🚀 Upcoming Features</strong></a> •
    <a href="#-getting-started"><strong>⚡ Quickstart</strong></a> •
    <a href="#-api-endpoints"><strong>🔌 API Docs</strong></a>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/React-19.2.8-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
    <img src="https://img.shields.io/badge/Vite-8.2.0-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 8" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-v4.3.3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS v4" />
    <img src="https://img.shields.io/badge/Node.js-Express_5-green?style=for-the-badge&logo=express&logoColor=white" alt="Express 5" />
    <img src="https://img.shields.io/badge/MongoDB-Mongoose_9-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
    <img src="https://img.shields.io/badge/Cloudinary-Asset_Storage-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white" alt="Cloudinary" />
    <img src="https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
  </p>

- 🎯 Event & competition details
- 📝 Online registrations
- 📢 Announcements & updates
- 🏆 Results & highlights
- 👥 Participant-focused experience
- 🗳️ Audience Choice voting (one vote per participant, 10–20 min live window)

</div>

---

## 📖 Table of Contents

- [About AURA 2K26](#-about-aura-2k26)
- [Tech Stack](#-tech-stack)
  - [Frontend](#frontend-client)
  - [Backend & Database](#backend--database-server)
  - [Cloud Storage & DevOps](#cloud-storage--devops)
- [Core Features (Implemented)](#-core-features)
  - [1. Retro-Futuristic Cyberpunk Cockpit UI](#1-retro-futuristic-cyberpunk-cockpit-ui)
  - [2. Hardware Project Submission & Registration Portal](#2-hardware-project-submission--registration-portal)
  - [3. End-to-End RSVP & Payment Verification System](#3-end-to-end-rsvp--payment-verification-system)
  - [4. Sponsorship & Corporate Partner Portal](#4-sponsorship--corporate-partner-portal)
  - [5. Interactive SVG Milestone Timeline](#5-interactive-svg-milestone-timeline)
  - [6. People & Committee Directory (Dynamic CSV)](#6-people--committee-directory-dynamic-csv)
  - [7. Responsive Bento Photo Gallery Archive](#7-responsive-bento-photo-gallery-archive)
  - [8. Transactional Email Automation & CLI Tooling](#8-transactional-email-automation--cli-tooling)
- [Upcoming Features & Roadmap](#-upcoming-features--roadmap)
- [System Architecture & Folder Structure](#-system-architecture--folder-structure)
- [Getting Started & Local Development](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Client Setup](#1-client-setup)
  - [Server Setup](#2-server-setup)
- [Environment Variables Guide](#-environment-variables-guide)
- [REST API Reference](#-rest-api-reference)
- [Partner & Sponsor Ecosystem](#-partner--sponsor-ecosystem)
- [Contact & Support](#-contact--support)

---

## 🌟 About AURA 2K26

**AURA (Aliah University's Research Aspirations)** is the premier annual technical fest hosted at **Aliah University, Newtown Campus, Kolkata**. 

AURA 2K26 brings together budding engineers, creators, inventors, and innovators across India to showcase **live, functional hardware prototypes** tackling real-world problems in robotics, IoT, renewable energy, assistive tech, AI-integrated systems, and automation.

- **Venue:** Aliah University, Newtown Campus, IIA/27, Action Area II, Newtown, Kolkata, West Bengal 700160
- **Organized In Association With:** Institution's Innovation Council (IIC Aliah University)
- **Technical Co-Sponsors:** IEEE Power & Energy Society (PES) SBC, The Institution of Engineering and Technology (IET)
- **Industry Partners:** Shaw Enterprise, Adarsha Academy

---

## 🛠️ Tech Stack

### Frontend (`client/`)
| Layer | Technology | Details |
|---|---|---|
| **Core Framework** | **React 19** (`react` 19.2.8, `react-dom` 19.2.8) | Modern component architecture, hooks, and Concurrent Mode |
| **Build Tool** | **Vite 8** (`vite` 8.2.0, `@vitejs/plugin-react` 6.0.4) | Lightning-fast HMR and optimized asset bundling |
| **Styling** | **Tailwind CSS v4** (`tailwindcss` 4.3.3, `@tailwindcss/vite`) | Utility-first styling with custom theme color tokens & typography |
| **Animations** | **Framer Motion 13** & **GSAP 3** (`@gsap/react` 2.1.2) | 3D cockpit perspective tilts, spring transitions, and keyframe motions |
| **Smooth Scroll** | **Lenis 1.3** (`lenis` 1.3.26) | Ultra-smooth momentum scrolling for desktop viewports |
| **State & Queries** | **TanStack React Query v5** (`@tanstack/react-query` 5.102.4) | Asynchronous state management, mutations, and API caching |
| **Client Routing** | **React Router v7** (`react-router-dom` 7.18.3) | Dynamic route handling and SPA navigation |
| **Icons & Utilities**| **Lucide React** (`lucide-react` 1.33.0), `clsx`, `tailwind-merge` | Vector iconography and conditional class concatenation |
| **Linter** | **Oxlint** (`oxlint` 1.75.0) | High-performance Rust-based JavaScript linter |

### Backend & Database (`server/`)
| Layer | Technology | Details |
|---|---|---|
| **Runtime** | **Node.js** (Native ES Modules `"type": "module"`) | Fast asynchronous execution runtime |
| **Web Server** | **Express 5** (`express` 5.2.1) | Clean RESTful routing, centralized error handling, and middleware stack |
| **Database & ODM** | **MongoDB** & **Mongoose 9** (`mongoose` 9.9.3) | Document schemas with strict validation, indexes, and TTL auto-expiry |
| **File Handling** | **Multer 2** (`multer` 2.2.0) | Multi-part form-data parsing with memory buffers & size quotas |
| **Email Service** | **Nodemailer 10** (`nodemailer` 10.0.10) | Automated branded HTML/text emails via Gmail SMTP with TLS |
| **Security & Auth** | **HMAC-SHA256 Token Auth**, `cors`, `dotenv` | Session token signing, origin whitelisting, and rate-limiting |
| **Development** | **Nodemon** (`nodemon` 3.1.14) | Auto-reload server during development |

### Cloud Storage & DevOps
| Service | Purpose | Details |
|---|---|---|
| **Cloudinary** (`cloudinary` 2.10.1) | Media & Document Storage | Secure cloud storage for college IDs, abstract PDFs, and payment screenshots |
| **Vercel** | Frontend Hosting & CDN | Edge-delivered SPA with customized `vercel.json` rewrites |
| **pnpm** | Package Management | High-speed, disk-efficient package management (`pnpm@11.23.0`) |

---

## ✨ Core Features

### 1. Retro-Futuristic Cyberpunk Cockpit UI
- **Control Room Aesthetic:** Tactile UI inspired by 1980s retro-futuristic control panels, mechanical switches, brass screws, and CRT monitor overlays with realistic scanlines and curvature.
- **3D Mouse Parallax Tilt:** The hero viewport calculates normalized mouse cursor offsets and dynamically tilts the central cockpit panel in 3D space using Framer Motion.
- **Interactive Mechanical Controls:** Functional toggle switches, glowing LED status indicators (`LedIndicator`), and Mac-tab style window chrome.
- **Custom Design Tokens:** Bespoke palette featuring cyber copper (`#A85F45`), cyber teal (`#5FA6A7`), cyber amber (`#D5A23A`), cyber brown (`#5A3329`), and dark industrial backdrop (`#0B0909`).

### 2. Hardware Project Submission & Registration Portal
- **Multi-Step Guided Flow:** Clean step-by-step registration wizard for teams with live draft saving in `localStorage` to prevent data loss.
- **Real-Time Pre-Validation:** Debounced validation check against `/api/registrations/check` to alert users instantly if their Team Name or Leader Email is already registered.
- **Extensive Hardware Project Taxonomy:**
  - 19 Project Categories: Robotics, Embedded Systems, IoT, Clean Tech, Assistive Devices, Healthcare, AI-Enabled Hardware, Drones, Mechatronics, etc.
  - Operational Status: Fully functional, minor setup/calibration required, or controlled conditions.
  - Hardware specifications: Major hardware components, power source selection (battery, solar, AC/DC, USB), AI/IoT flag declarations, and development cost breakdown.
- **Safety & Hazard Assessment:** Built-in hazard audit checklist (high-voltage, rotating machinery, high temperature, pressurized systems, lasers, drone flight) with mandatory mitigation plans.
- **Direct Cloud Document Uploads:** College ID cards for all team members (up to 4) and project abstract documentation (PDF) uploaded seamlessly to Cloudinary via Multer memory storage.
- **Instant Email Dispatch:** Teams instantly receive a beautifully styled HTML registration confirmation email containing their unique alphanumeric Registration ID (e.g., `AURA2K26-XXXXXX`).

### 3. End-to-End RSVP & Payment Verification System
- **Self-Service RSVP Portal (`/rsvp`):** A dedicated portal for shortlisted and registered teams to confirm physical attendance and complete check-in requirements.
- **Secure Passwordless OTP Authentication:**
  - Team leaders enter their Registration ID and registered email.
  - The server issues a secure 6-digit OTP stored in MongoDB with a 10-minute TTL index (`RsvpOtp`).
  - Upon OTP verification, an HMAC-SHA256 signed session token is returned.
- **Dynamic Fee Engine:**
  - Automatically parses team affiliations (`all_aliah`, `all_other`, `mixed`).
  - Aliah University students enjoy **100% free participation**.
  - External team members are billed a designated entry fee with clear itemized fee breakdowns.
- **Payment Gateway QR & Proof Submission:**
  - Dynamic UPI QR display (`payment_qr.jpeg` / Cloudinary URL).
  - Teams enter their UPI Reference / UTR Number and upload payment confirmation screenshots.
- **Attendance Receipt & Status Tracking:**
  - Immediate printable receipt with dynamic status tags (`confirmed`, `pending_verification`, `rejected`).
  - Automatic RSVP confirmation emails sent via Nodemailer.
- **Admin Review Endpoints:** Built-in API routes (`/api/rsvp/admin/list`, `/api/rsvp/admin/verify/:id`) for organizing teams to audit payments, approve entries, or record rejection notes.

### 4. Sponsorship & Corporate Partner Portal
- **Tiered Sponsorship Showcase (`/sponsors`):**
  - Interactive tier cards detailing perks, deliverables, stall allocation, and pricing:
    - **Platinum** (₹1,00,000)
    - **Diamond** (₹75,000)
    - **Gold** (₹50,000)
    - **Silver** (₹25,000)
    - **Bronze** (₹10,000)
- **Online Sponsor Application Form (`/sponsors/form`):**
  - Organization profile capture, representative contact info, transaction reference, and payment screenshot upload.
  - Dedicated MongoDB collection (`Sponsorship`) to track sponsor leads and verification statuses.
- **Partner Showcase:** Live recognition cards for technical co-sponsors (IEEE PES, IET), institutional partners (IIC Aliah), media partners, and hydration partners.

### 5. Interactive SVG Milestone Timeline
- **Scroll-Driven SVG Path Progress:** Dynamic timeline using smooth scroll progress tracking (`useScroll` and `useSpring`).
- **Real-Time Date Tracking:** Displays event milestones with strike-through revisions and highlighted extended dates (abstract submission, shortlisting, grand finale).
- **Milestone Cards & Glowing Waypoints:** Animated waypoint dots illuminate as the participant scrolls down the page.

### 6. People & Committee Directory (Dynamic CSV)
- **Zero-Code Committee Updates:** Reads faculty mentors and student volunteers directly from raw CSV files (`faculty.csv`, `volunteer.csv`).
- **Dynamic Asset Resolution:** Leverages Vite's `import.meta.glob` to automatically map volunteer and faculty pictures to their respective names.
- **Interactive UI:** Category tabs (Faculty / Volunteers), volunteer ID search, LinkedIn profile shortcuts, and fallback avatars for missing headshots.

### 7. Responsive Bento Photo Gallery Archive
- **Multi-Year Historical Gallery (`/gallery/2024`, `/gallery/2025`):**
  - High-definition image repository hosted on Cloudinary CDN.
  - Responsive Bento-grid layout adapting from single-column mobile view to multi-span desktop grids.
- **Interactive Lightbox Viewer:** Full-screen zoom modal with next/previous keyboard shortcuts, backdrop blur, and smooth image carousel navigation.

### 8. Transactional Email Automation & CLI Tooling
- **Branded Email Engine:** Responsive, dark-themed HTML email templates with fallback plain-text for registrations, OTPs, and RSVP receipts.
- **Startup SMTP Health Check:** Non-blocking async check (`verifyEmailConfig()`) on server launch ensuring credentials and connectivity without halting boot.
- **CLI Utility Suite (`server/scripts/`):**
  - `diagnose-smtp.js` — Deep diagnostic test for Gmail SMTP, port 465/587 connectivity, and TLS handshakes.
  - `send-registration-emails.js` — CLI tool to backfill and bulk-send confirmation emails to teams registered during offline/failed SMTP states.
  - `test-email.js` — Quick email dispatch test.
  - `test-rsvp.js`, `test-rsvp-api.js`, `test-rsvp-verification.js` — Comprehensive test suites for RSVP token generation, OTP flows, and fee calculations.
  - `update-team-taraksha.js` — Database migration utility for retroactive affiliation adjustments.

---

## 🚀 Upcoming Features & Roadmap

The following features are scheduled for deployment in the upcoming development sprints:

- [ ] **🏆 Live Jury Evaluation & Scoring Portal:**
  - A secure, mobile-friendly scoring interface for on-site judges and jury panels.
  - Multi-criteria weighted rubrics (Hardware Complexity, Practical Viability, Working Prototype Reliability, Innovation, and Live Presentation).
  - Real-time leaderboard calculations and automated tallying.
- [ ] **🎫 QR Code Spot Check-In & Badge Generator:**
  - Automated generation of downloadable PDF entry passes with cryptographic QR codes for all confirmed participants.
  - Fast-track on-desk check-in scanner web app for registration volunteers on fest day.
- [ ] **📜 Verifiable Digital Certificate Engine:**
  - Automated PDF certificate generation for all participants, finalists, and winners.
  - Tamper-proof verification system with unique certificate IDs and public URL verification (`/verify-certificate/:certId`).
- [ ] **📊 Unified Admin CMS Dashboard:**
  - Single consolidated web dashboard with role-based access control (Super Admin, Finance Desk, Reviewer).
  - One-click CSV/Excel export of registrations, hardware specifications, and sponsor leads.
  - Status management for submissions, RSVP verification, and payment approvals.
- [ ] **🔔 Real-Time Announcements & Push Alerts:**
  - Push notification system and optional SMS/WhatsApp integration to broadcast stage callouts, track schedule shifts, and emergency updates to participants.
- [ ] **🗳️ "People's Choice" Public Exhibition & Voting:**
  - Virtual project showcase pages featuring hardware photos and video demos.
  - Audience voting system with anti-bot rate limiting to crown the "Audience Favorite Prototype".
- [ ] **🤖 AI Fest Concierge (Chatbot):**
  - Intelligent conversational assistant trained on fest guidelines, rulebooks, event timelines, and campus maps to assist visiting students 24/7.

---

## 📁 System Architecture & Folder Structure

```
AURA-2k26/
├── vercel.json                 # Vercel SPA routing & rewrites configuration
├── package-lock.json
│
├── client/                     # Frontend Application (React 19 + Vite 8)
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── assets/             # Brand logos, sponsor images, fonts, PDF brochures
│   │   │   ├── fonts/          # Lovelo Black, Lovelo Line fonts
│   │   │   └── People/         # faculty.csv, volunteer.csv, headshot galleries
│   │   ├── components/
│   │   │   ├── effects/        # CRTOverlay.jsx (Retro scanlines)
│   │   │   ├── hero/           # ControlRoomHero.jsx, CRTScreen.jsx
│   │   │   ├── layout/         # Navbar.jsx, Sidebar.jsx
│   │   │   ├── pages/          # Sponsors.jsx, People.jsx, RsvpPage.jsx, GalleryDetail.jsx
│   │   │   ├── sections/       # HomeSections.jsx (Hero, Event, About, Timeline, Contact)
│   │   │   ├── system/         # SystemStatusBar.jsx
│   │   │   ├── ui/             # LedIndicator, MechanicalPanel, MacTabWindow, ToggleSwitch
│   │   │   └── AuraSubmissionPortal.jsx  # Multi-step hardware registration portal
│   │   ├── App.jsx             # React Router routing & Lenis smooth scroll provider
│   │   ├── index.css           # Tailwind v4 @theme, custom fonts, cyber styles
│   │   └── main.jsx            # React root mount
│   ├── .env.example            # Frontend environment variable template
│   ├── package.json            # Client dependencies & scripts
│   └── vite.config.js          # Vite build config with Tailwind v4 & React plugins
│
└── server/                     # Backend Application (Node.js + Express 5)
    ├── scripts/                # Database migrations, email backfills, & test suites
    │   ├── diagnose-smtp.js    # Gmail SMTP & TLS diagnostic tool
    │   ├── send-registration-emails.js # Batch email delivery script
    │   ├── test-email.js       # SMTP test dispatch
    │   ├── test-rsvp*.js       # RSVP verification & API test suites
    │   └── update-team-taraksha.js # DB update migration script
    ├── src/
    │   ├── config/
    │   │   ├── cloudinary.js   # Cloudinary SDK credentials & upload helper
    │   │   ├── db.js           # Mongoose MongoDB connection handler
    │   │   └── env.js          # Dotenv loader
    │   ├── controllers/
    │   │   ├── registration.controller.js # Registration submissions & checks
    │   │   ├── rsvp.controller.js         # RSVP OTPs, tokens, fee engine, admin review
    │   │   └── sponsorship.controller.js  # Sponsor submissions & verifications
    │   ├── middleware/
    │   │   ├── rateLimiter.middleware.js  # Rate limiting protection
    │   │   └── upload.middleware.js       # Multer memory storage configuration
    │   ├── models/
    │   │   ├── Registration.js # Hardware submission schema & validators
    │   │   ├── Rsvp.js         # RSVP records, breakdown, & payment status
    │   │   ├── RsvpOtp.js      # 6-digit OTP schema with 10-minute TTL expiry
    │   │   └── Sponsorship.js  # Sponsor lead details & tier commitments
    │   ├── routes/
    │   │   ├── registration.routes.js
    │   │   ├── rsvp.routes.js
    │   │   └── sponsorship.routes.js
    │   ├── services/
    │   │   └── email.service.js # Nodemailer transporter, HTML templates & dispatcher
    │   └── server.js           # Express app, CORS, error middleware, port listening
    ├── .env.example            # Backend environment variable template
    └── package.json            # Server dependencies & scripts
```

---

## ⚡ Getting Started

### Prerequisites
Make sure you have installed on your local machine:
- **Node.js**: `v18.0.0` or higher (Recommended: `v20+`)
- **Package Manager**: `pnpm` (preferred) or `npm`
- **MongoDB**: Local MongoDB instance or free MongoDB Atlas URI
- **Cloudinary Account**: Cloud name, API Key, and Secret for image/PDF uploads
- **Google App Password**: 16-character App Password for Gmail SMTP automation

---

### 1. Client Setup

1. Open a terminal and navigate to the `client` directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   pnpm install
   # or: npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Set `VITE_API_URL` to point to your backend (default is `http://localhost:5000` for development).

4. Start the development server:
   ```bash
   pnpm dev
   # or: npm run dev
   ```
   The application will be running at **`http://localhost:5173`**.

5. Build for production:
   ```bash
   pnpm build
   ```

---

### 2. Server Setup

1. Open a terminal and navigate to the `server` directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   pnpm install
   # or: npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Fill in your MongoDB URI, Cloudinary credentials, and Gmail SMTP details (see [Environment Variables Guide](#-environment-variables-guide) below).

4. Start the development server with live reload:
   ```bash
   pnpm dev
   # or: npm run dev
   ```
   The backend will be live on **`http://localhost:5000`**.

5. Useful CLI Utility Commands:
   ```bash
   # Test Gmail SMTP connection
   pnpm test:email

   # Diagnose SMTP network/firewall connectivity
   node scripts/diagnose-smtp.js

   # Run comprehensive RSVP test suite
   pnpm test:rsvp

   # Backfill unsent registration confirmation emails
   pnpm send:emails
   ```

---

## 🔐 Environment Variables Guide

### Server (`server/.env`)
```ini
# Server Port
PORT=5000

# Allowed Frontend URL for CORS
FRONTEND_URL=http://localhost:5173

# MongoDB Connection String (Atlas or Local)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/aura2k26?retryWrites=true&w=majority
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/aura2k26?retryWrites=true&w=majority

# Cloudinary Storage Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email Automation (Gmail SMTP)
EMAIL_USER=aura@aliah.ac.in
EMAIL_PASS=your_16_character_google_app_password

# Authentication Secret (RSVP HMAC Token)
JWT_SECRET=your_cryptographically_secure_random_string_here
```

### Client (`client/.env`)
```ini
# Backend API Base URL
VITE_API_URL=http://localhost:5000
```

---

## 🔌 REST API Reference

### System
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Root health check message |
| `GET` | `/api/health` | Service uptime and health status |

### Registration
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/registrations` | Submit new hardware project registration (Multer multipart form-data) |
| `GET` | `/api/registrations/check?email=...&teamName=...` | Pre-submission availability check for leader email and team name |

### RSVP & Check-In
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/rsvp/verify` | Verify registration credentials and check initial RSVP state |
| `POST` | `/api/rsvp/request-otp` | Generate and email 6-digit verification code to the team leader |
| `POST` | `/api/rsvp/verify-otp` | Verify OTP and issue HMAC session token |
| `GET` | `/api/rsvp/details` | Retrieve team breakdown, fee calculation, and current status (Requires Bearer token) |
| `POST` | `/api/rsvp/submit` | Submit payment screenshot and UTR reference number (Requires Bearer token) |
| `GET` | `/api/rsvp/admin/list` | Admin review list of all RSVP submissions |
| `PATCH`| `/api/rsvp/admin/verify/:id` | Update RSVP status (`verified`, `rejected`, notes) |

### Sponsorship
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/sponsorships` | Submit new sponsorship interest with payment proof |
| `GET` | `/api/sponsorships/check?email=...` | Check if sponsor organization email already exists |

---

## 🤝 Partner & Sponsor Ecosystem

We express our deepest gratitude to the academic and industry partners empowering **AURA 2K26**:

<div align="center">
  <table>
    <tr>
      <td align="center" width="25%">
        <strong>Technical Co-Sponsor</strong><br/><br/>
        <strong>IEEE PES</strong><br/>
        <em>Power & Energy Society SBC</em>
      </td>
      <td align="center" width="25%">
        <strong>Technical Co-Sponsor</strong><br/><br/>
        <strong>The IET</strong><br/>
        <em>The Institution of Engineering and Technology</em>
      </td>
      <td align="center" width="25%">
        <strong>In Association With</strong><br/><br/>
        <strong>IIC Aliah University</strong><br/>
        <em>Institution's Innovation Council</em>
      </td>
      <td align="center" width="25%">
        <strong>Powered By</strong><br/><br/>
        <strong>Shaw Enterprise</strong> & <strong>Adarsha Academy</strong>
      </td>
    </tr>
  </table>
</div>

---

## 📬 Contact & Support

For queries, collaborations, sponsorship opportunities, or technical concerns:

- 🏛️ **Campus:** Aliah University, Newtown Campus, Kolkata 700160
- 📧 **General Inquiries:** [aura@aliah.ac.in](mailto:aura@aliah.ac.in)
- 💻 **Technical Desk:** [aura.technical@aliah.ac.in](mailto:aura.technical@aliah.ac.in)
- 🌐 **Official Portal:** [aura2k26.com](https://aura2k26.com)

---

<div align="center">
  <p><strong>AURA 2K26 · Aliah University</strong></p>
  <p><em>Build. Compete. Create. Innovate.</em></p>
  <p>© 2026 AURA Techfest Committee. All rights reserved.</p>
</div>
