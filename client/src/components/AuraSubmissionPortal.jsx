import React, { useState, useEffect, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import websiteBg from "../assets/WEBSITE_BG.png";
import desktopBg from "../assets/Registration_bg_desktop-ver.jpeg";
import mobileBg from "../assets/Registration_bg_mobile-ver.jpeg";
const rawApiUrl = import.meta.env.VITE_API_URL;
const API_URL = (rawApiUrl && rawApiUrl !== 'undefined') 
  ? rawApiUrl.replace(/\/$/, '') 
  : (import.meta.env.DEV ? 'http://localhost:5000' : '');

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

const HAS_WORKING_PROTOTYPE_MAP = {
  "Yes, fully working": "fully_working",
  "Yes, working with minor limitations": "minor_limitations",
  "No": "no_prototype"
};

const TEAM_AFFILIATION_MAP = {
  "All members are from Aliah University": "all_aliah",
  "All members are from another institution": "all_other",
  "Mixed team: Aliah University + other institution(s)": "mixed"
};

const POWER_SOURCE_MAP = {
  "Battery": "battery",
  "USB": "usb",
  "DC Power Supply": "dc_power_supply",
  "AC Supply": "ac_supply",
  "Solar": "solar",
  "Other": "other"
};

const PRODUCT_POTENTIAL_MAP = {
  "Yes": "yes",
  "Potentially": "potentially",
  "No": "no"
};

const SAFETY_HAZARD_MAP = {
  "High Voltage": "high_voltage",
  "High Current": "high_current",
  "High Temperature": "high_temperature",
  "Moving / Rotating Machinery": "moving_rotating_machinery",
  "Sharp Mechanical Components": "sharp_mechanical_components",
  "High-Power Batteries": "high_power_batteries",
  "Laser / Intense Light": "laser_intense_light",
  "Chemicals": "chemicals",
  "Pressurized Systems": "pressurized_systems",
  "Drone / Flying Equipment": "drone_flying_equipment",
  "Fire / Combustion": "fire_combustion",
  "Water Near Electrical Equipment": "water_near_electrical_equipment",
  "None of the Above": "none"
};

const DEVELOPED_BY_TEAM_MAP = {
  "Yes": "yes",
  "No": "no",
  "External Assistance": "external_assistance"
};

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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    function resizeCanvas() {
      const canvas = document.querySelector(".canvas");
      const viewport = document.querySelector(".viewport");
      if (!canvas || !viewport) return;

      const mobileMode = window.innerWidth < 768;
      setIsMobile(mobileMode);

      const baseWidth = mobileMode ? 680 : 1376;
      const baseHeight = mobileMode ? 1209 : 768;

      const scale = viewport.clientWidth / baseWidth;

      canvas.style.transform = `scale(${scale})`;
      canvas.style.transformOrigin = "top left";
      canvas.style.width = `${baseWidth}px`;
      canvas.style.height = `${baseHeight}px`;

      viewport.style.height = `${baseHeight * scale}px`;
    }

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    // Run again with short timeouts to ensure DOM mounting completes
    const timer1 = setTimeout(resizeCanvas, 100);
    const timer2 = setTimeout(resizeCanvas, 500);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const { mutate, isPending } = useMutation({
    mutationFn: async (formDataToSend) => {
      const endpoint = `${API_URL}/api/registrations`;
      console.log("🚀 Sending registration request to:", endpoint);
      const response = await fetch(endpoint, {
        method: "POST",
        body: formDataToSend,
      });

      const contentType = response.headers.get("content-type");
      let result;
      if (contentType && contentType.includes("application/json")) {
        result = await response.json();
      } else {
        const text = await response.text();
        throw new Error(response.ok ? text : `Server Error (${response.status}): ${response.statusText || text}`);
      }

      if (!response.ok) {
        throw new Error(result?.message || "Registration failed");
      }
      return result;
    },
    onSuccess: () => {
      console.log("🎉 Registration successful!");
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_STEP_KEY);
      setSubmitted(true);
    },
    onError: (error) => {
      console.error("❌ Registration failed:", error);
      alert(error.message);
    }
  });

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

  const scrollToNextField = (currentIndex) => {
    try {
      const nextElement = document.getElementById(`field-group-${currentIndex + 1}`);
      if (nextElement) {
        nextElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } catch (err) {
      console.warn("Could not scroll to next field:", err);
    }
  };

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

  const handleSubmit = (e) => {
    e.preventDefault();

    // 1. Declarations Validation
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

    // Helper to parse numeric team size
    const parsedTeamSize = parseInt(formData.teamSize) || 0;

    // 2. Team Affiliation Mixed Constraints
    const mappedAffiliation = TEAM_AFFILIATION_MAP[formData.teamAffiliation];
    if (mappedAffiliation === "mixed") {
      const totalMixedMembers = Number(formData.aliahMembersCount) + Number(formData.otherMembersCount);
      if (totalMixedMembers !== parsedTeamSize) {
        alert(`The sum of Aliah members (${formData.aliahMembersCount}) and other institution members (${formData.otherMembersCount}) must equal the total team size (${parsedTeamSize}).`);
        return;
      }
      if (formData.aliahMembersCount < 1 || formData.aliahMembersCount > 3) {
        alert("Aliah University members must be between 1 and 3 for a mixed team.");
        return;
      }
      if (formData.otherMembersCount < 1 || formData.otherMembersCount > 3) {
        alert("Other institution members must be between 1 and 3 for a mixed team.");
        return;
      }
    }

    // 3. Required Fields Client Validation
    if (!formData.teamName.trim()) { alert("Team Name is required."); return; }
    if (!formData.teamLeaderName.trim()) { alert("Team Leader Name is required."); return; }
    if (!formData.teamLeaderEmail.trim()) { alert("Team Leader Email is required."); return; }
    if (!/^\S+@\S+\.\S+$/.test(formData.teamLeaderEmail.trim())) { alert("Please enter a valid email address."); return; }
    if (!formData.teamLeaderPhone.trim()) { alert("Team Leader Phone is required."); return; }
    if (!formData.teamMembersDetails.trim()) { alert("Team Member Details are required."); return; }
    if (!formData.projectTitle.trim()) { alert("Project Title is required."); return; }
    if (formData.categories.length === 0) { alert("Please select at least one Hardware Project Category."); return; }
    if (!formData.problemStatement.trim()) { alert("Problem Statement is required."); return; }
    if (!formData.solutionDescription.trim()) { alert("Solution Description is required."); return; }
    if (!formData.innovationDetails.trim()) { alert("Innovation Description is required."); return; }
    if (formData.beneficiaries.length === 0) { alert("Please select at least one Intended User / Beneficiary."); return; }
    if (!formData.workingPrinciple.trim()) { alert("Working Principle explanation is required."); return; }
    if (!formData.hardwareComponents.trim()) { alert("Major Hardware Components are required."); return; }
    if (!formData.realWorldImpact.trim()) { alert("Potential Real-World Impact is required."); return; }
    if (formData.developmentCost === "" || isNaN(Number(formData.developmentCost)) || Number(formData.developmentCost) < 0) {
      alert("Approx Development Cost must be a positive number.");
      return;
    }
    if (!formData.whyWorthSeeing.trim()) { alert("Highlight explaining why this is worth seeing is required."); return; }
    if (formData.safetyHazards.length === 0) { alert("Please select at least one Safety Hazard Involvement option."); return; }
    if (!formData.safetyPrecautions.trim()) { alert("Safety Precautions details are required."); return; }
    if (formData.previouslyExhibited === "Yes" && !formData.exhibitionDetails.trim()) {
      alert("Please provide the previous exhibition details.");
      return;
    }

    if (isExternalFeeApplicable) {
      if (!formData.transactionId.trim()) {
        alert("Transaction ID / UTR is required for paid registrations.");
        return;
      }
      if (!formData.paymentScreenshotFile) {
        alert("Payment screenshot image is required for paid registrations.");
        return;
      }
    }

    try {
      const formDataToSend = new FormData();

      // Map exact fields for final backend schema
      formDataToSend.append("teamName", formData.teamName.trim());
      formDataToSend.append("teamSize", parsedTeamSize);
      formDataToSend.append("hasWorkingPrototype", HAS_WORKING_PROTOTYPE_MAP[formData.hasWorkingPrototype]);
      formDataToSend.append("teamAffiliation", mappedAffiliation);

      if (mappedAffiliation === "mixed") {
        formDataToSend.append("aliahMembers", Number(formData.aliahMembersCount));
        formDataToSend.append("otherInstitutionMembers", Number(formData.otherMembersCount));
      }

      formDataToSend.append("teamLeaderName", formData.teamLeaderName.trim());
      formDataToSend.append("teamLeaderEmail", formData.teamLeaderEmail.trim().toLowerCase());
      formDataToSend.append("teamLeaderPhone", formData.teamLeaderPhone.trim());
      formDataToSend.append("teamMemberDetails", formData.teamMembersDetails.trim());

      formDataToSend.append("projectTitle", formData.projectTitle.trim());
      formDataToSend.append("hardwareProjectCategories", JSON.stringify(formData.categories));
      formDataToSend.append("prototypeType", formData.prototypeType);
      formDataToSend.append("currentWorkingStatus", formData.workingStatus);

      formDataToSend.append("problemStatement", formData.problemStatement.trim());
      formDataToSend.append("solutionDescription", formData.solutionDescription.trim());
      formDataToSend.append("innovationDescription", formData.innovationDetails.trim());
      formDataToSend.append("intendedBeneficiaries", JSON.stringify(formData.beneficiaries));

      formDataToSend.append("workingPrinciple", formData.workingPrinciple.trim());

      const hardwareComponentsArray = formData.hardwareComponents
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      formDataToSend.append("majorHardwareComponents", JSON.stringify(hardwareComponentsArray));

      formDataToSend.append("useAi", formData.usesAI === "Yes");
      formDataToSend.append("useIot", formData.usesIoT === "Yes");
      formDataToSend.append("powerSource", POWER_SOURCE_MAP[formData.powerSource]);

      formDataToSend.append("potentialImpact", formData.realWorldImpact.trim());
      formDataToSend.append("productPotential", PRODUCT_POTENTIAL_MAP[formData.deployableSystem]);
      formDataToSend.append("prototypeDevelopmentCost", Number(formData.developmentCost));
      formDataToSend.append("auraDemoHighlight", formData.whyWorthSeeing.trim());

      // Map safety hazards to lowercase enums
      const mappedSafetyHazards = formData.safetyHazards.map(h => SAFETY_HAZARD_MAP[h]).filter(Boolean);
      formDataToSend.append("safetyHazards", JSON.stringify(mappedSafetyHazards));
      formDataToSend.append("safetyPrecautions", formData.safetyPrecautions.trim());
      formDataToSend.append("requiresContinuousSupervision", formData.requiresSupervision === "Yes");

      // Section 7: Originality
      formDataToSend.append("prototypeDevelopedByTeam", DEVELOPED_BY_TEAM_MAP[formData.developedByTeam]);
      const isPreviouslyExhibited = formData.previouslyExhibited === "Yes";
      formDataToSend.append("previouslyExhibited", isPreviouslyExhibited);
      if (isPreviouslyExhibited) {
        formDataToSend.append("previousExhibitionDetails", formData.exhibitionDetails.trim());
      }

      // Section 8: Fees
      const feeStatus = isExternalFeeApplicable ? "external_fee" : "no_fee";
      formDataToSend.append("registrationFeeStatus", feeStatus);
      formDataToSend.append("registrationFee", isExternalFeeApplicable ? 400 : 0);

      if (isExternalFeeApplicable) {
        formDataToSend.append("transactionId", formData.transactionId.trim());
        if (formData.paymentScreenshotFile) {
          formDataToSend.append("paymentScreenshot", formData.paymentScreenshotFile);
        }
      }

      // Section 9: Declarations
      formDataToSend.append("workingPrototypeDeclaration", formData.declWorkingPrototype);
      formDataToSend.append("originalityDeclaration", formData.declOriginality);
      formDataToSend.append("safetyEventRulesAgreement", formData.declSafetyRules);
      formDataToSend.append("mediaPermission", formData.declMediaPermission);
      formDataToSend.append("finalConfirmation", formData.declFinalConfirmation);

      console.log("🚀 Triggering TanStack Query mutation...");
      mutate(formDataToSend);
    } catch (error) {
      console.error("❌ Registration failed:", error);
      alert(error.message);
    }
  };


  if (submitted) {
    return (
      <div className="viewport w-full relative overflow-hidden bg-black flex justify-center items-start selection:bg-white selection:text-black">
        <div 
          className="canvas absolute top-0 left-0 bg-cover bg-center select-none"
          style={{
            backgroundImage: `url(${isMobile ? mobileBg : desktopBg})`,
            width: isMobile ? '680px' : '1376px',
            height: isMobile ? '1209px' : '768px'
          }}
        >
          {/* Top Header Actions with Solid Contrast Background */}
          <div className={`absolute z-30 flex items-center justify-between ${isMobile ? 'top-[25px] left-[70px] w-[540px]' : 'top-[15px] left-[348px] w-[680px]'}`}>
            <button
              onClick={onBack}
              className="px-4 py-1.5 bg-black border border-white/30 rounded-full hover:bg-white hover:text-black text-white font-mono text-[10px] font-bold tracking-widest uppercase transition-all duration-200 cursor-pointer shadow-lg"
            >
              ← Back
            </button>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest px-3 py-1.5 rounded-full bg-black border border-white/30 text-white uppercase select-none shadow-lg">
                Fee Status: Subsidized
              </span>
            </div>
          </div>

          {/* Mac Terminal container centered inside the black slot */}
          <div 
            className={`flex flex-col bg-black/95 border border-white/15 rounded-lg shadow-2xl overflow-hidden ${
              isMobile 
                ? 'w-[540px] h-[960px] absolute left-[70px] top-[125px]' 
                : 'w-[680px] h-[670px] absolute left-[348px] top-[49px]'
            }`}
            style={{ fontFamily: "'SF Mono', Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" }}
          >
            {/* Terminal Header Bar */}
            <div className="h-8 bg-[#1e1e1f] border-b border-white/5 flex items-center px-4 relative select-none flex-shrink-0">
              <div className="flex items-center gap-1.5 z-10">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
              </div>
              <div className="absolute left-0 right-0 text-center text-[10px] text-white/40 tracking-wider">
                aura-2k26-terminal -- bash
              </div>
            </div>

            {/* Terminal Body */}
            <div className="flex-grow p-6 overflow-y-auto custom-scrollbar flex flex-col justify-between text-white text-sm">
              <div className="space-y-4">
                <div className="text-[#4682BF] font-bold select-none">
                  aura@aliah-univ:~$ ./register --status
                </div>
                <div className="text-[#4682BF] font-semibold leading-relaxed">
                  [SUCCESS] PROJECT SUBMISSION LOGGED SUCCESSFULLY!
                </div>
                <pre className="text-[11px] text-[#4682BF] leading-none select-none font-bold">
{`   _  _  _  _  ___   _ 
  | || || || || _ \\ / \\  
  | \\/ || \\/ ||   // _ \\ 
   \\__/  \\__/ |_|_|_/ \\_\\`}
                </pre>
                <div className="border-t border-white/10 pt-3 space-y-3 text-white/90">
                  <p>
                    Thank you for submitting your working hardware project to <strong className="text-white">AURA 2026</strong> (The Annual Technical Festival of Aliah University, 19–20 November 2026)[cite: 1, 4].
                  </p>
                  <p className="bg-white/5 border border-white/10 p-3 rounded text-[12px] leading-relaxed">
                    Your submission has been logged by the AURA 2026 Project Evaluation Committee[cite: 1, 4]. Please note that shortlisted teams will be contacted separately regarding live evaluation and demo[cite: 1, 4].
                  </p>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4 flex flex-col items-center gap-3">
                <span className="text-[10px] text-white/40">DISCOVER • DESIGN • DISRUPT</span>
                <button
                  onClick={onBack}
                  className="px-6 py-2 border border-white rounded hover:bg-white hover:text-black text-white font-mono text-[11px] font-bold uppercase transition duration-150 cursor-pointer bg-transparent"
                >
                  ← Return to Homepage
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen w-full relative bg-cover bg-center overflow-y-auto custom-scrollbar py-8 px-4 sm:px-6 md:px-10 flex flex-col items-center justify-start text-white select-none selection:bg-white selection:text-black"
      style={{ backgroundImage: `url(${websiteBg})` }}
    >
      {/* Dark Overlay for optimal readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70 pointer-events-none z-0" />

      {/* Top Header Actions (Above Mirror Glass Panel) */}
      <div className="relative z-20 w-full max-w-4xl flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="px-6 py-2 border-2 border-white rounded-full bg-black/40 hover:bg-white hover:text-black text-white font-heading text-xs font-black tracking-widest uppercase transition-all duration-200 cursor-pointer shadow-lg"
        >
          BACK
        </button>

        <div className="flex items-center gap-3">
          {draftSavedToast && (
            <span className="text-[10px] font-mono tracking-widest text-emerald-400 font-bold bg-black/70 px-3 py-1.5 border border-emerald-400/40 rounded-full shadow-lg animate-pulse">
              ✓ Saved
            </span>
          )}
          <button
            type="button"
            onClick={handleResetDraft}
            className="px-4 py-2 border border-white/30 rounded-full bg-black/40 hover:bg-white/20 text-white/70 hover:text-white font-heading text-[10px] font-black tracking-widest uppercase transition-all duration-200 cursor-pointer shadow-lg"
            title="Clear stored data"
          >
            Clear Draft
          </button>
          <button
            type="button"
            onClick={() => {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
              setDraftSavedToast(true);
              setTimeout(() => setDraftSavedToast(false), 1500);
            }}
            className="px-6 py-2 border-2 border-white rounded-full bg-black/40 hover:bg-white hover:text-black text-white font-heading text-xs font-black tracking-widest uppercase transition-all duration-200 cursor-pointer shadow-lg"
          >
            SAVE DRAFT
          </button>
        </div>
      </div>

      {/* Main Mirror Glass Panel Container */}
      <div 
        className="relative z-20 w-full max-w-4xl border-2 border-white rounded-2xl md:rounded-3xl p-5 sm:p-8 md:p-10 backdrop-blur-xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] mb-12"
        style={{
          background: "radial-gradient(circle at 0% 0%, rgba(119, 32, 61, 0.78), rgba(60, 86, 175, 0.78))"
        }}
      >
        {/* Form Title */}
        <h1 className="font-heading text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-widest uppercase text-center mb-6 drop-shadow-md">
          AURA 2K26 REGISTRATION FORM
        </h1>

        {/* 4-Tab Navigation Bar */}
        <div className="flex items-center justify-center gap-4 sm:gap-8 md:gap-12 border-b border-white/20 pb-4 mb-8">
          {[
            { step: 1, label: "TEAM" },
            { step: 2, label: "PROFILE" },
            { step: 3, label: "SPECS" },
            { step: 4, label: "SUBMIT" }
          ].map((tab) => (
            <button
              key={tab.step}
              type="button"
              onClick={() => handleStepJump(tab.step)}
              className={`font-heading text-xs sm:text-sm md:text-base font-black tracking-widest uppercase transition-all cursor-pointer select-none relative ${
                currentStep === tab.step
                  ? "text-white border-b-2 border-white pb-1 -mb-[17px] shadow-sm"
                  : "text-white/60 hover:text-white pb-1"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Inner Form Card Container ("FORM TAG HERE") */}
        <div className="bg-black/60 border border-white/20 rounded-2xl p-4 sm:p-6 md:p-8 backdrop-blur-md shadow-2xl space-y-6 text-white font-body">

          {/* STEP 1: TEAM */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="border-b border-white/10 pb-2">
                <h3 className="font-heading text-base sm:text-lg font-black uppercase tracking-wider text-white">
                  1. Team Configuration & Eligibility
                </h3>
              </div>

              {/* Team Size */}
              <div id="field-group-1" className="space-y-2">
                <label className="block font-heading text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                  Team Size *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {["2 Members", "3 Members", "4 Members"].map((size) => (
                    <button
                      type="button"
                      key={size}
                      onClick={() => handleTeamSizeChange(size)}
                      className={`py-2.5 px-3 text-center font-heading text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                        formData.teamSize === size
                          ? 'bg-white text-black border-2 border-white shadow-lg'
                          : 'bg-black/50 text-white border border-white/30 hover:border-white hover:bg-white/10'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Physical Prototype */}
              <div id="field-group-2" className="space-y-2">
                <label className="block font-heading text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                  Working Physical Prototype? *
                </label>
                <select
                  name="hasWorkingPrototype"
                  value={formData.hasWorkingPrototype}
                  onChange={handleTextChange}
                  className="w-full bg-black/60 border border-white/30 focus:border-white text-white font-body text-sm sm:text-base focus:outline-none transition-all p-3 rounded-lg cursor-pointer"
                >
                  <option value="Yes, fully working">Yes, fully working</option>
                  <option value="Yes, working with minor limitations">Yes, working with minor limitations</option>
                  <option value="No">No</option>
                </select>
              </div>

              {/* Team Affiliation */}
              <div id="field-group-3" className="space-y-2">
                <label className="block font-heading text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                  Team Affiliation *
                </label>
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
                      className={`w-full text-left py-3 px-4 rounded-xl text-xs sm:text-sm font-body font-bold transition-all cursor-pointer ${
                        formData.teamAffiliation === affiliation
                          ? 'bg-white text-black border-2 border-white shadow-lg'
                          : 'bg-black/50 text-white border border-white/30 hover:border-white hover:bg-white/10'
                      }`}
                    >
                      ● {affiliation}
                    </button>
                  ))}
                </div>
              </div>

              {/* Member Counts */}
              <div id="field-group-4" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block font-heading text-xs uppercase tracking-wider text-white font-bold">
                    Aliah Members Count *
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[0, 1, 2, 3, 4].map((num) => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => setFormData({ ...formData, aliahMembersCount: num })}
                        className={`py-2 text-center text-xs font-heading font-bold rounded-lg transition-all cursor-pointer ${
                          Number(formData.aliahMembersCount) === num
                            ? 'bg-white text-black border-2 border-white'
                            : 'bg-black/50 text-white border border-white/30 hover:border-white'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block font-heading text-xs uppercase tracking-wider text-white font-bold">
                    Other Members Count *
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[0, 1, 2, 3, 4].map((num) => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => setFormData({ ...formData, otherMembersCount: num })}
                        className={`py-2 text-center text-xs font-heading font-bold rounded-lg transition-all cursor-pointer ${
                          Number(formData.otherMembersCount) === num
                            ? 'bg-white text-black border-2 border-white'
                            : 'bg-black/50 text-white border border-white/30 hover:border-white'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Team Name */}
              <div id="field-group-5" className="space-y-2">
                <label className="block font-heading text-xs sm:text-sm uppercase tracking-wider text-white font-bold">
                  Team Name *
                </label>
                <input
                  type="text"
                  name="teamName"
                  value={formData.teamName}
                  onChange={handleTextChange}
                  placeholder="Enter team name"
                  className="w-full bg-black/40 border border-white/30 focus:border-white text-white font-body text-sm sm:text-base focus:outline-none transition-all p-3 rounded-lg placeholder:text-white/30"
                />
              </div>

              {/* Leader Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div id="field-group-6" className="space-y-2">
                  <label className="block font-heading text-xs uppercase tracking-wider text-white font-bold">
                    Leader Name *
                  </label>
                  <input
                    type="text"
                    name="teamLeaderName"
                    value={formData.teamLeaderName}
                    onChange={handleTextChange}
                    placeholder="Full Name"
                    className="w-full bg-black/40 border border-white/30 focus:border-white text-white font-body text-sm focus:outline-none transition-all p-3 rounded-lg placeholder:text-white/30"
                  />
                </div>
                <div id="field-group-7" className="space-y-2">
                  <label className="block font-heading text-xs uppercase tracking-wider text-white font-bold">
                    Leader Email *
                  </label>
                  <input
                    type="email"
                    name="teamLeaderEmail"
                    value={formData.teamLeaderEmail}
                    onChange={handleTextChange}
                    placeholder="leader@gmail.com"
                    className="w-full bg-black/40 border border-white/30 focus:border-white text-white font-body text-sm focus:outline-none transition-all p-3 rounded-lg placeholder:text-white/30"
                  />
                </div>
                <div id="field-group-8" className="space-y-2">
                  <label className="block font-heading text-xs uppercase tracking-wider text-white font-bold">
                    Leader Phone *
                  </label>
                  <input
                    type="tel"
                    name="teamLeaderPhone"
                    value={formData.teamLeaderPhone}
                    onChange={handleTextChange}
                    placeholder="10-digit number"
                    className="w-full bg-black/40 border border-white/30 focus:border-white text-white font-body text-sm focus:outline-none transition-all p-3 rounded-lg placeholder:text-white/30"
                  />
                </div>
              </div>

              {/* Other Members Details */}
              <div id="field-group-9" className="space-y-2">
                <label className="block font-heading text-xs sm:text-sm uppercase tracking-wider text-white font-bold">
                  Other Members Details *
                </label>
                <textarea
                  rows={3}
                  name="teamMembersDetails"
                  value={formData.teamMembersDetails}
                  onChange={handleTextChange}
                  placeholder="Format: Member Name | Institution | Department | Year | Phone"
                  className="w-full bg-black/40 border border-white/30 focus:border-white text-white font-body text-sm focus:outline-none transition-all p-3 rounded-lg placeholder:text-white/30"
                />
              </div>
            </div>
          )}

          {/* STEP 2: PROFILE */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="border-b border-white/10 pb-2">
                <h3 className="font-heading text-base sm:text-lg font-black uppercase tracking-wider text-white">
                  2. Project Profile & Problem Statement
                </h3>
              </div>

              <div id="field-group-11" className="space-y-2">
                <label className="block font-heading text-xs sm:text-sm uppercase tracking-wider text-white font-bold">
                  Project Title *
                </label>
                <input
                  type="text"
                  name="projectTitle"
                  value={formData.projectTitle}
                  onChange={handleTextChange}
                  placeholder="Enter project name"
                  className="w-full bg-black/40 border border-white/30 focus:border-white text-white font-body text-sm sm:text-base focus:outline-none transition-all p-3 rounded-lg placeholder:text-white/30"
                />
              </div>

              <div id="field-group-12" className="space-y-2">
                <label className="block font-heading text-xs sm:text-sm uppercase tracking-wider text-white font-bold">
                  Project Categories *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto custom-scrollbar bg-black/40 p-3 border border-white/30 rounded-xl">
                  {CATEGORIES.map((cat) => {
                    const selected = formData.categories.includes(cat);
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => toggleArrayItem("categories", cat)}
                        className={`text-left py-2 px-3 rounded-lg text-xs font-body font-bold transition-all cursor-pointer ${
                          selected
                            ? 'bg-white text-black font-bold shadow'
                            : 'bg-black/50 text-white border border-white/20 hover:border-white/50'
                        }`}
                      >
                        [ {selected ? '✓' : ' '} ] {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div id="field-group-13" className="space-y-2">
                  <label className="block font-heading text-xs uppercase tracking-wider text-white font-bold">
                    Prototype Type *
                  </label>
                  <select
                    name="prototypeType"
                    value={formData.prototypeType}
                    onChange={handleTextChange}
                    className="w-full bg-black/60 border border-white/30 focus:border-white text-white font-body text-sm focus:outline-none transition-all p-3 rounded-lg cursor-pointer"
                  >
                    {PROTOTYPE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div id="field-group-14" className="space-y-2">
                  <label className="block font-heading text-xs uppercase tracking-wider text-white font-bold">
                    Working Status *
                  </label>
                  <select
                    name="workingStatus"
                    value={formData.workingStatus}
                    onChange={handleTextChange}
                    className="w-full bg-black/60 border border-white/30 focus:border-white text-white font-body text-sm focus:outline-none transition-all p-3 rounded-lg cursor-pointer"
                  >
                    {WORKING_STATUSES.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div id="field-group-15" className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block font-heading text-xs sm:text-sm uppercase tracking-wider text-white font-bold">
                    Problem Solved *
                  </label>
                  <span className="text-xs font-mono text-white/50">{countWords(formData.problemStatement)}/150 words</span>
                </div>
                <textarea
                  rows={3}
                  name="problemStatement"
                  value={formData.problemStatement}
                  onChange={handleTextChange}
                  placeholder="Describe the exact problem your hardware is solving"
                  className="w-full bg-black/40 border border-white/30 focus:border-white text-white font-body text-sm focus:outline-none transition-all p-3 rounded-lg placeholder:text-white/30"
                />
              </div>

              <div id="field-group-16" className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block font-heading text-xs sm:text-sm uppercase tracking-wider text-white font-bold">
                    Solution Description *
                  </label>
                  <span className="text-xs font-mono text-white/50">{countWords(formData.solutionDescription)}/200 words</span>
                </div>
                <textarea
                  rows={3}
                  name="solutionDescription"
                  value={formData.solutionDescription}
                  onChange={handleTextChange}
                  placeholder="How does your hardware prototype solve the problem?"
                  className="w-full bg-black/40 border border-white/30 focus:border-white text-white font-body text-sm focus:outline-none transition-all p-3 rounded-lg placeholder:text-white/30"
                />
              </div>

              <div id="field-group-17" className="space-y-2">
                <label className="block font-heading text-xs sm:text-sm uppercase tracking-wider text-white font-bold">
                  Innovation Details *
                </label>
                <textarea
                  rows={2}
                  name="innovationDetails"
                  value={formData.innovationDetails}
                  onChange={handleTextChange}
                  placeholder="What is unique about your hardware compared to existing systems?"
                  className="w-full bg-black/40 border border-white/30 focus:border-white text-white font-body text-sm focus:outline-none transition-all p-3 rounded-lg placeholder:text-white/30"
                />
              </div>
            </div>
          )}

          {/* STEP 3: SPECS */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="border-b border-white/10 pb-2">
                <h3 className="font-heading text-base sm:text-lg font-black uppercase tracking-wider text-white">
                  3. System Specifications & Technical Details
                </h3>
              </div>

              <div id="field-group-21" className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block font-heading text-xs sm:text-sm uppercase tracking-wider text-white font-bold">
                    Working Principle *
                  </label>
                  <span className="text-xs font-mono text-white/50">{countWords(formData.workingPrinciple)}/250 words</span>
                </div>
                <textarea
                  rows={3}
                  name="workingPrinciple"
                  value={formData.workingPrinciple}
                  onChange={handleTextChange}
                  placeholder="Explain the technical principle / workflow of your system"
                  className="w-full bg-black/40 border border-white/30 focus:border-white text-white font-body text-sm focus:outline-none transition-all p-3 rounded-lg placeholder:text-white/30"
                />
              </div>

              <div id="field-group-22" className="space-y-2">
                <label className="block font-heading text-xs sm:text-sm uppercase tracking-wider text-white font-bold">
                  Major Hardware Components *
                </label>
                <input
                  type="text"
                  name="hardwareComponents"
                  value={formData.hardwareComponents}
                  onChange={handleTextChange}
                  placeholder="e.g. ESP32, Arduino, motors, sensors, PCB, battery..."
                  className="w-full bg-black/40 border border-white/30 focus:border-white text-white font-body text-sm focus:outline-none transition-all p-3 rounded-lg placeholder:text-white/30"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div id="field-group-23" className="space-y-2">
                  <label className="block font-heading text-xs uppercase tracking-wider text-white font-bold">
                    Uses AI? *
                  </label>
                  <select
                    name="usesAI"
                    value={formData.usesAI}
                    onChange={handleTextChange}
                    className="w-full bg-black/60 border border-white/30 focus:border-white text-white font-body text-sm focus:outline-none transition-all p-3 rounded-lg cursor-pointer"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div id="field-group-24" className="space-y-2">
                  <label className="block font-heading text-xs uppercase tracking-wider text-white font-bold">
                    Uses IoT? *
                  </label>
                  <select
                    name="usesIoT"
                    value={formData.usesIoT}
                    onChange={handleTextChange}
                    className="w-full bg-black/60 border border-white/30 focus:border-white text-white font-body text-sm focus:outline-none transition-all p-3 rounded-lg cursor-pointer"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div id="field-group-25" className="space-y-2">
                  <label className="block font-heading text-xs uppercase tracking-wider text-white font-bold">
                    Power Source *
                  </label>
                  <select
                    name="powerSource"
                    value={formData.powerSource}
                    onChange={handleTextChange}
                    className="w-full bg-black/60 border border-white/30 focus:border-white text-white font-body text-sm focus:outline-none transition-all p-3 rounded-lg cursor-pointer"
                  >
                    {POWER_SOURCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div id="field-group-26" className="space-y-2">
                <label className="block font-heading text-xs sm:text-sm uppercase tracking-wider text-white font-bold">
                  Potential Real-World Impact *
                </label>
                <textarea
                  rows={2}
                  name="realWorldImpact"
                  value={formData.realWorldImpact}
                  onChange={handleTextChange}
                  placeholder="Who benefits from this? How does it improve current standards?"
                  className="w-full bg-black/40 border border-white/30 focus:border-white text-white font-body text-sm focus:outline-none transition-all p-3 rounded-lg placeholder:text-white/30"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div id="field-group-27" className="space-y-2">
                  <label className="block font-heading text-xs uppercase tracking-wider text-white font-bold">
                    Practical Product Potential? *
                  </label>
                  <select
                    name="deployableSystem"
                    value={formData.deployableSystem}
                    onChange={handleTextChange}
                    className="w-full bg-black/60 border border-white/30 focus:border-white text-white font-body text-sm focus:outline-none transition-all p-3 rounded-lg cursor-pointer"
                  >
                    <option value="Yes">Yes</option>
                    <option value="Potentially">Potentially</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div id="field-group-28" className="space-y-2">
                  <label className="block font-heading text-xs uppercase tracking-wider text-white font-bold">
                    Development Cost (₹ INR) *
                  </label>
                  <input
                    type="number"
                    name="developmentCost"
                    value={formData.developmentCost}
                    onChange={handleTextChange}
                    placeholder="Amount in ₹"
                    className="w-full bg-black/40 border border-white/30 focus:border-white text-white font-body text-sm focus:outline-none transition-all p-3 rounded-lg placeholder:text-white/30"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SUBMIT */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="border-b border-white/10 pb-2">
                <h3 className="font-heading text-base sm:text-lg font-black uppercase tracking-wider text-white">
                  4. Fee Status, Declarations & Submission
                </h3>
              </div>

              {/* Registration Fee Box */}
              <div className="bg-black/50 border border-white/20 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className={`px-4 py-1.5 border rounded-full font-heading text-xs font-black uppercase tracking-widest ${isExternalFeeApplicable ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'}`}>
                    {isExternalFeeApplicable ? "₹400 Fee Applicable" : "₹0 (Fully Subsidized)"}
                  </span>
                </div>
                <p className="text-xs text-white/80 leading-relaxed font-body">
                  A ₹400 registration fee applies to teams where 50% or more members are from outside Aliah University. Teams with &gt;50% Aliah University members are fully subsidized.
                </p>

                {isExternalFeeApplicable && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-white/10">
                    <div id="field-group-38" className="space-y-2">
                      <label className="block font-heading text-xs uppercase text-white font-bold">
                        UTR / Transaction ID *
                      </label>
                      <input
                        type="text"
                        name="transactionId"
                        value={formData.transactionId}
                        onChange={handleTextChange}
                        placeholder="Enter 12-digit UTR"
                        className="w-full bg-black/40 border border-white/30 focus:border-white text-white font-body text-sm focus:outline-none transition-all p-3 rounded-lg placeholder:text-white/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block font-heading text-xs uppercase text-white font-bold">
                        Screenshot Upload *
                      </label>
                      <input
                        type="file"
                        name="paymentScreenshot"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="w-full text-xs text-white/70 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-2 file:border-white file:text-xs file:font-heading file:font-black file:uppercase file:bg-white file:text-black cursor-pointer"
                      />
                      {formData.paymentScreenshotPreview && (
                        <span className="text-xs text-emerald-400 font-bold block mt-1">✓ Screenshot attached</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Declarations */}
              <div className="space-y-3 bg-black/40 border border-white/20 rounded-xl p-4">
                <label className="block font-heading text-xs sm:text-sm font-bold uppercase tracking-wider text-white mb-2">
                  Mandatory Declarations *
                </label>
                {[
                  { key: "declWorkingPrototype", text: "Working Prototype: We confirm that this is a working physical prototype." },
                  { key: "declOriginality", text: "Originality: We certify that this prototype was primarily developed by us." },
                  { key: "declSafetyRules", text: "Safety & Event Rules: We agree to follow all safety regulations of AURA 2K26." },
                  { key: "declMediaPermission", text: "Media Permission: We permit AURA 2K26 to showcase our project." },
                  { key: "declFinalConfirmation", text: "Final Confirmation: We confirm that all info provided is accurate." }
                ].map((decl) => (
                  <label key={decl.key} className="flex items-start gap-3 cursor-pointer text-xs sm:text-sm text-white/90 hover:text-white transition select-none leading-relaxed">
                    <input
                      type="checkbox"
                      checked={formData[decl.key]}
                      onChange={(e) => setFormData({ ...formData, [decl.key]: e.target.checked })}
                      className="mt-1 w-4 h-4 bg-black border border-white/40 rounded text-white focus:ring-0 cursor-pointer"
                    />
                    <span>{decl.text}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Panel Footer Controls */}
        <div className="flex items-center justify-between pt-6 border-t border-white/20 mt-8">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-6 py-2.5 border-2 border-white rounded-full bg-black/40 hover:bg-white hover:text-black text-white font-heading text-xs font-black tracking-widest uppercase transition-all duration-200 cursor-pointer shadow-lg"
            >
              ← PREVIOUS STEP
            </button>
          ) : <div />}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-8 py-2.5 border-2 border-white rounded-full bg-white hover:bg-white/80 text-black font-heading text-xs font-black tracking-widest uppercase transition-all duration-200 cursor-pointer shadow-lg ml-auto"
            >
              NEXT STEP →
            </button>
          ) : (
            <button
              type="button"
              disabled={isPending}
              onClick={handleSubmit}
              className="px-10 py-3 border-2 border-white rounded-full bg-white text-black hover:bg-emerald-400 hover:border-emerald-400 hover:text-black font-heading text-sm font-black tracking-widest uppercase transition-all duration-200 cursor-pointer shadow-xl ml-auto disabled:opacity-50"
            >
              {isPending ? "SUBMITTING..." : "SUBMIT REGISTRATION 🚀"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}