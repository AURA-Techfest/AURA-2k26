import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";

import websiteBg from "../../assets/WEBSITE_BG.png";

// SVG Logos for IEEE PES, IET, and IIC for sharp display in sponsor cards
const IeeepesLogo = () => (
  <div className="flex flex-col items-center justify-center p-2 text-center select-none">
    <div className="flex items-center gap-1 mb-1">
      <svg className="w-8 h-8 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M12 2a10 10 0 0 1 10 10M12 6a6 6 0 0 1 6 6M12 10a2 2 0 0 1 2 2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 12h12M12 6v12" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <div className="text-left leading-none">
        <span className="block font-black text-black text-sm tracking-tighter font-sans">IEEE</span>
        <span className="block font-bold text-emerald-700 text-xs font-heading">PES</span>
      </div>
    </div>
    <span className="text-[9px] font-bold text-gray-700 tracking-tight leading-tight">
      Power & Energy Society®
    </span>
  </div>
);

const IetLogo = () => (
  <div className="flex flex-col items-center justify-center p-2 text-center select-none">
    <div className="flex items-center gap-2 mb-1">
      <span className="font-black text-purple-900 text-3xl tracking-tighter font-heading">IET</span>
    </div>
    <span className="text-[9px] font-bold text-gray-700 leading-tight">
      The Institution of Engineering and Technology
    </span>
  </div>
);

const IicLogo = () => (
  <div className="flex flex-col items-center justify-center p-2 text-center select-none">
    <div className="flex items-center gap-1 mb-1">
      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-black">
        IIC
      </div>
      <div className="text-left leading-none">
        <span className="block font-bold text-indigo-950 text-[10px] uppercase">INSTITUTION'S</span>
        <span className="block font-black text-rose-600 text-[10px] uppercase">INNOVATION</span>
        <span className="block font-bold text-indigo-900 text-[9px] uppercase">COUNCIL</span>
      </div>
    </div>
    <span className="text-[8px] text-gray-500 font-bold uppercase tracking-tighter">
      Ministry of Education Initiative
    </span>
  </div>
);

export default function Sponsors() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    organizationName: "",
    contactPerson: "",
    email: "",
    phone: "",
    preferredTier: "Platinum Sponsorship Package",
    message: ""
  });
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // TanStack Query useMutation for Sponsor Interest Form Submission
  const sponsorMutation = useMutation({
    mutationFn: async (payload) => {
      // Simulate or execute backend API call
      const response = await new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1200));
      return response;
    },
    onSuccess: () => {
      setSubmittedSuccess(true);
      setTimeout(() => {
        setSubmittedSuccess(false);
        setIsModalOpen(false);
        setFormData({
          organizationName: "",
          contactPerson: "",
          email: "",
          phone: "",
          preferredTier: "Platinum Sponsorship Package",
          message: ""
        });
      }, 2000);
    },
    onError: (err) => {
      alert("Submission failed. Please try again or email us directly at aura@aliah.ac.in.");
    }
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.organizationName || !formData.email || !formData.phone) {
      alert("Please fill in all mandatory contact fields.");
      return;
    }
    sponsorMutation.mutate(formData);
  };

  const currentSponsors = [
    { id: 1, component: <IeeepesLogo /> },
    { id: 2, component: <IetLogo /> },
    { id: 3, component: <IicLogo /> }
  ];

  const sponsorTiers = [
    {
      title: "PLATINUM SPONSORSHIP PACKAGE",
      price: "RS. 100000",
      features: [
        "Organization Logo will be displayed along with AURA 2026 Banner everywhere.",
        "Super-scaling antenna / banner will be installed for advertisement.",
        "A separate Kiosk with seating capacity of 4 members with respective banner for interaction with the audience and participants.",
        "A 15-minute slot on the stage to deliver an appropriate speech related to advertisement during the program to interact with the audience.",
        "The organization may display their own explicit advertisement in the LED TV / AV Screen provided.",
        "A single banner of the organization (2'X6') will be displayed.",
        "Registration kit @1,000/- INR free upto 4 delegates in the final day."
      ]
    },
    {
      title: "DIAMOND SPONSORSHIP PACKAGE",
      price: "RS. 75000",
      features: [
        "A separate Kiosk with seating capacity of 4 members with respective banner for interaction with the audience and participants.",
        "A 10-minute slot on the stage to deliver an appropriate speech related to advertisement during the program to interact with the audience.",
        "The organization may display their own explicit advertisement in the LED TV / AV Screen provided.",
        "A single banner of the organization (2'X6') will be displayed.",
        "Registration kit @1,000/- INR free upto 4 delegates in the final day."
      ]
    },
    {
      title: "GOLD SPONSORSHIP PACKAGE",
      price: "RS. 50000",
      features: [
        "A separate Kiosk with seating capacity of 4 members with respective banner for interaction with the audience and participants.",
        "The organization may display their own explicit advertisement in the LED TV / AV Screen provided.",
        "A single banner of the organization (2'X6') will be displayed.",
        "Registration kit @1,000/- INR free upto 4 delegates in the final day."
      ]
    },
    {
      title: "SILVER SPONSORSHIP PACKAGE",
      price: "RS. 25000",
      features: [
        "A single banner of the organization (2'X6') will be displayed.",
        "Registration kit @1,000/- INR free upto 4 delegates in the final day."
      ]
    },
    {
      title: "BRONZE SPONSORSHIP PACKAGE",
      price: "RS. 10000",
      features: [
        "A single banner of the organization (2'X6') will be displayed.",
        "Registration kit @1,000/- INR free upto 4 delegates in the final day."
      ]
    }
  ];

  return (
    <div
      className="min-h-screen w-full relative bg-cover bg-center overflow-x-hidden font-sans text-white select-none"
      style={{ backgroundImage: `url(${websiteBg})`, backgroundAttachment: "fixed" }}
    >
      {/* Dark Overlay for max readability matching mockup */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90 pointer-events-none z-0" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-6 flex flex-col items-center text-center">
        
        {/* NON-STICKY TOP HEADER (No sticky navbar) */}
        <header className="w-full flex items-center justify-between py-4 mb-8 border-b border-white/10">
          <Link
            to="/"
            className="px-4 py-1.5 border border-white/40 rounded-full bg-black/40 hover:bg-white hover:text-black text-white font-heading text-[10px] sm:text-xs font-black tracking-widest uppercase transition-all shadow-md"
          >
            HOME
          </Link>

          <h1 className="font-heading font-black text-xl sm:text-3xl md:text-4xl text-white tracking-widest uppercase drop-shadow-md">
            OUR SPONSORS
          </h1>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-1.5 border border-white/40 rounded-full bg-black/40 hover:bg-white hover:text-black text-white font-heading text-[10px] sm:text-xs font-black tracking-widest uppercase transition-all shadow-md cursor-pointer"
          >
            JOIN US
          </button>
        </header>

        {/* TOP SPONSORS CARDS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 w-full max-w-3xl mb-16"
        >
          {currentSponsors.map((item) => (
            <div
              key={item.id}
              className="bg-white/95 rounded-2xl p-4 sm:p-5 flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-all duration-300 min-h-[110px]"
            >
              {item.component}
            </div>
          ))}
        </motion.div>

        {/* BE OUR SPONSOR SECTION */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="w-full mb-16 flex flex-col items-center"
        >
          <h2 className="font-heading font-black text-2xl sm:text-4xl text-white tracking-widest uppercase mb-8 drop-shadow-lg">
            BE OUR SPONSOR
          </h2>

          <div className="space-y-4 w-full max-w-2xl">
            {[
              "Amplify brand visibility. We serve as a strategic platform to decrease your customer acquisition cost.",
              "Talent acquisition made easy. Have access to top tech talents for recruitments.",
              "Promote your product by encouraging participants to use it and provide feedback.",
              "Direct engagement with 5000+ enthusiastic engineering participants & innovators."
            ].map((text, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-gradient-to-r from-blue-900/60 via-purple-900/70 to-indigo-900/60 border border-white/20 rounded-xl p-4 sm:p-5 shadow-xl backdrop-blur-md text-center"
              >
                <p className="font-body text-xs sm:text-sm font-semibold text-white/90 leading-relaxed tracking-wide">
                  {text}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* SPONSORSHIP TIERS SECTION */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="w-full mb-16 flex flex-col items-center"
        >
          <h2 className="font-heading font-black text-2xl sm:text-4xl text-white tracking-widest uppercase mb-8 drop-shadow-lg">
            SPONSORSHIP TIERS
          </h2>

          <div className="space-y-6 w-full max-w-2xl">
            {sponsorTiers.map((tier, idx) => (
              <motion.div
                key={tier.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-gradient-to-r from-purple-900/70 via-indigo-950/80 to-blue-900/70 border border-white/25 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-md text-left"
              >
                <div className="border-b border-white/20 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h3 className="font-heading font-black text-sm sm:text-base text-white tracking-wider uppercase">
                    {tier.title}
                  </h3>
                  <span className="font-heading font-black text-xs sm:text-sm text-cyan-300 tracking-widest uppercase">
                    {tier.price}
                  </span>
                </div>

                <ul className="space-y-2">
                  {tier.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2 font-body text-xs text-white/80 leading-relaxed">
                      <span className="text-cyan-400 font-black shrink-0 mt-0.5">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* SPONSOR NOW BUTTON */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-10 py-3.5 border-2 border-white rounded-full bg-black/40 hover:bg-white hover:text-black text-white font-heading text-xs sm:text-sm font-black tracking-widest uppercase transition-all duration-300 shadow-[0_0_25px_rgba(255,255,255,0.3)] cursor-pointer"
          >
            SPONSOR NOW
          </button>
        </motion.div>

        {/* PREVIOUS SPONSORS SECTION (INFINITE SCROLL CAROUSEL) */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="w-full mb-16 flex flex-col items-center overflow-hidden"
        >
          <h2 className="font-heading font-black text-2xl sm:text-4xl text-white tracking-widest uppercase mb-8 drop-shadow-lg">
            PREVIOUS SPONSORS
          </h2>

          {/* Marquee Container */}
          <div className="w-full overflow-hidden relative py-4 mask-gradient">
            <div className="animate-marquee flex items-center gap-6">
              {[...currentSponsors, ...currentSponsors, ...currentSponsors, ...currentSponsors].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white/95 rounded-2xl p-4 min-w-[200px] max-w-[220px] flex items-center justify-center shadow-lg shrink-0 transform hover:scale-105 transition-all duration-200"
                >
                  {item.component}
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* FOOTER */}
        <footer className="w-full pt-8 border-t border-white/10 text-center font-body text-xs sm:text-sm text-white/60">
          <p>Contact us at <a href="mailto:aura@aliah.ac.in" className="text-white underline font-bold hover:text-purple-300">aura@aliah.ac.in</a></p>
        </footer>
      </div>

      {/* SPONSOR INTEREST FORM MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg overflow-y-auto custom-scrollbar">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-gradient-to-b from-purple-950/90 via-slate-900/95 to-black border-2 border-white/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl text-white relative my-8"
            >
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-5 text-white/60 hover:text-white font-black text-xl cursor-pointer"
              >
                ✕
              </button>

              <h3 className="font-heading font-black text-xl sm:text-2xl text-white uppercase tracking-wider text-center mb-2">
                BECOME A SPONSOR
              </h3>
              <p className="font-body text-xs text-white/60 text-center mb-6">
                Submit your details below and our Sponsorship Team will get in touch shortly.
              </p>

              {submittedSuccess ? (
                <div className="bg-emerald-950/80 border border-emerald-400 p-6 rounded-2xl text-center space-y-2">
                  <div className="text-emerald-400 text-3xl font-black mb-2">✓</div>
                  <h4 className="font-heading font-bold text-lg text-white">Sponsorship Request Received!</h4>
                  <p className="font-body text-xs text-white/80">Thank you for your interest in partnering with AURA 2K26.</p>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div>
                    <label className="block font-heading text-xs uppercase tracking-wider text-white/90 mb-1 font-bold">
                      Organization Name *
                    </label>
                    <input
                      type="text"
                      name="organizationName"
                      required
                      value={formData.organizationName}
                      onChange={handleInputChange}
                      placeholder="e.g. Acme Corporation"
                      className="w-full bg-black/60 border border-white/30 focus:border-white text-white font-body text-sm p-3 rounded-xl focus:outline-none transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-heading text-xs uppercase tracking-wider text-white/90 mb-1 font-bold">
                        Contact Person *
                      </label>
                      <input
                        type="text"
                        name="contactPerson"
                        required
                        value={formData.contactPerson}
                        onChange={handleInputChange}
                        placeholder="Full Name"
                        className="w-full bg-black/60 border border-white/30 focus:border-white text-white font-body text-sm p-3 rounded-xl focus:outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block font-heading text-xs uppercase tracking-wider text-white/90 mb-1 font-bold">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        maxLength={10}
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                        placeholder="10-digit number"
                        className="w-full bg-black/60 border border-white/30 focus:border-white text-white font-body text-sm p-3 rounded-xl focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-heading text-xs uppercase tracking-wider text-white/90 mb-1 font-bold">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="partner@company.com"
                      className="w-full bg-black/60 border border-white/30 focus:border-white text-white font-body text-sm p-3 rounded-xl focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block font-heading text-xs uppercase tracking-wider text-white/90 mb-1 font-bold">
                      Preferred Sponsorship Tier *
                    </label>
                    <select
                      name="preferredTier"
                      value={formData.preferredTier}
                      onChange={handleInputChange}
                      className="w-full bg-black/60 border border-white/30 focus:border-white text-white font-body text-sm p-3 rounded-xl focus:outline-none transition cursor-pointer"
                    >
                      {sponsorTiers.map((t) => (
                        <option key={t.title} value={t.title}>{t.title} ({t.price})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-heading text-xs uppercase tracking-wider text-white/90 mb-1 font-bold">
                      Additional Message / Requirements
                    </label>
                    <textarea
                      rows={3}
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Specify any custom requirements or questions..."
                      className="w-full bg-black/60 border border-white/30 focus:border-white text-white font-body text-sm p-3 rounded-xl focus:outline-none transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sponsorMutation.isPending}
                    className="w-full py-3.5 border-2 border-white rounded-full bg-white text-black font-heading text-xs font-black tracking-widest uppercase hover:bg-purple-300 transition shadow-lg cursor-pointer disabled:opacity-50 mt-2"
                  >
                    {sponsorMutation.isPending ? "SUBMITTING..." : "SUBMIT INTEREST"}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
