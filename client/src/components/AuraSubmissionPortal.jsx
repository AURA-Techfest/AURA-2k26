import React, { useState, useEffect, useMemo } from 'react';
const API_URL = "http://localhost:5000/api/registrations";

const STORAGE_KEY = 'aura_2026_hardware_submission_draft';
const STORAGE_STEP_KEY = 'aura_2026_hardware_submission_step';

const CATEGORIES = [
  "Robotics", "Embedded Systems", "IoT & Smart Devices", "Electronics & Communication",
  "Electrical Systems", "Mechanical Systems", "Mechatronics", "Automation & Control",
  "AI-Enabled Hardware", "Biomedical / Healthcare Devices", "Assistive Technology",
  "Renewable Energy / Clean Technology", "Smart Agriculture", "Smart Mobility / Transportation",
  "Drone / Autonomous Systems", "Environmental Technology", "Industrial / Manufacturing Technology",
  "Safety & Security Systems", "Other"
];

const PROTOTYPE_TYPES = [
  "Standalone Hardware Device", "Robotic System", "Embedded System", "IoT Device",
  "Smart Product", "Electromechanical System", "Wearable Device", "Autonomous System",
  "Hardware + Software System", "Other"
];

const WORKING_STATUSES = [
  "Fully functional and ready for live demonstration",
  "Functional but requires minor setup/calibration",
  "Functional under controlled conditions"
];

const BENEFICIARIES = [
  "General Public", "Industry", "Healthcare", "Agriculture", "Transportation",
  "Education", "Government / Public Services", "Rural Communities", "Urban Communities",
  "Persons with Disabilities", "Other"
];

const POWER_SOURCES = [
  "Battery", "USB", "DC Power Supply", "AC Supply", "Solar", "Other"
];

const SAFETY_HAZARDS = [
  "High Voltage", "High Current", "High Temperature", "Moving / Rotating Machinery",
  "Sharp Mechanical Components", "High-Power Batteries", "Laser / Intense Light",
  "Chemicals", "Pressurized Systems", "Drone / Flying Equipment", "Fire / Combustion",
  "Water Near Electrical Equipment", "None of the Above"
];

const INITIAL_FORM_DATA = {
  // Section 1: Eligibility & Team Details
  teamSize: '4 Members',
  hasWorkingPrototype: 'Yes, fully working',
  teamAffiliation: 'All members are from Aliah University',
  aliahMembersCount: 3,
  otherMembersCount: 0,
  teamName: '',
  teamLeaderName: '',
  teamLeaderEmail: '',
  teamLeaderPhone: '',
  teamMembersDetails: '',

  // Section 2: Hardware Project Profile
  projectTitle: '',
  categories: [],
  prototypeType: 'Standalone Hardware Device',
  workingStatus: 'Fully functional and ready for live demonstration',

  // Section 3: The Problem & Innovation
  problemStatement: '',
  solutionDescription: '',
  innovationDetails: '',
  beneficiaries: [],

  // Section 4: Technical Details
  workingPrinciple: '',
  hardwareComponents: '',
  usesAI: 'No',
  usesIoT: 'No',
  powerSource: 'Battery',

  // Section 5: Real-World Potential
  realWorldImpact: '',
  deployableSystem: 'Yes',
  developmentCost: '',
  whyWorthSeeing: '',

  // Section 6: Safety
  safetyHazards: ['None of the Above'],
  safetyPrecautions: '',
  requiresSupervision: 'No',

  // Section 7: Originality
  developedByTeam: 'Yes',
  previouslyExhibited: 'No',
  exhibitionDetails: '',

  // Section 8: Registration Fee
  transactionId: '',
  paymentScreenshotPreview: null,

  // Section 9: Declarations
  declWorkingPrototype: false,
  declOriginality: false,
  declSafetyRules: false,
  declMediaPermission: false,
  declFinalConfirmation: false,
};

export default function AuraSubmissionPortal({ onBack }) {
  // 1. Initialize formData from localStorage
  const [formData, setFormData] = useState(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      return savedData ? { ...INITIAL_FORM_DATA, ...JSON.parse(savedData) } : INITIAL_FORM_DATA;
    } catch (err) {
      console.error("Failed to load draft from localStorage:", err);
      return INITIAL_FORM_DATA;
    }
  });

  // 2. Initialize current step from localStorage
  const [currentStep, setCurrentStep] = useState(() => {
    try {
      const savedStep = localStorage.getItem(STORAGE_STEP_KEY);
      return savedStep ? Number(savedStep) : 1;
    } catch {
      return 1;
    }
  });

  const [submitted, setSubmitted] = useState(false);
  const [draftSavedToast, setDraftSavedToast] = useState(false);

  // 3. Persist form data updates automatically to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      setDraftSavedToast(true);
      const timer = setTimeout(() => setDraftSavedToast(false), 1200);
      return () => clearTimeout(timer);
    } catch (err) {
      console.error("Failed to save draft to localStorage:", err);
    }
  }, [formData]);

  // 4. Persist step navigation
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_STEP_KEY, currentStep.toString());
    } catch (err) {
      console.error("Failed to save step to localStorage:", err);
    }
  }, [currentStep]);

  // Dynamic fee calculation: 400 INR applies when 50% or more members are external
  const isExternalFeeApplicable = useMemo(() => {
    const total = Number(formData.aliahMembersCount) + Number(formData.otherMembersCount);
    if (total === 0) return false;
    return (Number(formData.otherMembersCount) / total) >= 0.5;
  }, [formData.aliahMembersCount, formData.otherMembersCount]);

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Team Affiliation Auto-Adjustment Logic
  const handleAffiliationChange = (affiliation) => {
    const numericTeamSize = parseInt(formData.teamSize) || 3;
    if (affiliation === "All members are from Aliah University") {
      setFormData((prev) => ({
        ...prev,
        teamAffiliation: affiliation,
        aliahMembersCount: numericTeamSize,
        otherMembersCount: 0,
      }));
    } else if (affiliation === "All members are from another institution") {
      setFormData((prev) => ({
        ...prev,
        teamAffiliation: affiliation,
        aliahMembersCount: 0,
        otherMembersCount: numericTeamSize,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        teamAffiliation: affiliation,
      }));
    }
  };

  const handleTeamSizeChange = (size) => {
    const numericSize = parseInt(size) || 3;
    setFormData((prev) => {
      let aliah = prev.aliahMembersCount;
      let other = prev.otherMembersCount;

      if (prev.teamAffiliation === "All members are from Aliah University") {
        aliah = numericSize;
        other = 0;
      } else if (prev.teamAffiliation === "All members are from another institution") {
        aliah = 0;
        other = numericSize;
      }
      return {
        ...prev,
        teamSize: size,
        aliahMembersCount: aliah,
        otherMembersCount: other,
      };
    });
  };

  const toggleArrayItem = (key, item) => {
    setFormData((prev) => {
      const exists = prev[key].includes(item);
      const updated = exists ? prev[key].filter((i) => i !== item) : [...prev[key], item];
      return { ...prev, [key]: updated };
    });
  };

const handleFileUpload = (e) => {
  const file = e.target.files[0];

  if (file) {
    const reader = new FileReader();

    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        paymentScreenshotPreview: reader.result,
        paymentScreenshotFile: file,
      }));
    };

    reader.readAsDataURL(file);
  }
};


  const countWords = (str) => (str && str.trim() ? str.trim().split(/\s+/).length : 0);

  // Free Step Navigation Handlers
  const handleStepJump = (stepNumber) => {
    setCurrentStep(stepNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 4));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetDraft = () => {
    if (window.confirm("Are you sure you want to clear your saved draft and reset the form?")) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_STEP_KEY);
      setFormData(INITIAL_FORM_DATA);
      setCurrentStep(1);
    }
  };

 const handleSubmit = async (e) => {
  e.preventDefault();

  if (
    !formData.declWorkingPrototype ||
    !formData.declOriginality ||
    !formData.declSafetyRules ||
    !formData.declMediaPermission ||
    !formData.declFinalConfirmation
  ) {
    alert("Please review and accept all 5 mandatory declarations in Section 9.");
    return;
  }

  try {
    const formDataToSend = new FormData();

    formDataToSend.append("teamName", formData.teamName);
    
    const membersArray = formData.teamMembersDetails
  .split("\n")
  .map((member) => member.trim())
  .filter(Boolean);

console.log("Members being sent:", membersArray);
console.log("Member count:", membersArray.length);

formDataToSend.append(
  "members",
  JSON.stringify(membersArray)
);


    formDataToSend.append("college", formData.teamAffiliation);

    formDataToSend.append("phone", formData.teamLeaderPhone);

    formDataToSend.append("email", formData.teamLeaderEmail);

    if (formData.paymentScreenshotFile) {
      formDataToSend.append(
        "paymentScreenshot",
        formData.paymentScreenshotFile
      );
    }

    console.log("🚀 Sending registration...");

   for (const [key, value] of formDataToSend.entries()) {
  console.log(key, value);
   }


    const response = await fetch(API_URL, {
      method: "POST",
      body: formDataToSend,
    });

    const result = await response.json();

    console.log("📥 Backend response:", result);

    if (!response.ok) {
      throw new Error(result.message || "Registration failed");
    }

    console.log("🎉 Registration successful!");

    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_STEP_KEY);

    setSubmitted(true);
  } catch (error) {
    console.error("❌ Registration failed:", error);
    alert(error.message);
  }
};


  if (submitted) {
    return (
      <div className="min-h-screen bg-[#ABD2FA] flex items-center justify-center p-6 text-[#091540] font-poppins">
        <div className="max-w-xl w-full bg-[#FFFFFF] border-2 border-[#091540] rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-[#1B2CC1] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-900/30">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#1B2CC1] mb-2 block font-poppins">Application Received</span>
          <h1 className="text-3xl font-extrabold font-inter text-[#091540] mb-4">YOU'RE IN. NOW BUILD BEYOND.</h1>
          <p className="text-sm text-[#091540]/90 leading-relaxed mb-6 font-poppins">
            Thank you for submitting your working hardware project to <strong>AURA 2026</strong> (The Annual Technical Festival of Aliah University, 19–20 November 2026)[cite: 1, 4].
          </p>
          <div className="bg-[#F8FAFC] border border-[#091540]/20 rounded-xl p-4 text-xs text-[#64748B] mb-8 leading-relaxed font-poppins">
            Your submission has been received by the AURA 2026 Project Evaluation Committee[cite: 1, 4]. Please note: Submission does not guarantee selection[cite: 1, 4]. Shortlisted teams will be contacted separately regarding project evaluation, exhibition, and live demonstration[cite: 1, 4].
          </div>
          <p className="font-inter font-bold tracking-widest text-xs text-[#1B2CC1] mb-6">DISCOVER • DESIGN • DISRUPT</p>
          <button
            onClick={onBack}
            className="bg-[#1B2CC1] hover:bg-[#1B2CC1]/90 text-white font-poppins font-semibold text-xs px-6 py-2.5 rounded-lg transition shadow-md cursor-pointer"
          >
            ← Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ABD2FA] text-[#091540] font-poppins pb-20 selection:bg-[#1B2CC1] selection:text-white">
      {/* Top Header Bar */}
      <header className="border-b-2 border-[#091540] bg-[#ABD2FA]/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="text-xs font-poppins font-semibold text-[#1B2CC1] hover:underline flex items-center gap-1.5 transition cursor-pointer"
            >
              ← Back to Main Page
            </button>
            {draftSavedToast && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-poppins text-emerald-800 bg-emerald-100 border border-emerald-400 px-2 py-0.5 rounded-md font-medium">
                ✓ Draft auto-saved
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleResetDraft}
              className="text-[11px] font-poppins font-medium text-[#64748B] hover:text-rose-600 transition cursor-pointer"
              title="Clear stored data"
            >
              Clear Draft
            </button>
            <span className="text-xs font-poppins font-semibold px-3 py-1 rounded-md bg-[#7692FF] border border-[#091540] text-white">
              Fee Status: {isExternalFeeApplicable ? "₹400 (External Team)" : "₹0 (Aliah Subsidized)"}
            </span>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <div className="max-w-4xl mx-auto px-6 pt-8 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#7692FF] border border-[#091540] text-xs font-semibold text-white mb-3 font-poppins">
          AURA 2026 • 19–20 November 2026
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-inter text-[#091540] tracking-tight">
          Working Hardware Project Submission
        </h1>
        <p className="text-xs font-poppins text-[#091540]/80 mt-1 font-medium">The Annual Technical Festival of Aliah University • DISCOVER DESIGN DISRUPT</p>
      </div>

      {/* Multi-Step Wizard Indicator */}
      <div className="max-w-4xl mx-auto px-6 mt-8">
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-poppins font-semibold">
          {[
            { id: 1, label: "1. Team & Eligibility" },
            { id: 2, label: "2. Project Profile" },
            { id: 3, label: "3. Technical Details" },
            { id: 4, label: "4. Safety & Payment" }
          ].map((step) => (
            <button
              key={step.id}
              type="button"
              onClick={() => handleStepJump(step.id)}
              className={`p-3 rounded-xl border-2 transition-all cursor-pointer font-poppins ${
                currentStep === step.id
                  ? 'bg-[#1B2CC1] text-white border-[#091540] shadow-lg shadow-indigo-900/20'
                  : currentStep > step.id
                  ? 'bg-[#7692FF] text-white border-[#091540] hover:bg-[#7692FF]/90'
                  : 'bg-[#F8FAFC] text-[#64748B] border-[#091540]/30 hover:border-[#091540] hover:text-[#091540]'
              }`}
            >
              {step.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form Card Container */}
      <main className="max-w-4xl mx-auto px-6 mt-6">
        <div className="bg-[#FFFFFF] border-2 border-[#091540] rounded-2xl shadow-xl overflow-hidden">
          
          {/* STEP 1: SECTION 1 (ELIGIBILITY & TEAM DETAILS) */}
          {currentStep === 1 && (
            <div className="p-8 space-y-6">
              <div className="border-b-2 border-[#091540]/20 pb-4">
                <h2 className="text-xl font-bold font-inter text-[#091540]">SECTION 1: ELIGIBILITY & TEAM DETAILS</h2>
                <p className="text-xs font-poppins text-[#64748B] mt-1">Only working physical hardware prototypes will be considered (Team size: 2-4 members)[cite: 1, 4].</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-poppins font-semibold text-[#091540] uppercase mb-2">1. Team Size *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["2 Members", "3 Members", "4 Members"].map((size) => (
                      <button
                        type="button"
                        key={size}
                        onClick={() => handleTeamSizeChange(size)}
                        className={`py-2 px-3 text-xs font-poppins font-semibold rounded-lg border-2 transition cursor-pointer ${
                          formData.teamSize === size
                            ? 'bg-[#1B2CC1] text-white border-[#091540] shadow-md'
                            : 'bg-[#F8FAFC] text-[#091540] border-[#091540]/30 hover:border-[#091540]'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-poppins font-semibold text-[#091540] uppercase mb-2">2. Working Physical Prototype? *</label>
                  <select
                    name="hasWorkingPrototype"
                    value={formData.hasWorkingPrototype}
                    onChange={handleTextChange}
                    className="w-full bg-[#F8FAFC] border-2 border-[#091540]/30 rounded-lg px-3.5 py-2 text-xs font-poppins text-[#091540] focus:outline-none focus:border-[#1B2CC1]"
                  >
                    <option value="Yes, fully working">Yes, fully working</option>
                    <option value="Yes, working with minor limitations">Yes, working with minor limitations</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-poppins font-semibold text-[#091540] uppercase mb-2">3. Team Affiliation *</label>
                <div className="space-y-2">
                  {[
                    "All members are from Aliah University",
                    "All members are from another institution",
                    "Mixed team: Aliah University + other institution(s)"
                  ].map((affiliation) => (
                    <button
                      type="button"
                      key={affiliation}
                      onClick={() => handleAffiliationChange(affiliation)}
                      className={`w-full text-left py-2.5 px-4 rounded-lg border-2 text-xs font-poppins font-medium transition cursor-pointer ${
                        formData.teamAffiliation === affiliation
                          ? 'bg-[#1B2CC1] text-white border-[#091540] shadow-md'
                          : 'bg-[#F8FAFC] text-[#091540] border-[#091540]/30 hover:border-[#091540]'
                      }`}
                    >
                      {affiliation}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of Members Button Lists: 0, 1, 2, 3, 4 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div>
                  <label className="block text-xs font-poppins font-semibold text-[#091540] uppercase mb-2">
                    4. Number of Aliah University Members *
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[0, 1, 2, 3, 4].map((num) => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => setFormData({ ...formData, aliahMembersCount: num })}
                        className={`py-2 text-xs font-poppins font-bold rounded-lg border-2 transition cursor-pointer text-center ${
                          Number(formData.aliahMembersCount) === num
                            ? 'bg-[#1B2CC1] text-white border-[#091540] shadow-md'
                            : 'bg-[#F8FAFC] text-[#091540] border-[#091540]/30 hover:border-[#091540]'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-poppins font-semibold text-[#091540] uppercase mb-2">
                    5. Number of Members from Other Institutions *
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[0, 1, 2, 3, 4].map((num) => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => setFormData({ ...formData, otherMembersCount: num })}
                        className={`py-2 text-xs font-poppins font-bold rounded-lg border-2 transition cursor-pointer text-center ${
                          Number(formData.otherMembersCount) === num
                            ? 'bg-[#1B2CC1] text-white border-[#091540] shadow-md'
                            : 'bg-[#F8FAFC] text-[#091540] border-[#091540]/30 hover:border-[#091540]'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t-2 border-[#091540]/10">
                <div>
                  <label className="block text-xs font-poppins font-semibold text-[#091540] uppercase mb-1">6. Team Name *</label>
                  <input
                    type="text"
                    name="teamName"
                    value={formData.teamName}
                    onChange={handleTextChange}
                    placeholder="Enter your team name"
                    className="w-full bg-[#F8FAFC] border-2 border-[#091540]/30 rounded-lg px-3.5 py-2 text-xs font-poppins text-[#091540] focus:outline-none focus:border-[#1B2CC1]"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-poppins font-semibold text-[#091540] uppercase mb-1">7. Team Leader Name *</label>
                    <input
                      type="text"
                      name="teamLeaderName"
                      value={formData.teamLeaderName}
                      onChange={handleTextChange}
                      className="w-full bg-[#F8FAFC] border-2 border-[#091540]/30 rounded-lg px-3.5 py-2 text-xs font-poppins text-[#091540] focus:outline-none focus:border-[#1B2CC1]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-poppins font-semibold text-[#091540] uppercase mb-1">8. Leader Email *</label>
                    <input
                      type="email"
                      name="teamLeaderEmail"
                      value={formData.teamLeaderEmail}
                      onChange={handleTextChange}
                      className="w-full bg-[#F8FAFC] border-2 border-[#091540]/30 rounded-lg px-3.5 py-2 text-xs font-poppins text-[#091540] focus:outline-none focus:border-[#1B2CC1]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-poppins font-semibold text-[#091540] uppercase mb-1">9. Leader Phone / WhatsApp *</label>
                    <input
                      type="tel"
                      name="teamLeaderPhone"
                      value={formData.teamLeaderPhone}
                      onChange={handleTextChange}
                      className="w-full bg-[#F8FAFC] border-2 border-[#091540]/30 rounded-lg px-3.5 py-2 text-xs font-poppins text-[#091540] focus:outline-none focus:border-[#1B2CC1]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-poppins font-semibold text-[#091540] uppercase mb-1">
                    10. Team Member Details (Full Name | Institution | Department | Year | Contact) *
                  </label>
                  <textarea
                    rows={3}
                    name="teamMembersDetails"
                    value={formData.teamMembersDetails}
                    onChange={handleTextChange}
                    placeholder="e.g. John Doe | Aliah University | CSE | 2nd Year | +91 9876543210"
                    className="w-full bg-[#F8FAFC] border-2 border-[#091540]/30 rounded-lg p-3 text-xs font-poppins text-[#091540] focus:outline-none focus:border-[#1B2CC1]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SECTIONS 2 & 3 (PROJECT PROFILE & INNOVATION) */}
          {currentStep === 2 && (
            <div className="p-8 space-y-6">
              <div className="border-b-2 border-[#091540]/20 pb-4">
                <h2 className="text-xl font-bold font-inter text-[#091540]">SECTION 2 & 3: HARDWARE PROJECT PROFILE & INNOVATION</h2>
              </div>

              <div>
                <label className="block text-xs font-poppins font-semibold text-[#091540] uppercase mb-1">11. Project Title *</label>
                <input
                  type="text"
                  name="projectTitle"
                  value={formData.projectTitle}
                  onChange={handleTextChange}
                  placeholder="Enter your hardware project title"
                  className="w-full bg-[#F8FAFC] border-2 border-[#091540]/30 rounded-lg px-3.5 py-2 text-xs font-poppins text-[#091540] focus:outline-none focus:border-[#1B2CC1]"
                />
              </div>

              <div>
                <label className="block text-xs font-poppins font-semibold text-[#091540] uppercase mb-2">12. Hardware Project Category (Select applicable) *</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => {
                    const selected = formData.categories.includes(cat);
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => toggleArrayItem("categories", cat)}
                        className={`text-left p-2.5 rounded-lg border-2 text-[11px] font-poppins font-medium transition cursor-pointer ${
                          selected
                            ? 'bg-[#1B2CC1] text-white border-[#091540] shadow-sm'
                            : 'bg-[#F8FAFC] text-[#091540] border-[#091540]/30 hover:border-[#091540]'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div>
                  <label className="block text-xs font-poppins font-semibold text-[#091540] uppercase mb-2">13. Type of Hardware Prototype *</label>
                  <select
                    name="prototypeType"
                    value={formData.prototypeType}
                    onChange={handleTextChange}
                    className="w-full bg-[#F8FAFC] border-2 border-[#091540]/30 rounded-lg px-3.5 py-2 text-xs font-poppins text-[#091540] focus:outline-none focus:border-[#1B2CC1]"
                  >
                    {PROTOTYPE_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-poppins font-semibold text-[#091540] uppercase mb-2">14. Current Working Status *</label>
                  <select
                    name="workingStatus"
                    value={formData.workingStatus}
                    onChange={handleTextChange}
                    className="w-full bg-[#F8FAFC] border-2 border-[#091540]/30 rounded-lg px-3.5 py-2 text-xs font-poppins text-[#091540] focus:outline-none focus:border-[#1B2CC1]"
                  >
                    {WORKING_STATUSES.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t-2 border-[#091540]/10">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-poppins font-semibold text-[#091540] uppercase">15. What problem does your project solve? *</label>
                    <span className="text-[11px] font-poppins text-[#64748B] font-medium">{countWords(formData.problemStatement)} / 150 words</span>
                  </div>
                  <textarea
                    rows={3}
                    name="problemStatement"
                    value={formData.problemStatement}
                    onChange={handleTextChange}
                    className="w-full bg-[#F8FAFC] border-2 border-[#091540]/30 rounded-lg p-3 text-xs font-poppins text-[#091540] focus:outline-none focus:border-[#1B2CC1]"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-poppins font-semibold text-[#091540] uppercase">16. How does your prototype solve this problem? *</label>
                    <span className="text-[11px] font-poppins text-[#64748B] font-medium">{countWords(formData.solutionDescription)} / 200 words</span>
                  </div>
                  <textarea
                    rows={3}
                    name="solutionDescription"
                    value={formData.solutionDescription}
                    onChange={handleTextChange}
                    className="w-full bg-[#F8FAFC] border-2 border-[#091540]/30 rounded-lg p-3 text-xs font-poppins text-[#091540] focus:outline-none focus:border-[#1B2CC1]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-poppins font-semibold text-[#091540] uppercase mb-1">17. What is innovative about your hardware? *</label>
                  <textarea
                    rows={2}
                    name="innovationDetails"
                    value={formData.innovationDetails}
                    onChange={handleTextChange}
                    className="w-full bg-[#F8FAFC] border-2 border-[#091540]/30 rounded-lg p-3 text-xs font-poppins text-[#091540] focus:outline-none focus:border-[#1B2CC1]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-poppins font-semibold text-[#091540] uppercase mb-2">18. Intended Users / Beneficiaries</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {BENEFICIARIES.map((ben) => (
                      <button
                        type="button"
                        key={ben}
                        onClick={() => toggleArrayItem("beneficiaries", ben)}
                        className={`text-left p-2 rounded-lg border-2 text-[11px] font-poppins transition cursor-pointer ${
                          formData.beneficiaries.includes(ben)
                            ? 'bg-[#1B2CC1] text-white border-[#091540] shadow-sm'
                            : 'bg-[#F8FAFC] text-[#091540] border-[#091540]/30 hover:border-[#091540]'
                        }`}
                      >
                        {ben}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SECTIONS 4 & 5 (TECHNICAL DETAILS & REAL WORLD POTENTIAL) */}
          {currentStep === 3 && (
            <div className="p-8 space-y-6">
              <div className="border-b-2 border-[#091540]/20 pb-4">
                <h2 className="text-xl font-bold font-inter text-[#091540]">SECTION 4 & 5: TECHNICAL DETAILS & POTENTIAL</h2>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-poppins font-semibold text-[#091540] uppercase">19. Explain how the prototype works (Max 250 words) *</label>
                  <span className="text-[11px] font-poppins text-[#64748B] font-medium">{countWords(formData.workingPrinciple)} / 250 words</span>
                </div>
                <textarea
                  rows={4}
                  name="workingPrinciple"
                  value={formData.workingPrinciple}
                  onChange={handleTextChange}
                  className="w-full bg-[#F8FAFC] border-2 border-[#091540]/30 rounded-lg p-3 text-xs font-poppins text-[#091540] focus:outline-none focus:border-[#1B2CC1]"
                />
              </div>

              <div>
                <label className="block text-xs font-poppins font-semibold text-[#091540] uppercase mb-1">20. Major Hardware Components *</label>
                <input
                  type="text"
                  name="hardwareComponents"
                  value={formData.hardwareComponents}
                  onChange={handleTextChange}
                  placeholder="e.g. ESP32, Arduino, Raspberry Pi, motors, sensors, PCB, battery..."
                  className="w-full bg-[#F8FAFC] border-2 border-[#091540]/30 rounded-lg px-3.5 py-2 text-xs font-poppins text-[#091540] focus:outline-none focus:border-[#1B2CC1]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-poppins font-semibold text-[#091540] uppercase mb-1">21. Uses AI / ML? *</label>
                  <select
                    name="usesAI"
                    value={formData.usesAI}
                    onChange={handleTextChange}
                    className="w-full bg-[#F8FAFC] border-2 border-[#091540]/30 rounded-lg px-3 py-2 text-xs font-poppins text-[#091540] focus:outline-none focus:border-[#1B2CC1]"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-poppins font-semibold text-[#091540] uppercase mb-1">22. Uses IoT / Wireless? *</label>
                  <select
                    name="usesIoT"
                    value={formData.usesIoT}
                    onChange={handleTextChange}
                    className="w-full bg-[#F8FAFC] border-2 border-[#091540]/30 rounded-lg px-3 py-2 text-xs font-poppins text-[#091540] focus:outline-none focus:border-[#1B2CC1]"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-poppins font-semibold text-[#091540] uppercase mb-1">23. Power Source *</label>
                  <select
                    name="powerSource"
                    value={formData.powerSource}
                    onChange={handleTextChange}
                    className="w-full bg-[#F8FAFC] border-2 border-[#091540]/30 rounded-lg px-3 py-2 text-xs font-poppins text-[#091540] focus:outline-none focus:border-[#1B2CC1]"
                  >
                    {POWER_SOURCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t-2 border-[#091540]/10">
                <div>
                  <label className="block text-xs font-poppins font-semibold text-[#091540] uppercase mb-1">24. Potential Real-World Impact *</label>
                  <textarea
                    rows={2}
                    name="realWorldImpact"
                    value={formData.realWorldImpact}
                    onChange={handleTextChange}
                    className="w-full bg-[#F8FAFC] border-2 border-[#091540]/30 rounded-lg p-3 text-xs font-poppins text-[#091540] focus:outline-none focus:border-[#1B2CC1]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-poppins font-semibold text-[#091540] uppercase mb-1">25. Developable into practical product? *</label>
                    <select
                      name="deployableSystem"
                      value={formData.deployableSystem}
                      onChange={handleTextChange}
                      className="w-full bg-[#F8FAFC] border-2 border-[#091540]/30 rounded-lg px-3 py-2 text-xs font-poppins text-[#091540] focus:outline-none focus:border-[#1B2CC1]"
                    >
                      <option value="Yes">Yes</option>
                      <option value="Potentially">Potentially</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-poppins font-semibold text-[#091540] uppercase mb-1">26. Approx Development Cost (INR ₹) *</label>
                    <input
                      type="number"
                      name="developmentCost"
                      value={formData.developmentCost}
                      onChange={handleTextChange}
                      placeholder="Amount in ₹"
                      className="w-full bg-[#F8FAFC] border-2 border-[#091540]/30 rounded-lg px-3 py-2 text-xs font-poppins text-[#091540] focus:outline-none focus:border-[#1B2CC1]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-poppins font-semibold text-[#091540] uppercase">27. What makes this project worth seeing at AURA 2026? (Max 100 words) *</label>
                    <span className="text-[11px] font-poppins text-[#64748B] font-medium">{countWords(formData.whyWorthSeeing)} / 100 words</span>
                  </div>
                  <textarea
                    rows={2}
                    name="whyWorthSeeing"
                    value={formData.whyWorthSeeing}
                    onChange={handleTextChange}
                    className="w-full bg-[#F8FAFC] border-2 border-[#091540]/30 rounded-lg p-3 text-xs font-poppins text-[#091540] focus:outline-none focus:border-[#1B2CC1]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SECTIONS 6 TO 9 (SAFETY, ORIGINALITY, FEE, DECLARATION) */}
          {currentStep === 4 && (
            <div className="p-8 space-y-6">
              <div className="border-b-2 border-[#091540]/20 pb-4">
                <h2 className="text-xl font-bold font-inter text-[#091540]">SECTION 6 TO 9: SAFETY, FEE & DECLARATION</h2>
              </div>

              {/* Safety Section */}
              <div>
                <label className="block text-xs font-poppins font-semibold text-[#091540] uppercase mb-2">28. Safety Hazard Involvements *</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {SAFETY_HAZARDS.map((hazard) => (
                    <button
                      type="button"
                      key={hazard}
                      onClick={() => toggleArrayItem("safetyHazards", hazard)}
                      className={`text-left p-2.5 rounded-lg border-2 text-[11px] font-poppins transition cursor-pointer ${
                        formData.safetyHazards.includes(hazard)
                          ? 'bg-[#1B2CC1] text-white border-[#091540] shadow-sm'
                          : 'bg-[#F8FAFC] text-[#091540] border-[#091540]/30 hover:border-[#091540]'
                      }`}
                    >
                      {hazard}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-poppins font-semibold text-[#091540] uppercase mb-1">29. Safety Precautions Taken</label>
                  <textarea
                    rows={2}
                    name="safetyPrecautions"
                    value={formData.safetyPrecautions}
                    onChange={handleTextChange}
                    className="w-full bg-[#F8FAFC] border-2 border-[#091540]/30 rounded-lg p-2.5 text-xs font-poppins text-[#091540] focus:outline-none focus:border-[#1B2CC1]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-poppins font-semibold text-[#091540] uppercase mb-1">30. Requires Continuous Supervision? *</label>
                  <select
                    name="requiresSupervision"
                    value={formData.requiresSupervision}
                    onChange={handleTextChange}
                    className="w-full bg-[#F8FAFC] border-2 border-[#091540]/30 rounded-lg px-3 py-2 text-xs font-poppins text-[#091540] focus:outline-none focus:border-[#1B2CC1]"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>

              {/* Section 8: Registration Fee Box */}
              <div className="bg-[#ABD2FA]/40 border-2 border-[#091540] p-5 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-bold font-inter text-[#091540]">SECTION 8: REGISTRATION FEE</h4>
                  <span className={`px-4 py-1 rounded-full text-xs font-poppins font-bold ${isExternalFeeApplicable ? 'bg-amber-100 text-amber-900 border-2 border-amber-600' : 'bg-emerald-100 text-emerald-900 border-2 border-emerald-600'}`}>
                    {isExternalFeeApplicable ? "₹400 Fee Applicable" : "₹0 (No external fee applicable)"}
                  </span>
                </div>
                <p className="text-xs font-poppins text-[#091540]/80 mb-4 font-medium">
                  ₹400 per team applies when 50% or more of team members are from outside Aliah University[cite: 1, 4].
                </p>

                {isExternalFeeApplicable && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t-2 border-[#091540]/10">
                    <div>
                      <label className="block text-xs font-poppins font-semibold text-[#091540] mb-1">35. Transaction ID / UTR *</label>
                      <input
                        type="text"
                        name="transactionId"
                        value={formData.transactionId}
                        onChange={handleTextChange}
                        placeholder="Enter 12-digit UTR/Ref ID"
                        className="w-full bg-[#FFFFFF] border-2 border-[#091540]/30 rounded-lg px-3 py-2 text-xs font-poppins text-[#091540] focus:outline-none focus:border-[#1B2CC1]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-poppins font-semibold text-[#091540] mb-1">36. Payment Screenshot *</label>
                      <input
                        type="file"
                        name="paymentScreenshot"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="w-full text-xs font-poppins text-[#091540] file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-2 file:border-[#091540] file:text-xs file:font-semibold file:bg-[#1B2CC1] file:text-white cursor-pointer"
                      />
                      {formData.paymentScreenshotPreview && (
                        <span className="text-[11px] font-poppins text-emerald-700 font-semibold mt-1 block">✓ Screenshot attached</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Section 9: Declarations */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-poppins font-bold text-[#091540] uppercase mb-2">SECTION 9: DECLARATIONS *</label>
                {[
                  { key: "declWorkingPrototype", text: "37. Working Prototype Declaration: I/We confirm that the project submitted is a physical hardware prototype with a working principal function and can be demonstrated as required by AURA 2026." },
                  { key: "declOriginality", text: "38. Originality Declaration: I/We certify that the information provided is accurate and that the prototype has been primarily developed by the participating team." },
                  { key: "declSafetyRules", text: "39. Safety & Event Rules: I/We agree to follow all safety requirements, technical instructions and event regulations of AURA 2026." },
                  { key: "declMediaPermission", text: "40. Media Permission: I/We permit AURA 2026 and Aliah University to use the project title, description, photographs and non-confidential project information for publicity." },
                  { key: "declFinalConfirmation", text: "41. Final Confirmation: I/We have reviewed the information provided and confirm that it is complete and accurate." }
                ].map((decl) => (
                  <label key={decl.key} className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData[decl.key]}
                      onChange={(e) => setFormData({ ...formData, [decl.key]: e.target.checked })}
                      className="mt-1 w-4 h-4 rounded border-2 border-[#091540] bg-[#F8FAFC] text-[#1B2CC1] focus:ring-0 cursor-pointer"
                    />
                    <span className="text-xs font-poppins text-[#091540]/85 group-hover:text-[#091540] transition leading-relaxed">{decl.text}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Wizard Footer Controls */}
          <div className="bg-[#ABD2FA]/20 p-6 border-t-2 border-[#091540]/20 flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`px-5 py-2.5 rounded-lg border-2 text-xs font-poppins font-semibold transition cursor-pointer ${
                currentStep === 1
                  ? 'opacity-40 cursor-not-allowed border-[#091540]/20 text-[#64748B]'
                  : 'border-[#091540] text-[#091540] hover:bg-[#7692FF] hover:text-white'
              }`}
            >
              Previous Step
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="bg-[#1B2CC1] hover:bg-[#1B2CC1]/90 text-white px-6 py-2.5 rounded-lg text-xs font-poppins font-semibold transition shadow-md cursor-pointer"
              >
                Next Step →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-2.5 rounded-lg text-xs font-poppins font-bold transition shadow-lg cursor-pointer"
              >
                Submit Project Registration
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}