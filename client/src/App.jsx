import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Lenis from "lenis";

import Navbar from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";
import HomeSections from "./components/sections/HomeSections";
import AuraSubmissionPortal from "./components/AuraSubmissionPortal";
import Sponsors from "./components/pages/Sponsors";
import People from "./components/pages/People";
import GalleryDetail from "./components/pages/GalleryDetail";

function HomePage({ showRegistrationForm, setShowRegistrationForm }) {
  // Initialize Lenis smooth scroll for desktop viewports
  useEffect(() => {
    if (showRegistrationForm) return;

    const isTouchMobile = window.innerWidth < 768 || ('ontouchstart' in window && window.navigator.maxTouchPoints > 0);
    if (isTouchMobile) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, [showRegistrationForm]);

  if (showRegistrationForm) {
    return <AuraSubmissionPortal onBack={() => setShowRegistrationForm(false)} />;
  }

  return (
    <div className="bg-[#0b0909] min-h-screen text-white relative select-none">
      {/* High-tech dots background grid */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1.5px,transparent_1.5px)] [background-size:28px_28px] pointer-events-none z-10" />

      {/* Main Sticky Navbar */}
      <Navbar onRegisterClick={() => setShowRegistrationForm(true)} />

      {/* Left Sidebar */}
      <Sidebar />

      {/* Single Page Layout Sections */}
      <HomeSections onRegisterClick={() => setShowRegistrationForm(true)} />
    </div>
  );
}

function App() {
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              showRegistrationForm={showRegistrationForm}
              setShowRegistrationForm={setShowRegistrationForm}
            />
          }
        />
        <Route
          path="/sponsors"
          element={
            showRegistrationForm ? (
              <AuraSubmissionPortal onBack={() => setShowRegistrationForm(false)} />
            ) : (
              <Sponsors onRegisterClick={() => setShowRegistrationForm(true)} />
            )
          }
        />
        <Route
          path="/sponsors/form"
          element={
            showRegistrationForm ? (
              <AuraSubmissionPortal onBack={() => setShowRegistrationForm(false)} />
            ) : (
              <Sponsors initialFormOpen={true} onRegisterClick={() => setShowRegistrationForm(true)} />
            )
          }
        />
        <Route
          path="/sponsorship-form"
          element={
            showRegistrationForm ? (
              <AuraSubmissionPortal onBack={() => setShowRegistrationForm(false)} />
            ) : (
              <Sponsors initialFormOpen={true} onRegisterClick={() => setShowRegistrationForm(true)} />
            )
          }
        />
        <Route
          path="/people"
          element={
            showRegistrationForm ? (
              <AuraSubmissionPortal onBack={() => setShowRegistrationForm(false)} />
            ) : (
              <People onRegisterClick={() => setShowRegistrationForm(true)} />
            )
          }
        />
        <Route
          path="/gallery/:year"
          element={
            showRegistrationForm ? (
              <AuraSubmissionPortal onBack={() => setShowRegistrationForm(false)} />
            ) : (
              <GalleryDetail onRegisterClick={() => setShowRegistrationForm(true)} />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;