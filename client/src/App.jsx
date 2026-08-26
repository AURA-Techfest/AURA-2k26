import React, { useState, useEffect } from "react";
import Lenis from "lenis";

import Navbar from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";
import HomeSections from "./components/sections/HomeSections";
import AuraSubmissionPortal from "./components/AuraSubmissionPortal";

function App() {
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  // Initialize Lenis smooth scroll
  useEffect(() => {
    if (showRegistrationForm) return;

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

  // When registration opens, render the full portal page with back button support
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

export default App;