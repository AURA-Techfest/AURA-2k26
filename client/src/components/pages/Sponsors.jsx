import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";

import websiteBg from "../../assets/WEBSITE_BG.png";
import paymentQr from "../../assets/payment_qr.jpeg";
import ieeePesLogo from "../../assets/ieee_pes_logo.png";
import iicLogo from "../../assets/iic_logo.png";
import ietLogo from "../../assets/iet_logo.png";

const fetchSponsorsHeaderData = async () => {
  return {
    technicalCoSponsors: [
      { id: "tech-1", name: "IEEE PES", src: ieeePesLogo },
      { id: "tech-2", name: "IET", src: ietLogo }
    ],
    inAssociationWith: [
      { id: "assoc-1", name: "IIC ALIAH UNIVERSITY", src: iicLogo }
    ],
    poweredBy: [
      { id: "pow-1", name: "IEEE PES", src: ieeePesLogo },
      { id: "pow-2", name: "IET", src: ietLogo },
      { id: "pow-3", name: "IIC ALIAH UNIVERSITY", src: iicLogo }
    ]
  };
};

const TIER_FEES = {
  Platinum: 100000,
  Diamond: 75000,
  Gold: 50000,
  Silver: 25000,
  Bronze: 10000
};

export default function Sponsors({ initialFormOpen = false }) {
  const [isFormOpen, setIsFormOpen] = useState(initialFormOpen);

  const [formData, setFormData] = useState({
    sponsoringFor: "Platinum",
    organizationName: "",
    place: "",
    district: "",
    contactPerson: "",
    email: "",
    phone: "",
    transactionId: "",
    paymentScreenshotName: "",
    paymentScreenshotPreview: null
  });
  const [paymentScreenshotFile, setPaymentScreenshotFile] = useState(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Auto-scroll to top when opening form page
  useEffect(() => {
    if (isFormOpen) {
      window.scrollTo(0, 0);
    }
  }, [isFormOpen]);

  const handleSuccessBack = () => {
    setSubmittedSuccess(false);
    setIsFormOpen(false);
    setFormData({
      sponsoringFor: "Platinum",
      organizationName: "",
      place: "",
      district: "",
      contactPerson: "",
      email: "",
      phone: "",
      transactionId: "",
      paymentScreenshotName: "",
      paymentScreenshotPreview: null
    });
    setPaymentScreenshotFile(null);
  };

  // TanStack Query useMutation for Sponsor Interest Form Submission
  const sponsorMutation = useMutation({
    mutationFn: async (payload) => {
      const formDataToSend = new FormData();
      formDataToSend.append("sponsoringFor", payload.sponsoringFor);
      formDataToSend.append("organizationName", payload.organizationName);
      formDataToSend.append("place", payload.place);
      formDataToSend.append("district", payload.district);
      formDataToSend.append("contactPerson", payload.contactPerson);
      formDataToSend.append("email", payload.email);
      formDataToSend.append("phone", payload.phone);
      formDataToSend.append("transactionId", payload.transactionId);

      if (paymentScreenshotFile) {
        formDataToSend.append("paymentScreenshot", paymentScreenshotFile);
      }

      const response = await new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1200));
      return response;
    },
    onSuccess: () => {
      setSubmittedSuccess(true);
    },
    onError: () => {
      alert("Submission failed. Please try again or email us directly at aura@aliah.ac.in.");
    }
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
    setFormData((prev) => ({ ...prev, phone: digitsOnly }));
  };

  const handlePaymentScreenshotUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (JPG/PNG) for payment screenshot.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Payment screenshot must be smaller than 5 MB.");
      return;
    }
    setPaymentScreenshotFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        paymentScreenshotName: file.name,
        paymentScreenshotPreview: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.organizationName.trim()) { alert("Organisation Name is compulsory."); return; }
    if (!formData.contactPerson.trim()) { alert("Contact Person Name is compulsory."); return; }
    if (!formData.email.trim()) { alert("Email address is compulsory."); return; }
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email.trim())) {
      alert("Please enter a valid email address.");
      return;
    }
    if (!formData.phone.trim() || !/^[0-9]{10}$/.test(formData.phone.trim())) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }
    if (!formData.transactionId.trim()) {
      alert("Transaction ID / UTR Number is required.");
      return;
    }
    if (!paymentScreenshotFile && !formData.paymentScreenshotPreview) {
      alert("Please upload payment screenshot.");
      return;
    }

    sponsorMutation.mutate(formData);
  };

  // TanStack Query for Top Sponsors Data
  const { data: sponsorsHeaderData } = useQuery({
    queryKey: ["sponsorsHeaderData"],
    queryFn: fetchSponsorsHeaderData,
    staleTime: 1000 * 60 * 10
  });

  const technicalCoSponsors = sponsorsHeaderData?.technicalCoSponsors || [
    { id: "tech-1", name: "IEEE PES", src: ieeePesLogo },
    { id: "tech-2", name: "IET", src: ietLogo }
  ];

  const inAssociationWith = sponsorsHeaderData?.inAssociationWith || [
    { id: "assoc-1", name: "IIC ALIAH UNIVERSITY", src: iicLogo }
  ];

  const poweredBySponsors = sponsorsHeaderData?.poweredBy || [
    { id: "pow-1", name: "IEEE PES", src: ieeePesLogo },
    { id: "pow-2", name: "IET", src: ietLogo },
    { id: "pow-3", name: "IIC ALIAH UNIVERSITY", src: iicLogo }
  ];

  const currentSponsors = [
    { id: 1, name: "IEEE PES", src: ieeePesLogo },
    { id: 2, name: "IET", src: ietLogo },
    { id: 3, name: "IIC ALIAH UNIVERSITY", src: iicLogo }
  ];

  const sponsorTiers = [
    {
      title: "PLATINUM SPONSORSHIP PACKAGE",
      price: "RS. 1,00,000",
      categoryKey: "Platinum",
      features: [
        "Organisation Logo will be displayed alongwith AURA 2026 Banner everywhere.",
        "Separate big gate will be installed for the advertisement.",
        "A separate Kiosk with seating capacity of 4 members with respective banner for interaction with the audience and participants.",
        "A 15-minute slot on the stage to deliver an appropriate speech related to advertisement during the program to interact with the audience.",
        "The organisation may display their own explicit logo/advertisement in the LED TV (55\") as provided.",
        "A single banner of the organisation (2\"X6\") will be displayed.",
        "Registration kit @1,000/- INR free upto 4 delegates in the final day."
      ]
    },
    {
      title: "DIAMOND SPONSORSHIP PACKAGE",
      price: "RS. 75,000",
      categoryKey: "Diamond",
      features: [
        "A separate Kiosk with seating capacity of 4 members with respective banner for interaction with the audience and participants.",
        "A 10-minute slot on the stage to deliver an appropriate speech related to advertisement during the program to interact with the audience.",
        "The organisation may display their own explicit logo/advertisement in the LED TV (55\") as provided.",
        "A single banner of the organisation (2\"X6\") will be displayed.",
        "Registration kit @1,000/- INR free upto 4 delegates in the final day."
      ]
    },
    {
      title: "GOLD SPONSORSHIP PACKAGE",
      price: "RS. 50,000",
      categoryKey: "Gold",
      features: [
        "A separate Kiosk with seating capacity of 2 members with respective banner for interaction with the audience and participants.",
        "The organisation may display their own explicit logo/advertisement in the LED TV (55\") as provided.",
        "A single banner of the organisation (2\"X6\") will be displayed.",
        "Registration kit @1,000/- INR free upto 4 delegates in the final day."
      ]
    },
    {
      title: "SILVER SPONSORSHIP PACKAGE",
      price: "RS. 25,000",
      categoryKey: "Silver",
      features: [
        "A single banner of the organisation (2\"X6\") will be displayed.",
        "Registration kit @1,000/- INR free upto 2 delegates in the final day."
      ]
    },
    {
      title: "BRONZE SPONSORSHIP PACKAGE",
      price: "RS. 10,000",
      categoryKey: "Bronze",
      features: [
        "A single banner of the organisation (2\"X6\") will be displayed.",
        "Registration kit @1,000/- INR free upto 2 delegates in the final day."
      ]
    }
  ];

  const currentFee = TIER_FEES[formData.sponsoringFor] || 100000;

  // STANDALONE FULL-PAGE SPONSORSHIP FORM VIEW (MATCHING REGISTRATION FORM PORTAL)
  if (isFormOpen && submittedSuccess) {
    return (
      <div 
        className="min-h-screen w-full relative bg-cover bg-center overflow-y-auto custom-scrollbar py-8 px-4 sm:px-6 md:px-10 flex flex-col items-center justify-center text-white select-none selection:bg-white selection:text-black font-body"
        style={{ backgroundImage: `url(${websiteBg})`, backgroundAttachment: 'fixed' }}
      >
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70 pointer-events-none z-0" />

        {/* Top-Left Back Button */}
        <div className="absolute top-6 left-6 sm:top-8 sm:left-10 z-30">
          <button
            onClick={handleSuccessBack}
            className="px-6 py-2 border-2 border-white rounded-full bg-black/40 hover:bg-white hover:text-black text-white font-heading text-xs font-black tracking-widest uppercase transition-all duration-200 cursor-pointer shadow-lg"
          >
            BACK
          </button>
        </div>

        {/* Glassmorphic Success Card Container */}
        <div 
          className="relative z-20 w-full max-w-2xl border-2 border-white/80 rounded-2xl md:rounded-3xl backdrop-blur-xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] p-8 sm:p-12 md:p-16 flex flex-col items-center justify-center text-center my-auto"
          style={{
            background: "radial-gradient(circle at 50% 50%, rgba(119, 32, 61, 0.75), rgba(60, 86, 175, 0.75))"
          }}
        >
          {/* Header */}
          <h2 className="font-heading font-black text-white text-2xl sm:text-3xl md:text-4xl tracking-widest uppercase mb-10 sm:mb-14 drop-shadow-md">
            FORM SUBMITTED SUCCESSFULLY
          </h2>

          {/* Message Body */}
          <div className="space-y-3 font-heading font-black text-white text-base sm:text-xl md:text-2xl tracking-wider leading-relaxed uppercase drop-shadow-md">
            <p>THANK YOU FOR SUPPORTING OUR EVENT!</p>
            <p>WE TRULY APPRECIATE YOUR PARTNERSHIP</p>
          </div>
        </div>
      </div>
    );
  }

  if (isFormOpen) {
    return (
      <div 
        className="min-h-screen w-full relative bg-cover bg-center overflow-y-auto custom-scrollbar py-8 px-4 sm:px-6 md:px-10 flex flex-col items-center justify-start text-white select-none selection:bg-white selection:text-black font-body"
        style={{ backgroundImage: `url(${websiteBg})`, backgroundAttachment: 'fixed' }}
      >
        {/* Dark Overlay for optimal readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70 pointer-events-none z-0" />

        {/* Top Header Actions Bar */}
        <div className="relative z-20 w-full max-w-4xl flex items-center justify-between mb-6">
          <button
            onClick={() => setIsFormOpen(false)}
            className="px-6 py-2 border-2 border-white rounded-full bg-black/40 hover:bg-white hover:text-black text-white font-heading text-xs font-black tracking-widest uppercase transition-all duration-200 cursor-pointer shadow-lg flex items-center gap-2"
          >
            ← BACK TO SPONSORS
          </button>

          <h1 
            className="font-heading font-black text-white tracking-widest uppercase text-center drop-shadow-md hidden sm:block"
            style={{ fontSize: "clamp(1.1rem, 2.5vw, 1.8rem)" }}
          >
            SPONSORSHIP FORM
          </h1>

          <Link
            to="/"
            className="px-6 py-2 border-2 border-white rounded-full bg-black/40 hover:bg-white hover:text-black text-white font-heading text-xs font-black tracking-widest uppercase transition-all duration-200 cursor-pointer shadow-lg"
          >
            HOME
          </Link>
        </div>

        {/* Main Mirror Glass Panel Container (Static Min-Height & clamp sizing) */}
        <div 
          className="relative z-20 w-full border-2 border-white rounded-2xl md:rounded-3xl backdrop-blur-xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] mb-12 flex flex-col justify-between"
          style={{
            width: "clamp(300px, 92vw, 896px)",
            minHeight: "clamp(550px, 80vh, 760px)",
            background: "radial-gradient(circle at 0% 0%, rgba(119, 32, 61, 0.78), rgba(60, 86, 175, 0.78))",
            padding: "clamp(1.25rem, 3.5vw, 2.5rem)"
          }}
        >
          <form onSubmit={handleFormSubmit} className="space-y-6">
              
              {/* TOP TABLE: DETAILS OF SPONSORSHIP CATEGORY */}
              <div className="bg-black/40 border border-white/30 rounded-2xl p-4 sm:p-5 space-y-3 backdrop-blur-md shadow-lg">
                <h4 className="font-heading font-black text-xs sm:text-sm text-white uppercase tracking-wider text-center">
                  DETAILS OF SPONSORSHIP CATEGORY ARE AS FOLLOWS:
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-center border-collapse border border-white/20 text-xs sm:text-sm font-body">
                    <thead>
                      <tr className="bg-purple-900/70 text-white font-heading font-black uppercase border-b border-white/30">
                        <th className="p-2 border-r border-white/20">Sr. No.</th>
                        <th className="p-2 border-r border-white/20">Category</th>
                        <th className="p-2">INR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { sr: 1, category: "Platinum", inr: "100000" },
                        { sr: 2, category: "Diamond", inr: "75000" },
                        { sr: 3, category: "Gold", inr: "50000" },
                        { sr: 4, category: "Silver", inr: "25000" },
                        { sr: 5, category: "Bronze", inr: "10000" }
                      ].map((row) => (
                        <tr
                          key={row.sr}
                          onClick={() => setFormData((prev) => ({ ...prev, sponsoringFor: row.category }))}
                          className={`border-b border-white/10 transition cursor-pointer font-bold ${
                            formData.sponsoringFor === row.category
                              ? "bg-white text-black font-black"
                              : "hover:bg-white/20 text-white bg-black/20"
                          }`}
                        >
                          <td className="p-2 border-r border-white/20">{row.sr}</td>
                          <td className="p-2 border-r border-white/20 font-heading tracking-wider">{row.category}</td>
                          <td className={`p-2 font-mono ${formData.sponsoringFor === row.category ? "text-black" : "text-cyan-300"}`}>
                            ₹ {row.inr}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SPONSORING FOR CATEGORY SELECTION PILLS */}
              <div className="space-y-2">
                <label className="block font-heading text-xs sm:text-sm uppercase tracking-wider text-white font-bold">
                  Sponsoring for *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {["Platinum", "Diamond", "Gold", "Silver", "Bronze"].map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setFormData((prev) => ({ ...prev, sponsoringFor: cat }))}
                      className={`py-2.5 px-3 text-xs font-heading font-black uppercase rounded-lg border transition-all cursor-pointer ${
                        formData.sponsoringFor === cat
                          ? "bg-white text-black border-white shadow-lg scale-105"
                          : "bg-black/50 text-white border-white/30 hover:border-white hover:bg-black/70"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* ORGANISATION & PLACE / DISTRICT DETAILS */}
              <div className="space-y-4">
                <div>
                  <label className="block font-heading text-xs sm:text-sm uppercase tracking-wider text-white font-bold mb-1">
                    Organisation Name *
                  </label>
                  <input
                    type="text"
                    name="organizationName"
                    required
                    value={formData.organizationName}
                    onChange={handleInputChange}
                    placeholder="Full Organisation / Corporate Name"
                    className="w-full bg-black/50 border border-white/40 focus:border-cyan-300 text-white font-body text-sm p-3.5 rounded-xl focus:outline-none transition placeholder:text-white/50 focus:bg-black/70"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-heading text-xs sm:text-sm uppercase tracking-wider text-white font-bold mb-1">
                      Place
                    </label>
                    <input
                      type="text"
                      name="place"
                      value={formData.place}
                      onChange={handleInputChange}
                      placeholder="City / Location"
                      className="w-full bg-black/50 border border-white/40 focus:border-cyan-300 text-white font-body text-sm p-3.5 rounded-xl focus:outline-none transition placeholder:text-white/50 focus:bg-black/70"
                    />
                  </div>

                  <div>
                    <label className="block font-heading text-xs sm:text-sm uppercase tracking-wider text-white font-bold mb-1">
                      District
                    </label>
                    <input
                      type="text"
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      placeholder="District Name"
                      className="w-full bg-black/50 border border-white/40 focus:border-cyan-300 text-white font-body text-sm p-3.5 rounded-xl focus:outline-none transition placeholder:text-white/50 focus:bg-black/70"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-heading text-xs uppercase tracking-wider text-white font-bold mb-1">
                      Contact Person *
                    </label>
                    <input
                      type="text"
                      name="contactPerson"
                      required
                      value={formData.contactPerson}
                      onChange={handleInputChange}
                      placeholder="Full Name"
                      className="w-full bg-black/50 border border-white/40 focus:border-cyan-300 text-white font-body text-sm p-3.5 rounded-xl focus:outline-none transition placeholder:text-white/50 focus:bg-black/70"
                    />
                  </div>

                  <div>
                    <label className="block font-heading text-xs uppercase tracking-wider text-white font-bold mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="partner@company.com"
                      className="w-full bg-black/50 border border-white/40 focus:border-cyan-300 text-white font-body text-sm p-3.5 rounded-xl focus:outline-none transition placeholder:text-white/50 focus:bg-black/70"
                    />
                  </div>

                  <div>
                    <label className="block font-heading text-xs uppercase tracking-wider text-white font-bold mb-1">
                      Phone (10 digits) *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      maxLength={10}
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      placeholder="10-digit number"
                      className="w-full bg-black/50 border border-white/40 focus:border-cyan-300 text-white font-body text-sm p-3.5 rounded-xl focus:outline-none transition placeholder:text-white/50 focus:bg-black/70"
                    />
                  </div>
                </div>
              </div>

              {/* ONLINE UPI PAYMENT & QR VERIFICATION SECTION */}
              <div className="bg-black/40 border border-white/30 p-5 rounded-2xl space-y-4 text-center backdrop-blur-md shadow-lg">
                <h4 className="font-heading font-black text-sm text-white uppercase tracking-wider">
                  FEE PAYMENT VIA UPI QR
                </h4>
                <p className="font-body text-xs sm:text-sm text-white/90 leading-relaxed">
                  For online payment, you can directly pay through any UPI App to the QR displayed here for the selected <span className="font-heading font-black text-cyan-300">{formData.sponsoringFor}</span> package (Amount: <span className="font-mono font-black text-cyan-300">₹ {currentFee}</span>):
                </p>

                {/* IDBI UPI Payment QR Image */}
                <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl border-2 border-white max-w-xs mx-auto shadow-2xl">
                  <img
                    src={paymentQr}
                    alt="AURA 2K26 IDBI UPI Payment QR"
                    className="w-48 sm:w-56 h-auto object-contain rounded-lg"
                  />
                  <span className="text-[10px] font-heading font-black text-slate-900 uppercase tracking-widest mt-2">
                    SCAN & PAY VIA ANY UPI APP
                  </span>
                </div>

                {/* Transaction ID / UTR Input */}
                <div className="space-y-1.5 text-left pt-2">
                  <label className="block font-heading text-xs sm:text-sm uppercase tracking-wider text-white font-bold">
                    Transaction ID / UTR Number *
                  </label>
                  <input
                    type="text"
                    name="transactionId"
                    required
                    value={formData.transactionId}
                    onChange={handleInputChange}
                    placeholder="Enter 12-digit UTR / UPI Transaction ID"
                    className="w-full bg-black/50 border border-white/40 focus:border-cyan-300 text-white font-body text-sm p-3.5 rounded-xl focus:outline-none transition placeholder:text-white/50 focus:bg-black/70"
                  />
                </div>

                {/* Payment Screenshot Upload */}
                <div className="space-y-1.5 text-left">
                  <label className="block font-heading text-xs sm:text-sm uppercase tracking-wider text-white font-bold">
                    Upload Payment Screenshot (JPG/PNG, Max 5MB) *
                  </label>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handlePaymentScreenshotUpload}
                    className="w-full text-xs text-white/70 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-2 file:border-white file:text-xs file:font-heading file:font-black file:uppercase file:bg-white file:text-black cursor-pointer"
                  />
                  {formData.paymentScreenshotName && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold mt-1">
                      <span>✓ Screenshot Attached: {formData.paymentScreenshotName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* BOTTOM CONTROLS (BACK BUTTON & SUBMIT BUTTON) */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/20">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-6 py-3 border-2 border-white rounded-full bg-black/50 hover:bg-white hover:text-black text-white font-heading text-xs font-black tracking-widest uppercase transition-all shadow-lg w-full sm:w-auto text-center cursor-pointer"
                >
                  ← BACK TO SPONSORS
                </button>

                <button
                  type="submit"
                  disabled={sponsorMutation.isPending}
                  className="px-8 py-3.5 border-2 border-white rounded-full bg-white text-black hover:bg-cyan-300 font-heading text-xs sm:text-sm font-black tracking-widest uppercase transition-all shadow-xl cursor-pointer disabled:opacity-50 w-full sm:w-auto text-center"
                >
                  {sponsorMutation.isPending ? "SUBMITTING SPONSORSHIP..." : "SUBMIT SPONSORSHIP FORM"}
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }

  // MAIN SPONSORS PAGE VIEW
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
            className="px-5 py-2 border-2 border-white rounded-full bg-black/60 hover:bg-white hover:text-black text-white font-heading text-xs sm:text-sm font-black tracking-widest uppercase transition-all shadow-md"
          >
            HOME
          </Link>

          <h1 className="font-heading font-black text-2xl sm:text-4xl md:text-5xl text-white tracking-widest uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
            OUR SPONSORS
          </h1>

          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="px-5 py-2 border-2 border-white rounded-full bg-black/60 hover:bg-white hover:text-black text-white font-heading text-xs sm:text-sm font-black tracking-widest uppercase transition-all shadow-md cursor-pointer"
          >
            JOIN US
          </button>
        </motion.header>

        {/* TOP SPONSORS SECTIONS (MATCHING MOCKUP DESIGN) */}
        <div className="w-full max-w-4xl space-y-12 mb-16">
          {/* 1. TECHNICAL CO-SPONSORS */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "-40px" }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center"
          >
            <h2 className="font-heading font-black text-xl sm:text-2xl md:text-3xl text-white tracking-widest uppercase mb-6 drop-shadow-md">
              TECHNICAL CO-SPONSORS
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 w-full">
              {technicalCoSponsors.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: false }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  whileHover={{ scale: 1.05, translateY: -4 }}
                  className="bg-white rounded-3xl p-5 sm:p-6 flex items-center justify-center border-4 border-white shadow-[0_15px_35px_rgba(0,0,0,0.7)] w-44 sm:w-56 h-36 sm:h-44 transition-all duration-300"
                >
                  <img
                    src={item.src}
                    alt={item.name}
                    className="max-h-full max-w-full object-contain rounded-xl"
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* 2. IN ASSOCIATION WITH */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "-40px" }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex flex-col items-center"
          >
            <h2 className="font-heading font-black text-xl sm:text-2xl md:text-3xl text-white tracking-widest uppercase mb-6 drop-shadow-md">
              IN ASSOCIATION WITH
            </h2>
            <div className="flex items-center justify-center w-full">
              {inAssociationWith.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: false }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  whileHover={{ scale: 1.05, translateY: -4 }}
                  className="bg-white rounded-3xl p-5 sm:p-6 flex items-center justify-center border-4 border-white shadow-[0_15px_35px_rgba(0,0,0,0.7)] w-48 sm:w-60 h-38 sm:h-48 transition-all duration-300"
                >
                  <img
                    src={item.src}
                    alt={item.name}
                    className="max-h-full max-w-full object-contain rounded-xl"
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* 3. POWERED BY */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "-40px" }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col items-center"
          >
            <h2 className="font-heading font-black text-xl sm:text-2xl md:text-3xl text-white tracking-widest uppercase mb-6 drop-shadow-md">
              POWERED BY
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 w-full max-w-4xl mx-auto">
              {poweredBySponsors.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: false }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  whileHover={{ scale: 1.05, translateY: -4 }}
                  className="bg-white rounded-3xl p-5 sm:p-6 flex items-center justify-center border-4 border-white shadow-[0_15px_35px_rgba(0,0,0,0.7)] h-36 sm:h-44 transition-all duration-300"
                >
                  <img
                    src={item.src}
                    alt={item.name}
                    className="max-h-full max-w-full object-contain rounded-xl"
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* BE OUR SPONSOR SECTION */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-80px" }}
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
                viewport={{ once: false, margin: "-40px" }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="border-2 border-white rounded-2xl p-5 sm:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-md text-center hover:border-cyan-300 transition-all duration-300"
                style={{ background: "radial-gradient(circle at 0% 0%, rgba(119, 32, 61, 0.9), rgba(60, 86, 175, 0.9))" }}
              >
                <p className="font-body text-sm sm:text-base md:text-lg font-black text-white leading-relaxed tracking-wide">
                  {text}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* SPONSORSHIP TIERS SECTION */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-80px" }}
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
                viewport={{ once: false, margin: "-50px" }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="border-2 border-white rounded-3xl p-6 sm:p-8 shadow-[0_15px_40px_rgba(0,0,0,0.8)] backdrop-blur-md text-left hover:border-purple-300 transition-all duration-300"
                style={{ background: "radial-gradient(circle at 0% 0%, #77203d, #3c56af)" }}
              >
                <div className="border-b-2 border-white/30 pb-4 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="font-heading font-black text-base sm:text-lg md:text-xl text-white tracking-wider uppercase">
                    {tier.title}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, sponsoringFor: tier.categoryKey }));
                      setIsFormOpen(true);
                    }}
                    className="font-heading font-black text-sm sm:text-base md:text-lg text-cyan-300 tracking-widest uppercase bg-black/50 hover:bg-white hover:text-black px-4 py-1.5 rounded-full border border-cyan-400/50 transition cursor-pointer self-start sm:self-auto"
                  >
                    {tier.price} — SPONSOR NOW
                  </button>
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
          viewport={{ once: false }}
          transition={{ duration: 0.5 }}
          className="mb-20"
        >
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="px-12 py-4 border-2 border-white rounded-full bg-black/60 hover:bg-white hover:text-black text-white font-heading text-sm sm:text-base font-black tracking-widest uppercase transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.3)] cursor-pointer hover:scale-105"
          >
            SPONSOR NOW
          </button>
        </motion.div>

        {/* PREVIOUS SPONSORS SECTION */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="w-full mb-16 flex flex-col items-center overflow-hidden"
        >
          <h2 className="font-heading font-black text-3xl sm:text-5xl text-white tracking-widest uppercase mb-10 drop-shadow-xl">
            PREVIOUS SPONSORS
          </h2>

          <div className="w-full overflow-hidden relative py-6">
            <div className="animate-marquee flex items-center gap-8">
              {[...currentSponsors, ...currentSponsors, ...currentSponsors, ...currentSponsors].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-3xl p-5 min-w-[260px] sm:min-w-[320px] max-w-[350px] flex items-center justify-center border-4 border-white shadow-[0_10px_25px_rgba(0,0,0,0.6)] shrink-0 transform hover:scale-105 transition-all duration-200"
                >
                  <img
                    src={item.src}
                    alt={item.name}
                    className="h-32 sm:h-40 md:h-44 w-auto object-contain rounded-lg"
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
    </div>
  );
}
