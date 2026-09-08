import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";

import websiteBg from "../../assets/WEBSITE_BG.png";
import ieeePesLogo from "../../assets/ieee_pes_logo.jpg";
import iicLogo from "../../assets/iic_logo.jpg";
import ietLogo from "../../assets/iet_logo.jpg";

export default function Sponsors() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    organizationName: "",
    contactPerson: "",
    email: "",
    phone: "",
    preferredTier: "PLATINUM SPONSORSHIP PACKAGE",
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
          preferredTier: "PLATINUM SPONSORSHIP PACKAGE",
          message: ""
        });
      }, 2000);
    },
    onError: () => {
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
    { id: 1, name: "IEEE PES", src: ieeePesLogo },
    { id: 2, name: "IET", src: ietLogo },
    { id: 3, name: "IIC ALIAH UNIVERSITY", src: iicLogo }
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
      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/70 to-black/95 pointer-events-none z-0" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-8 flex flex-col items-center text-center">
        
        {/* NON-STICKY TOP HEADER (No sticky navbar) */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full flex items-center justify-between py-5 mb-10 border-b-2 border-white/30"
        >
          <Link
            to="/"
            className="px-5 py-2 border-2 border-white rounded-full bg-black/60 hover:bg-white hover:text-black text-white font-heading text-xs sm:text-sm font-black tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(255,255,255,0.25)]"
          >
            HOME
          </Link>

          <h1 className="font-heading font-black text-2xl sm:text-4xl md:text-5xl text-white tracking-widest uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
            OUR SPONSORS
          </h1>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2 border-2 border-white rounded-full bg-black/60 hover:bg-white hover:text-black text-white font-heading text-xs sm:text-sm font-black tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(255,255,255,0.25)] cursor-pointer"
          >
            JOIN US
          </button>
        </motion.header>

        {/* TOP SPONSORS LOGO CARDS (With Highlighted White Borders & JPG Logos) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.7 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 w-full max-w-4xl mb-16"
        >
          {currentSponsors.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.05, translateY: -4 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="bg-white rounded-3xl p-4 sm:p-5 flex items-center justify-center border-4 border-white shadow-[0_15px_35px_rgba(0,0,0,0.7),0_0_20px_rgba(255,255,255,0.4)] min-h-[140px] sm:min-h-[160px]"
            >
              <img
                src={item.src}
                alt={item.name}
                className="max-h-28 sm:max-h-32 w-auto object-contain rounded-xl"
              />
            </motion.div>
          ))}
        </motion.div>

        {/* BE OUR SPONSOR SECTION (Highlighted White Borders & Bold Text & Scroll Animation) */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="w-full mb-16 flex flex-col items-center"
        >
          <h2 className="font-heading font-black text-3xl sm:text-5xl text-white tracking-widest uppercase mb-10 drop-shadow-xl">
            BE OUR SPONSOR
          </h2>

          <div className="space-y-5 w-full max-w-3xl">
            {[
              "Amplify brand visibility. We serve as a strategic platform to decrease your customer acquisition cost.",
              "Talent acquisition made easy. Have access to top tech talents for recruitments.",
              "Promote your product by encouraging participants to use it and provide feedback.",
              "Direct engagement with 5000+ enthusiastic engineering participants & innovators."
            ].map((text, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="bg-gradient-to-r from-blue-950/80 via-purple-950/90 to-indigo-950/80 border-2 border-white rounded-2xl p-5 sm:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.6),0_0_15px_rgba(255,255,255,0.2)] backdrop-blur-md text-center hover:border-cyan-300 transition-all duration-300"
              >
                <p className="font-body text-sm sm:text-base md:text-lg font-black text-white leading-relaxed tracking-wide">
                  {text}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* SPONSORSHIP TIERS SECTION (Highlighted White Borders & Larger Bold Font) */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="w-full mb-16 flex flex-col items-center"
        >
          <h2 className="font-heading font-black text-3xl sm:text-5xl text-white tracking-widest uppercase mb-10 drop-shadow-xl">
            SPONSORSHIP TIERS
          </h2>

          <div className="space-y-8 w-full max-w-3xl">
            {sponsorTiers.map((tier, idx) => (
              <motion.div
                key={tier.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="bg-gradient-to-r from-purple-950/90 via-slate-950/95 to-blue-950/90 border-2 border-white rounded-3xl p-6 sm:p-8 shadow-[0_15px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(255,255,255,0.25)] backdrop-blur-md text-left hover:border-purple-300 transition-all duration-300"
              >
                <div className="border-b-2 border-white/30 pb-4 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="font-heading font-black text-base sm:text-lg md:text-xl text-white tracking-wider uppercase">
                    {tier.title}
                  </h3>
                  <span className="font-heading font-black text-sm sm:text-base md:text-lg text-cyan-300 tracking-widest uppercase bg-black/50 px-4 py-1.5 rounded-full border border-cyan-400/50">
                    {tier.price}
                  </span>
                </div>

                <ul className="space-y-3">
                  {tier.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-3 font-body text-xs sm:text-sm md:text-base font-bold text-white/95 leading-relaxed">
                      <span className="text-cyan-400 font-black text-sm sm:text-base shrink-0 mt-0.5">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* SPONSOR NOW CTA BUTTON */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-20"
        >
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-12 py-4 border-2 border-white rounded-full bg-black/60 hover:bg-white hover:text-black text-white font-heading text-sm sm:text-base font-black tracking-widest uppercase transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.4)] cursor-pointer hover:scale-105"
          >
            SPONSOR NOW
          </button>
        </motion.div>

        {/* PREVIOUS SPONSORS SECTION (INFINITE SCROLL CAROUSEL WITH HIGHLIGHTED WHITE BORDERS) */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="w-full mb-16 flex flex-col items-center overflow-hidden"
        >
          <h2 className="font-heading font-black text-3xl sm:text-5xl text-white tracking-widest uppercase mb-10 drop-shadow-xl">
            PREVIOUS SPONSORS
          </h2>

          {/* Marquee Container */}
          <div className="w-full overflow-hidden relative py-6">
            <div className="animate-marquee flex items-center gap-8">
              {[...currentSponsors, ...currentSponsors, ...currentSponsors, ...currentSponsors].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-3xl p-4 sm:p-5 min-w-[220px] sm:min-w-[250px] max-w-[260px] flex items-center justify-center border-4 border-white shadow-[0_10px_25px_rgba(0,0,0,0.6),0_0_15px_rgba(255,255,255,0.3)] shrink-0 transform hover:scale-105 transition-all duration-200"
                >
                  <img
                    src={item.src}
                    alt={item.name}
                    className="max-h-24 sm:max-h-28 w-auto object-contain rounded-lg"
                  />
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* FOOTER */}
        <footer className="w-full pt-8 border-t-2 border-white/20 text-center font-body text-sm sm:text-base font-bold text-white/70">
          <p>Contact us at <a href="mailto:aura@aliah.ac.in" className="text-white underline font-black hover:text-purple-300">aura@aliah.ac.in</a></p>
        </footer>
      </div>

      {/* SPONSOR INTEREST FORM MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl overflow-y-auto custom-scrollbar">
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.88, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-gradient-to-b from-purple-950 via-slate-950 to-black border-4 border-white rounded-3xl p-6 sm:p-9 max-w-xl w-full shadow-[0_0_50px_rgba(255,255,255,0.3)] text-white relative my-8"
            >
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute top-5 right-6 text-white/60 hover:text-white font-black text-2xl cursor-pointer"
              >
                ✕
              </button>

              <h3 className="font-heading font-black text-2xl sm:text-3xl text-white uppercase tracking-wider text-center mb-2">
                BECOME A SPONSOR
              </h3>
              <p className="font-body text-xs sm:text-sm font-bold text-white/70 text-center mb-6">
                Submit your details below and our Sponsorship Team will get in touch shortly.
              </p>

              {submittedSuccess ? (
                <div className="bg-emerald-950/90 border-2 border-emerald-400 p-8 rounded-2xl text-center space-y-3">
                  <div className="text-emerald-400 text-4xl font-black mb-2">✓</div>
                  <h4 className="font-heading font-black text-xl text-white">Sponsorship Request Received!</h4>
                  <p className="font-body text-sm font-bold text-white/90">Thank you for your interest in partnering with AURA 2K26.</p>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div>
                    <label className="block font-heading text-xs sm:text-sm uppercase tracking-wider text-white mb-1.5 font-black">
                      Organization Name *
                    </label>
                    <input
                      type="text"
                      name="organizationName"
                      required
                      value={formData.organizationName}
                      onChange={handleInputChange}
                      placeholder="e.g. Acme Corporation"
                      className="w-full bg-black/70 border-2 border-white/50 focus:border-white text-white font-body text-sm sm:text-base font-bold p-3.5 rounded-xl focus:outline-none transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-heading text-xs sm:text-sm uppercase tracking-wider text-white mb-1.5 font-black">
                        Contact Person *
                      </label>
                      <input
                        type="text"
                        name="contactPerson"
                        required
                        value={formData.contactPerson}
                        onChange={handleInputChange}
                        placeholder="Full Name"
                        className="w-full bg-black/70 border-2 border-white/50 focus:border-white text-white font-body text-sm font-bold p-3.5 rounded-xl focus:outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block font-heading text-xs sm:text-sm uppercase tracking-wider text-white mb-1.5 font-black">
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
                        className="w-full bg-black/70 border-2 border-white/50 focus:border-white text-white font-body text-sm font-bold p-3.5 rounded-xl focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-heading text-xs sm:text-sm uppercase tracking-wider text-white mb-1.5 font-black">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="partner@company.com"
                      className="w-full bg-black/70 border-2 border-white/50 focus:border-white text-white font-body text-sm font-bold p-3.5 rounded-xl focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block font-heading text-xs sm:text-sm uppercase tracking-wider text-white mb-1.5 font-black">
                      Preferred Sponsorship Tier *
                    </label>
                    <select
                      name="preferredTier"
                      value={formData.preferredTier}
                      onChange={handleInputChange}
                      className="w-full bg-black/80 border-2 border-white/50 focus:border-white text-white font-body text-sm font-bold p-3.5 rounded-xl focus:outline-none transition cursor-pointer"
                    >
                      {sponsorTiers.map((t) => (
                        <option key={t.title} value={t.title}>{t.title} ({t.price})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-heading text-xs sm:text-sm uppercase tracking-wider text-white mb-1.5 font-black">
                      Additional Message / Requirements
                    </label>
                    <textarea
                      rows={3}
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Specify any custom requirements or questions..."
                      className="w-full bg-black/70 border-2 border-white/50 focus:border-white text-white font-body text-sm font-bold p-3.5 rounded-xl focus:outline-none transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sponsorMutation.isPending}
                    className="w-full py-4 border-2 border-white rounded-full bg-white text-black font-heading text-xs sm:text-sm font-black tracking-widest uppercase hover:bg-purple-300 transition shadow-[0_0_20px_rgba(255,255,255,0.4)] cursor-pointer disabled:opacity-50 mt-3"
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
