import React, { useState, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";

import MacTabWindow from "./components/ui/MacTabWindow";
import ControlRoomHero from "./components/hero/ControlRoomHero";

// Register ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

function App() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [systemState, setSystemState] = useState(0);
  const [isRegistered, setIsRegistered] = useState(false);

  // Initialize Lenis smooth scroll and update scroll progress state
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0;
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll);

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    lenis.on("scroll", ScrollTrigger.update);

    return () => {
      lenis.destroy();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // 3D Card Fall and Register Button Rise Animation on Scroll
  useGSAP(() => {
    // Pin the viewport container while scrolling
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#viewport-pin-container",
        start: "top top",
        end: "bottom top",
        scrub: 0.6,
        pin: true,
        pinSpacing: true,
      },
    });

    // 1. Card recedes, tilts back, and drops
    tl.to(".mac-window-container", {
      scale: 0.5,
      rotateX: 55,
      y: 120,
      opacity: 0,
      transformOrigin: "center center",
      ease: "power1.inOut",
    }, 0)
    // 2. Register button rises from the bottom and scales in
    .fromTo(".register-btn-container", 
      {
        y: 350,
        scale: 0.7,
        opacity: 0,
      },
      {
        y: 0,
        scale: 1,
        opacity: 1,
        ease: "power2.out",
      },
      0.15
    );
  }, []);

  const handleStartCore = () => {
    if (systemState > 0) return;
    setSystemState(1); // Loaded power
    setTimeout(() => {
      setSystemState(2); // Calibrating
      setTimeout(() => {
        setSystemState(3); // Active
      }, 1000);
    }, 1000);
  };

  return (
    <div className="bg-white min-h-screen text-cyber-text relative select-none">
      {/* Clean high-tech dots background grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e2e2_1.5px,transparent_1.5px)] [background-size:28px_28px] opacity-75 pointer-events-none" />

      {/* Interactive desktop cursor target brackets */}
      {/* <CustomCursor /> */}

      {/* Main pin-scroller container (min-h-200vh gives space to scroll-scrub) */}
      <div id="viewport-pin-container" className="h-[200vh] relative w-full flex flex-col justify-start">
        
        {/* Fixed centering box */}
        <div className="absolute top-0 left-0 w-full h-screen flex flex-col items-center justify-center pointer-events-none z-10 p-4 md:p-8">
          
          {/* 3D Transform Perspective Bay */}
          <div className="w-full max-w-5xl h-[70vh] max-h-[580px] relative flex items-center justify-center" style={{ perspective: "1500px", transformStyle: "preserve-3d" }}>
            
            {/* 1. macOS style Tab Window framing the cockpit */}
            <div className="mac-window-container w-full h-full pointer-events-auto absolute inset-0 z-10">
              <MacTabWindow title="SYS_CONSOLE // COCKPIT_LAB_GATEWAY">
                <ControlRoomHero
                  onStartCore={handleStartCore}
                  systemState={systemState}
                />
              </MacTabWindow>
            </div>

            {/* 2. Floating Action Register Button (rises as card falls) */}
            <div className="register-btn-container absolute pointer-events-auto flex flex-col items-center gap-4 z-20">
              {isRegistered ? (
                <div className="text-center space-y-3 p-6 border-2 border-dashed border-cyber-teal bg-cyber-dark/95 rounded-lg max-w-md shadow-2xl">
                  <h2 className="font-display font-black text-2xl text-cyber-teal-light tracking-wider glow-teal uppercase">
                    REGISTRATION LOCKED ON
                  </h2>
                  <p className="font-mono text-[10px] text-cyber-text/80 uppercase leading-relaxed text-justify">
                    OPERATIVE MODULE MOUNTED SECURELY. COMPILING INITIAL SECTORS. PLEASE CHECK YOUR MESH TERMINALS FOR LAUNCH ENVELOPE DETAILS.
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => setIsRegistered(true)}
                  className="interactive px-12 py-5 bg-rose-600 hover:bg-rose-500 text-white font-display text-base font-black tracking-widest uppercase rounded-lg border-2 border-rose-400 shadow-[0_15px_35px_rgba(220,38,38,0.55)] hover:shadow-[0_20px_45px_rgba(220,38,38,0.8)] transition-all duration-150 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  INITIALIZE REGISTRATION
                </button>
              )}
            </div>

          </div>

        </div>

      </div>



    </div>
  );
}

export default App;
