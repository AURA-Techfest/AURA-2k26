import React, { useState, useEffect, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import desktopBg from "../assets/Registration_bg_desktop-ver.jpeg";
import mobileBg from "../assets/Registration_bg_mobile-ver.jpeg";
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
      const response = await fetch(API_URL, {
        method: "POST",
        body: formDataToSend,
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Registration failed");
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
            {draftSavedToast && (
              <span className="text-[9px] font-mono tracking-widest text-[#4682BF] font-bold bg-black px-2 py-1.5 border border-white/20 rounded-full shadow-lg">
                ✓ Saved
              </span>
            )}
            <button
              type="button"
              onClick={handleResetDraft}
              className="text-[10px] font-mono font-black tracking-widest text-white/50 hover:text-white uppercase transition cursor-pointer select-none bg-black px-3 py-1.5 border border-white/20 rounded-full shadow-lg"
              title="Clear stored data"
            >
              Clear Draft
            </button>
            <span className="text-[10px] font-mono font-black tracking-widest px-3 py-1.5 rounded-full bg-black border border-white/20 text-white uppercase select-none shadow-lg">
              Fee: {isExternalFeeApplicable ? "₹400" : "₹0"}
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

          {/* Terminal body content */}
          <div className="flex-grow p-5 overflow-y-auto custom-scrollbar flex flex-col justify-between">
            <div className="space-y-4">
              
              {/* Heading Printout inside Terminal */}
              <div className="text-center select-none border-b border-white/10 pb-3 mb-2">
                <h2 className="text-sm font-bold tracking-[0.15em] text-white uppercase leading-normal">
                  AURA 2K26 REGISTRATION FORM
                </h2>
              </div>

              {/* Progress Terminal Indicator */}
              <div className="border border-[#4682BF]/20 bg-[#4682BF]/5 px-3.5 py-2.5 rounded font-mono text-xs text-[#4682BF] select-none">
                <div className="flex justify-between mb-1.5 font-bold">
                  <span>STATUS: ACTIVE_SESSION</span>
                  <span>STEP {currentStep} OF 4</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>[</span>
                  <div className="flex-grow flex text-white/20 text-[9px] tracking-tighter">
                    <span className="text-[#4682BF]">{'#'.repeat(currentStep * 5)}</span>
                    <span>{'-'.repeat((4 - currentStep) * 5)}</span>
                  </div>
                  <span>] {Math.round((currentStep / 4) * 100)}%</span>
                </div>
                <div className="flex justify-between mt-2.5 text-xs">
                  <button
                    type="button"
                    onClick={() => handleStepJump(1)}
                    className={`hover:underline cursor-pointer transition-all ${currentStep === 1 ? "text-[#4682BF] font-black" : "text-white/50"}`}
                  >
                    01.Team
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStepJump(2)}
                    className={`hover:underline cursor-pointer transition-all ${currentStep === 2 ? "text-[#4682BF] font-black" : "text-white/50"}`}
                  >
                    02.Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStepJump(3)}
                    className={`hover:underline cursor-pointer transition-all ${currentStep === 3 ? "text-[#4682BF] font-black" : "text-white/50"}`}
                  >
                    03.Specs
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStepJump(4)}
                    className={`hover:underline cursor-pointer transition-all ${currentStep === 4 ? "text-[#4682BF] font-black" : "text-white/50"}`}
                  >
                    04.Submit
                  </button>
                </div>
              </div>

              {/* Form Content Area (With Terminal Scroll Class) */}
              <div className="terminal-scroll-area space-y-4 text-white text-sm max-h-[420px] overflow-y-auto custom-scrollbar pr-1.5">
                {/* STEP 1: TEAM DETAILS */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="text-[11px] text-white/40 uppercase tracking-wider border-b border-white/5 pb-1 select-none">
                      // TEAM CONFIGURATION AND ELIGIBILITY
                    </div>

                    <div id="field-group-1" className="space-y-1.5">
                      <div className="flex items-center gap-2 select-none">
                        <span className="text-[#4682BF] font-bold">$</span>
                        <label className="text-xs tracking-wider text-white/90 uppercase font-semibold">1. Team Size *</label>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {["2 Members", "3 Members", "4 Members"].map((size) => (
                          <button
                            type="button"
                            key={size}
                            onClick={() => {
                              handleTeamSizeChange(size);
                              scrollToNextField(1);
                            }}
                            className={`py-2 text-center text-xs rounded transition-all cursor-pointer select-none ${
                              formData.teamSize === size
                                ? 'bg-[#4682BF]/20 text-[#4682BF] border border-[#4682BF] font-bold shadow'
                                : 'bg-black/50 text-white/80 border border-white/20 hover:border-white/40 hover:bg-white/5'
                            }`}
                          >
                            [ {formData.teamSize === size ? 'X' : ' '} ] {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div id="field-group-2" className="space-y-1.5">
                      <div className="flex items-center gap-2 select-none">
                        <span className="text-[#4682BF] font-bold">$</span>
                        <label className="text-xs tracking-wider text-white/90 uppercase font-semibold">2. Working Physical Prototype? *</label>
                      </div>
                      <div className="relative">
                        <select
                          name="hasWorkingPrototype"
                          value={formData.hasWorkingPrototype}
                          onChange={(e) => {
                            handleTextChange(e);
                            scrollToNextField(2);
                          }}
                          className="w-full bg-[#111] border border-white/25 focus:border-[#4682BF] text-white text-sm focus:outline-none transition-all py-2 px-2.5 appearance-none cursor-pointer rounded"
                        >
                          <option value="Yes, fully working">Yes, fully working</option>
                          <option value="Yes, working with minor limitations">Yes, working with minor limitations</option>
                          <option value="No">No</option>
                        </select>
                        <span className="absolute right-3 top-2.5 text-[8px] text-white/40 pointer-events-none select-none">▼</span>
                      </div>
                    </div>

                    <div id="field-group-3" className="space-y-1.5">
                      <div className="flex items-center gap-2 select-none">
                        <span className="text-[#4682BF] font-bold">$</span>
                        <label className="text-xs tracking-wider text-white/90 uppercase font-semibold">3. Team Affiliation *</label>
                      </div>
                      <div className="space-y-2">
                        {[
                          "All members are from Aliah University",
                          "All members are from another institution",
                          "Mixed team: Aliah University + other institution(s)"
                        ].map((affiliation) => (
                          <button
                            type="button"
                            key={affiliation}
                            onClick={() => {
                              handleAffiliationChange(affiliation);
                              scrollToNextField(3);
                            }}
                            className={`w-full text-left py-2 px-3.5 rounded text-xs transition-all cursor-pointer select-none ${
                              formData.teamAffiliation === affiliation
                                ? 'bg-[#4682BF]/20 text-[#4682BF] border border-[#4682BF] font-bold shadow'
                                : 'bg-black/50 text-white/80 border border-white/20 hover:border-white/40 hover:bg-white/5'
                            }`}
                          >
                            [ {formData.teamAffiliation === affiliation ? 'X' : ' '} ] {affiliation}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Member counts details grids */}
                    <div id="field-group-4" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 select-none">
                          <span className="text-[#4682BF] font-bold">$</span>
                          <label className="text-xs tracking-wider text-white/90 uppercase font-semibold">4. Aliah Members *</label>
                        </div>
                        <div className="grid grid-cols-5 gap-1.5">
                          {[0, 1, 2, 3, 4].map((num) => (
                            <button
                              type="button"
                              key={num}
                              onClick={() => {
                                setFormData({ ...formData, aliahMembersCount: num });
                                scrollToNextField(4);
                              }}
                              className={`py-1.5 text-center text-xs rounded transition-all cursor-pointer select-none ${
                                Number(formData.aliahMembersCount) === num
                                  ? 'bg-[#4682BF]/20 text-[#4682BF] border border-[#4682BF] font-bold shadow'
                                  : 'bg-black/50 text-white/80 border border-white/20 hover:border-white/40 hover:bg-white/5'
                              }`}
                            >
                              [{num}]
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 select-none">
                          <span className="text-[#4682BF] font-bold">$</span>
                          <label className="text-xs tracking-wider text-white/90 uppercase font-semibold">5. Other Members *</label>
                        </div>
                        <div className="grid grid-cols-5 gap-1.5">
                          {[0, 1, 2, 3, 4].map((num) => (
                            <button
                              type="button"
                              key={num}
                              onClick={() => {
                                setFormData({ ...formData, otherMembersCount: num });
                                scrollToNextField(4);
                              }}
                              className={`py-1.5 text-center text-xs rounded transition-all cursor-pointer select-none ${
                                Number(formData.otherMembersCount) === num
                                  ? 'bg-[#4682BF]/20 text-[#4682BF] border border-[#4682BF] font-bold shadow'
                                  : 'bg-black/50 text-white/80 border border-white/20 hover:border-white/40 hover:bg-white/5'
                              }`}
                            >
                              [{num}]
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-2 border-t border-white/5">
                      <div id="field-group-5" className="space-y-1">
                        <div className="flex items-center gap-2 select-none">
                          <span className="text-[#4682BF] font-bold">$</span>
                          <label className="text-xs tracking-wider text-white/90 uppercase font-semibold">6. Team Name *</label>
                        </div>
                        <input
                          type="text"
                          name="teamName"
                          value={formData.teamName}
                          onChange={handleTextChange}
                          onBlur={() => scrollToNextField(5)}
                          onKeyDown={(e) => e.key === 'Enter' && scrollToNextField(5)}
                          placeholder="Enter team name"
                          className="w-full bg-black/40 border border-white/20 focus:border-[#4682BF] text-white text-sm focus:outline-none transition-all py-2 px-3 rounded placeholder:text-white/25"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div id="field-group-6" className="space-y-1">
                          <div className="flex items-center gap-1.5 select-none">
                            <span className="text-[#4682BF] font-bold">$</span>
                            <label className="text-xs tracking-wider text-white/90 uppercase font-semibold font-semibold">7. Leader Name *</label>
                          </div>
                          <input
                            type="text"
                            name="teamLeaderName"
                            value={formData.teamLeaderName}
                            onChange={handleTextChange}
                            onBlur={() => scrollToNextField(6)}
                            onKeyDown={(e) => e.key === 'Enter' && scrollToNextField(6)}
                            placeholder="Full Name"
                            className="w-full bg-black/40 border border-white/20 focus:border-[#4682BF] text-white text-sm focus:outline-none transition-all py-2 px-3 rounded placeholder:text-white/25"
                          />
                        </div>
                        <div id="field-group-7" className="space-y-1">
                          <div className="flex items-center gap-1.5 select-none">
                            <span className="text-[#4682BF] font-bold">$</span>
                            <label className="text-xs tracking-wider text-white/90 uppercase font-semibold">8. Email *</label>
                          </div>
                          <input
                            type="email"
                            name="teamLeaderEmail"
                            value={formData.teamLeaderEmail}
                            onChange={handleTextChange}
                            onBlur={() => scrollToNextField(7)}
                            onKeyDown={(e) => e.key === 'Enter' && scrollToNextField(7)}
                            placeholder="leader@gmail.com"
                            className="w-full bg-black/40 border border-white/20 focus:border-[#4682BF] text-white text-sm focus:outline-none transition-all py-2 px-3 rounded placeholder:text-white/25"
                          />
                        </div>
                        <div id="field-group-8" className="space-y-1">
                          <div className="flex items-center gap-1.5 select-none">
                            <span className="text-[#4682BF] font-bold">$</span>
                            <label className="text-xs tracking-wider text-white/90 uppercase font-semibold">9. Phone *</label>
                          </div>
                          <input
                            type="tel"
                            name="teamLeaderPhone"
                            value={formData.teamLeaderPhone}
                            onChange={handleTextChange}
                            onBlur={() => scrollToNextField(8)}
                            onKeyDown={(e) => e.key === 'Enter' && scrollToNextField(8)}
                            placeholder="10-digit number"
                            className="w-full bg-black/40 border border-white/20 focus:border-[#4682BF] text-white text-sm focus:outline-none transition-all py-2 px-3 rounded placeholder:text-white/25"
                          />
                        </div>
                      </div>

                      <div id="field-group-9" className="space-y-1">
                        <div className="flex items-center gap-2 select-none">
                          <span className="text-[#4682BF] font-bold">$</span>
                          <label className="text-xs tracking-wider text-white/90 uppercase font-semibold">10. Other Members details *</label>
                        </div>
                        <textarea
                          rows={3}
                          name="teamMembersDetails"
                          value={formData.teamMembersDetails}
                          onChange={handleTextChange}
                          placeholder="e.g. John Doe | Aliah University | CSE | Year 2 | +91 9876543210"
                          className="w-full bg-black/40 border border-white/20 rounded p-2.5 focus:border-[#4682BF] text-white text-sm focus:outline-none transition-all placeholder:text-white/25"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: PROJECT PROFILE */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="text-[11px] text-white/40 uppercase tracking-wider border-b border-white/5 pb-1 select-none">
                      // HARDWARE PROJECT PROFILE & PROBLEMS
                    </div>

                    <div id="field-group-11" className="space-y-1">
                      <div className="flex items-center gap-2 select-none">
                        <span className="text-[#4682BF] font-bold">$</span>
                        <label className="text-xs tracking-wider text-white/90 uppercase font-semibold">11. Project Title *</label>
                      </div>
                      <input
                        type="text"
                        name="projectTitle"
                        value={formData.projectTitle}
                        onChange={handleTextChange}
                        onBlur={() => scrollToNextField(11)}
                        onKeyDown={(e) => e.key === 'Enter' && scrollToNextField(11)}
                        placeholder="Enter project name"
                        className="w-full bg-black/40 border border-white/20 focus:border-[#4682BF] text-white text-sm focus:outline-none transition-all py-2 px-3 rounded placeholder:text-white/25"
                      />
                    </div>

                    <div id="field-group-12" className="space-y-1.5">
                      <div className="flex items-center gap-2 select-none">
                        <span className="text-[#4682BF] font-bold">$</span>
                        <label className="text-xs tracking-wider text-white/90 uppercase font-semibold">12. Project Categories *</label>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[140px] overflow-y-auto custom-scrollbar bg-black/30 p-2.5 border border-white/25 rounded">
                        {CATEGORIES.map((cat) => {
                          const selected = formData.categories.includes(cat);
                          return (
                            <button
                              type="button"
                              key={cat}
                              onClick={() => {
                                toggleArrayItem("categories", cat);
                                scrollToNextField(12);
                              }}
                              className={`text-left py-1.5 px-2 rounded text-xs transition-all cursor-pointer select-none ${
                                selected
                                  ? 'bg-[#4682BF]/20 text-[#4682BF] border border-[#4682BF] font-bold shadow'
                                  : 'bg-black/50 text-white/80 border border-white/20 hover:border-white/40 hover:bg-white/5'
                              }`}
                            >
                              [ {selected ? 'X' : ' '} ] {cat}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div id="field-group-13" className="space-y-1.5">
                        <div className="flex items-center gap-2 select-none">
                          <span className="text-[#4682BF] font-bold">$</span>
                          <label className="text-xs tracking-wider text-white/90 uppercase font-semibold">13. Prototype Type *</label>
                        </div>
                        <div className="relative">
                          <select
                            name="prototypeType"
                            value={formData.prototypeType}
                            onChange={(e) => {
                              handleTextChange(e);
                              scrollToNextField(13);
                            }}
                            className="w-full bg-[#111] border border-white/25 focus:border-[#4682BF] text-white text-sm focus:outline-none transition-all py-2 px-2.5 appearance-none cursor-pointer rounded"
                          >
                            {PROTOTYPE_TYPES.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                          <span className="absolute right-3 top-2.5 text-[8px] text-white/40 pointer-events-none select-none">▼</span>
                        </div>
                      </div>

                      <div id="field-group-14" className="space-y-1.5">
                        <div className="flex items-center gap-2 select-none">
                          <span className="text-[#4682BF] font-bold">$</span>
                          <label className="text-xs tracking-wider text-white/90 uppercase font-semibold">14. Working Status *</label>
                        </div>
                        <div className="relative">
                          <select
                            name="workingStatus"
                            value={formData.workingStatus}
                            onChange={(e) => {
                              handleTextChange(e);
                              scrollToNextField(14);
                            }}
                            className="w-full bg-[#111] border border-white/25 focus:border-[#4682BF] text-white text-sm focus:outline-none transition-all py-2 px-2.5 appearance-none cursor-pointer rounded"
                          >
                            {WORKING_STATUSES.map((status) => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                          <span className="absolute right-3 top-2.5 text-[8px] text-white/40 pointer-events-none select-none">▼</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-2 border-t border-white/5">
                      <div id="field-group-15" className="space-y-1">
                        <div className="flex justify-between items-center select-none">
                          <div className="flex items-center gap-2">
                            <span className="text-[#4682BF] font-bold">$</span>
                            <label className="text-xs tracking-wider text-white/90 uppercase font-semibold">15. Problem Solved *</label>
                          </div>
                          <span className="text-[9px] text-white/40">{countWords(formData.problemStatement)}/150 words</span>
                        </div>
                        <textarea
                          rows={2}
                          name="problemStatement"
                          value={formData.problemStatement}
                          onChange={handleTextChange}
                          onBlur={() => scrollToNextField(15)}
                          placeholder="Describe the exact problem your hardware is solving"
                          className="w-full bg-black/40 border border-white/20 rounded p-2.5 focus:border-[#4682BF] text-white text-sm focus:outline-none transition-all placeholder:text-white/25"
                        />
                      </div>

                      <div id="field-group-16" className="space-y-1">
                        <div className="flex justify-between items-center select-none">
                          <div className="flex items-center gap-2">
                            <span className="text-[#4682BF] font-bold">$</span>
                            <label className="text-xs tracking-wider text-white/90 uppercase font-semibold">16. Solution Description *</label>
                          </div>
                          <span className="text-[9px] text-white/40">{countWords(formData.solutionDescription)}/200 words</span>
                        </div>
                        <textarea
                          rows={2}
                          name="solutionDescription"
                          value={formData.solutionDescription}
                          onChange={handleTextChange}
                          onBlur={() => scrollToNextField(16)}
                          placeholder="How does your hardware prototype solve the problem?"
                          className="w-full bg-black/40 border border-white/20 rounded p-2.5 focus:border-[#4682BF] text-white text-sm focus:outline-none transition-all placeholder:text-white/25"
                        />
                      </div>

                      <div id="field-group-17" className="space-y-1">
                        <div className="flex items-center gap-2 select-none">
                          <span className="text-[#4682BF] font-bold">$</span>
                          <label className="text-xs tracking-wider text-white/90 uppercase font-semibold">17. Innovation Details *</label>
                        </div>
                        <textarea
                          rows={2}
                          name="innovationDetails"
                          value={formData.innovationDetails}
                          onChange={handleTextChange}
                          onBlur={() => scrollToNextField(17)}
                          placeholder="What is unique about your hardware compared to existing systems?"
                          className="w-full bg-black/40 border border-white/20 rounded p-2.5 focus:border-[#4682BF] text-white text-sm focus:outline-none transition-all placeholder:text-white/25"
                        />
                      </div>

                      <div id="field-group-18" className="space-y-1.5">
                        <div className="flex items-center gap-2 select-none">
                          <span className="text-[#4682BF] font-bold">$</span>
                          <label className="text-xs tracking-wider text-white/90 uppercase font-semibold">18. Intended Beneficiaries *</label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[110px] overflow-y-auto custom-scrollbar bg-black/30 p-2.5 border border-white/25 rounded">
                          {BENEFICIARIES.map((ben) => {
                            const selected = formData.beneficiaries.includes(ben);
                            return (
                              <button
                                type="button"
                                key={ben}
                                onClick={() => {
                                  toggleArrayItem("beneficiaries", ben);
                                  scrollToNextField(18);
                                }}
                                className={`text-left py-1.5 px-2 rounded text-xs transition-all cursor-pointer select-none ${
                                  selected
                                    ? 'bg-[#4682BF]/20 text-[#4682BF] border border-[#4682BF] font-bold shadow'
                                    : 'bg-black/50 text-white/80 border border-white/20 hover:border-white/40 hover:bg-white/5'
                                }`}
                              >
                                [ {selected ? 'X' : ' '} ] {ben}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: TECHNICAL DETAILS */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="text-[11px] text-white/40 uppercase tracking-wider border-b border-white/5 pb-1 select-none">
                      // SYSTEM SPECIFICATIONS AND WORKINGS
                    </div>

                    <div id="field-group-21" className="space-y-1">
                      <div className="flex justify-between items-center select-none">
                        <div className="flex items-center gap-2">
                          <span className="text-[#4682BF] font-bold">$</span>
                          <label className="text-xs tracking-wider text-white/90 uppercase font-semibold">19. Working Principle *</label>
                        </div>
                        <span className="text-[9px] text-white/40">{countWords(formData.workingPrinciple)}/250 words</span>
                      </div>
                      <textarea
                        rows={3}
                        name="workingPrinciple"
                        value={formData.workingPrinciple}
                        onChange={handleTextChange}
                        onBlur={() => scrollToNextField(21)}
                        placeholder="Explain the technical principle / workflow of your system"
                        className="w-full bg-black/40 border border-white/20 rounded p-2.5 focus:border-[#4682BF] text-white text-sm focus:outline-none transition-all placeholder:text-white/25"
                      />
                    </div>

                    <div id="field-group-22" className="space-y-1">
                      <div className="flex items-center gap-2 select-none">
                        <span className="text-[#4682BF] font-bold">$</span>
                        <label className="text-xs tracking-wider text-white/90 uppercase font-semibold">20. Major Hardware Components *</label>
                      </div>
                      <input
                        type="text"
                        name="hardwareComponents"
                        value={formData.hardwareComponents}
                        onChange={handleTextChange}
                        onBlur={() => scrollToNextField(22)}
                        onKeyDown={(e) => e.key === 'Enter' && scrollToNextField(22)}
                        placeholder="e.g. ESP32, Arduino, motors, sensors, PCB, battery..."
                        className="w-full bg-black/40 border border-white/20 focus:border-[#4682BF] text-white text-sm focus:outline-none transition-all py-2 px-3 rounded placeholder:text-white/25"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div id="field-group-23" className="space-y-1.5">
                        <div className="flex items-center gap-1.5 select-none">
                          <span className="text-[#4682BF] font-bold">$</span>
                          <label className="text-xs tracking-wider text-white/90 uppercase font-semibold">21. Uses AI? *</label>
                        </div>
                        <div className="relative">
                          <select
                            name="usesAI"
                            value={formData.usesAI}
                            onChange={(e) => {
                              handleTextChange(e);
                              scrollToNextField(23);
                            }}
                            className="w-full bg-[#111] border border-white/25 focus:border-[#4682BF] text-white text-sm focus:outline-none transition-all py-2 px-2.5 appearance-none cursor-pointer rounded"
                          >
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                          <span className="absolute right-3 top-2.5 text-[8px] text-white/40 pointer-events-none select-none">▼</span>
                        </div>
                      </div>

                      <div id="field-group-24" className="space-y-1.5">
                        <div className="flex items-center gap-1.5 select-none">
                          <span className="text-[#4682BF] font-bold">$</span>
                          <label className="text-xs tracking-wider text-white/90 uppercase font-semibold">22. Uses IoT? *</label>
                        </div>
                        <div className="relative">
                          <select
                            name="usesIoT"
                            value={formData.usesIoT}
                            onChange={(e) => {
                              handleTextChange(e);
                              scrollToNextField(24);
                            }}
                            className="w-full bg-[#111] border border-white/25 focus:border-[#4682BF] text-white text-sm focus:outline-none transition-all py-2 px-2.5 appearance-none cursor-pointer rounded"
                          >
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                          <span className="absolute right-3 top-2.5 text-[8px] text-white/40 pointer-events-none select-none">▼</span>
                        </div>
                      </div>

                      <div id="field-group-25" className="space-y-1.5">
                        <div className="flex items-center gap-1.5 select-none">
                          <span className="text-[#4682BF] font-bold">$</span>
                          <label className="text-xs tracking-wider text-white/90 uppercase font-semibold">23. Power Source *</label>
                        </div>
                        <div className="relative">
                          <select
                            name="powerSource"
                            value={formData.powerSource}
                            onChange={(e) => {
                              handleTextChange(e);
                              scrollToNextField(25);
                            }}
                            className="w-full bg-[#111] border border-white/25 focus:border-[#4682BF] text-white text-sm focus:outline-none transition-all py-2 px-2.5 appearance-none cursor-pointer rounded"
                          >
                            {POWER_SOURCES.map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                          <span className="absolute right-3 top-2.5 text-[8px] text-white/40 pointer-events-none select-none">▼</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-2 border-t border-white/5">
                      <div id="field-group-26" className="space-y-1">
                        <div className="flex items-center gap-2 select-none">
                          <span className="text-[#4682BF] font-bold">$</span>
                          <label className="text-xs tracking-wider text-white/90 uppercase font-semibold">24. Potential Real-World Impact *</label>
                        </div>
                        <textarea
                          rows={2}
                          name="realWorldImpact"
                          value={formData.realWorldImpact}
                          onChange={handleTextChange}
                          onBlur={() => scrollToNextField(26)}
                          placeholder="Who benefits from this? How does it improve current standards?"
                          className="w-full bg-black/40 border border-white/20 rounded p-2.5 focus:border-[#4682BF] text-white text-sm focus:outline-none transition-all placeholder:text-white/25"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div id="field-group-27" className="space-y-1.5">
                          <div className="flex items-center gap-2 select-none">
                            <span className="text-[#4682BF] font-bold">$</span>
                            <label className="text-xs tracking-wider text-white/90 uppercase font-semibold">25. Practical product potential? *</label>
                          </div>
                          <div className="relative">
                            <select
                              name="deployableSystem"
                              value={formData.deployableSystem}
                              onChange={(e) => {
                                handleTextChange(e);
                                scrollToNextField(27);
                              }}
                              className="w-full bg-[#111] border border-white/25 focus:border-[#4682BF] text-white text-sm focus:outline-none transition-all py-2 px-2.5 appearance-none cursor-pointer rounded"
                            >
                              <option value="Yes">Yes</option>
                              <option value="Potentially">Potentially</option>
                              <option value="No">No</option>
                            </select>
                            <span className="absolute right-3 top-2.5 text-[8px] text-white/40 pointer-events-none select-none">▼</span>
                          </div>
                        </div>

                        <div id="field-group-28" className="space-y-1">
                          <div className="flex items-center gap-2 select-none">
                            <span className="text-[#4682BF] font-bold">$</span>
                            <label className="text-xs tracking-wider text-white/90 uppercase font-semibold">26. Dev Cost (INR ₹) *</label>
                          </div>
                          <input
                            type="number"
                            name="developmentCost"
                            value={formData.developmentCost}
                            onChange={handleTextChange}
                            onBlur={() => scrollToNextField(28)}
                            onKeyDown={(e) => e.key === 'Enter' && scrollToNextField(28)}
                            placeholder="Amount in ₹"
                            className="w-full bg-black/40 border border-white/20 focus:border-[#4682BF] text-white text-sm focus:outline-none transition-all py-2 px-3 rounded placeholder:text-white/25"
                          />
                        </div>
                      </div>

                      <div id="field-group-29" className="space-y-1">
                        <div className="flex justify-between items-center select-none">
                          <div className="flex items-center gap-2">
                            <span className="text-[#4682BF] font-bold">$</span>
                            <label className="text-xs tracking-wider text-white/90 uppercase font-semibold">27. Why worth seeing at live demo? *</label>
                          </div>
                          <span className="text-[9px] text-white/40">{countWords(formData.whyWorthSeeing)}/100 words</span>
                        </div>
                        <textarea
                          rows={2}
                          name="whyWorthSeeing"
                          value={formData.whyWorthSeeing}
                          onChange={handleTextChange}
                          placeholder="Highlight what will stand out during live assessment"
                          className="w-full bg-black/40 border border-white/20 rounded p-2.5 focus:border-[#4682BF] text-white text-sm focus:outline-none transition-all placeholder:text-white/25"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: SAFETY, ORIGINALITY, FEES, DECLARATIONS */}
                {currentStep === 4 && (
                  <div className="space-y-4">
                    <div className="text-[11px] text-white/40 uppercase tracking-wider border-b border-white/5 pb-1 select-none">
                      // HAZARDS, ORIGINALITY, FEES & CONFIRMATION
                    </div>

                    <div id="field-group-31" className="space-y-1.5">
                      <div className="flex items-center gap-2 select-none">
                        <span className="text-[#4682BF] font-bold">$</span>
                        <label className="text-xs tracking-wider text-white/90 uppercase font-semibold">28. Safety Hazard Involvements *</label>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[110px] overflow-y-auto custom-scrollbar bg-black/30 p-2.5 border border-white/25 rounded">
                        {SAFETY_HAZARDS.map((hazard) => {
                          const selected = formData.safetyHazards.includes(hazard);
                          return (
                            <button
                              type="button"
                              key={hazard}
                              onClick={() => {
                                toggleArrayItem("safetyHazards", hazard);
                                scrollToNextField(31);
                              }}
                              className={`text-left py-1.5 px-2 rounded text-xs transition-all cursor-pointer select-none ${
                                selected
                                  ? 'bg-[#4682BF]/20 text-[#4682BF] border border-[#4682BF] font-bold shadow'
                                  : 'bg-black/50 text-white/80 border border-white/20 hover:border-white/40 hover:bg-white/5'
                              }`}
                            >
                              [ {selected ? 'X' : ' '} ] {hazard}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div id="field-group-32" className="space-y-1">
                        <div className="flex items-center gap-2 select-none">
                          <span className="text-[#4682BF] font-bold">$</span>
                          <label className="text-xs tracking-wider text-white/90 uppercase font-semibold">29. Safety Precautions</label>
                        </div>
                        <textarea
                          rows={1}
                          name="safetyPrecautions"
                          value={formData.safetyPrecautions}
                          onChange={handleTextChange}
                          onBlur={() => scrollToNextField(32)}
                          placeholder="List precautions taken to safeguard observers"
                          className="w-full bg-black/40 border border-white/20 rounded p-2 focus:border-[#4682BF] text-white text-sm focus:outline-none transition-all placeholder:text-white/25"
                        />
                      </div>

                      <div id="field-group-33" className="space-y-1.5">
                        <div className="flex items-center gap-2 select-none">
                          <span className="text-[#4682BF] font-bold">$</span>
                          <label className="text-xs tracking-wider text-white/90 uppercase font-semibold">30. Constant Supervision? *</label>
                        </div>
                        <div className="relative">
                          <select
                            name="requiresSupervision"
                            value={formData.requiresSupervision}
                            onChange={(e) => {
                              handleTextChange(e);
                              scrollToNextField(33);
                            }}
                            className="w-full bg-[#111] border border-white/25 focus:border-[#4682BF] text-white text-sm focus:outline-none transition-all py-2 px-2.5 appearance-none cursor-pointer rounded"
                          >
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                          <span className="absolute right-3 top-2.5 text-[8px] text-white/40 pointer-events-none select-none">▼</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/5">
                      <div id="field-group-34" className="space-y-1.5">
                        <div className="flex items-center gap-2 select-none">
                          <span className="text-[#4682BF] font-bold">$</span>
                          <label className="text-xs tracking-wider text-white/90 uppercase font-semibold">31. Solely Team Developed? *</label>
                        </div>
                        <div className="relative">
                          <select
                            name="developedByTeam"
                            value={formData.developedByTeam}
                            onChange={(e) => {
                              handleTextChange(e);
                              scrollToNextField(34);
                            }}
                            className="w-full bg-[#111] border border-white/25 focus:border-[#4682BF] text-white text-sm focus:outline-none transition-all py-2 px-2.5 appearance-none cursor-pointer rounded"
                          >
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                            <option value="External Assistance">Developed with External Assistance</option>
                          </select>
                          <span className="absolute right-3 top-2.5 text-[8px] text-white/40 pointer-events-none select-none">▼</span>
                        </div>
                      </div>

                      <div id="field-group-35" className="space-y-1.5">
                        <div className="flex items-center gap-2 select-none">
                          <span className="text-[#4682BF] font-bold">$</span>
                          <label className="text-xs tracking-wider text-white/90 uppercase font-semibold">32. Previously Exhibited? *</label>
                        </div>
                        <div className="relative">
                          <select
                            name="previouslyExhibited"
                            value={formData.previouslyExhibited}
                            onChange={(e) => {
                              handleTextChange(e);
                              scrollToNextField(35);
                            }}
                            className="w-full bg-[#111] border border-white/25 focus:border-[#4682BF] text-white text-sm focus:outline-none transition-all py-2 px-2.5 appearance-none cursor-pointer rounded"
                          >
                            <option value="No">No</option>
                            <option value="Yes">Yes</option>
                          </select>
                          <span className="absolute right-3 top-2.5 text-[8px] text-white/40 pointer-events-none select-none">▼</span>
                        </div>
                      </div>
                    </div>

                    {formData.previouslyExhibited === "Yes" && (
                      <div id="field-group-36" className="space-y-1">
                        <div className="flex items-center gap-2 select-none">
                          <span className="text-[#4682BF] font-bold">$</span>
                          <label className="text-xs tracking-wider text-white/90 uppercase font-semibold">32a. Previous Exhibition Details *</label>
                        </div>
                        <textarea
                          rows={2}
                          name="exhibitionDetails"
                          value={formData.exhibitionDetails}
                          onChange={handleTextChange}
                          onBlur={() => scrollToNextField(36)}
                          placeholder="Specify festival name, year, awards won (if any)"
                          className="w-full bg-black/40 border border-white/20 rounded p-2.5 focus:border-[#4682BF] text-white text-sm focus:outline-none transition-all placeholder:text-white/25"
                        />
                      </div>
                    )}

                    {/* Fees Details */}
                    <div id="field-group-37" className="space-y-2 pt-2 border-t border-white/5">
                      <div className="text-[11px] text-white/40 uppercase tracking-wider select-none">// REGISTRATION FEE STATUS</div>
                      <div className="bg-white/5 border border-white/10 p-3 rounded space-y-2">
                        <div className="flex justify-between items-center select-none">
                          <span className={`px-3 py-1 border rounded-full text-[9px] font-bold tracking-widest uppercase ${isExternalFeeApplicable ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-[#4682BF]/20 text-[#4682BF] border-2 border-[#4682BF]/40'}`}>
                            {isExternalFeeApplicable ? "₹400 Fee Applicable" : "₹0 (No external fee)"}
                          </span>
                        </div>
                        <p className="text-xs text-white/80 leading-normal select-none">
                          A ₹400 registration fee applies to teams where 50% or more members are from outside Aliah University[cite: 1, 4]. Other teams are fully subsidized[cite: 1, 4].
                        </p>

                        {isExternalFeeApplicable && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-white/5">
                            <div id="field-group-38" className="space-y-1">
                              <label className="block text-[9px] text-white/60 uppercase">UTR / Transaction ID *</label>
                              <input
                                type="text"
                                name="transactionId"
                                value={formData.transactionId}
                                onChange={handleTextChange}
                                onBlur={() => scrollToNextField(38)}
                                onKeyDown={(e) => e.key === 'Enter' && scrollToNextField(38)}
                                placeholder="Enter 12-digit UTR"
                                className="w-full bg-black/40 border-b border-white/20 focus:border-[#4682BF] text-white text-sm focus:outline-none transition-all py-1.5 px-0.5"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[9px] text-white/60 uppercase">Screenshot Upload *</label>
                              <input
                                type="file"
                                name="paymentScreenshot"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="w-full text-xs text-white/50 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border file:border-white/20 file:text-[9px] file:bg-white/5 file:text-white cursor-pointer"
                              />
                              {formData.paymentScreenshotPreview && (
                                <span className="text-[9px] text-[#4682BF] font-bold block mt-0.5">✓ Screenshot attached</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Mandatory Declarations */}
                    <div id="field-group-39" className="space-y-2 pt-2 border-t border-white/5">
                      <div className="text-[11px] text-white/40 uppercase tracking-wider select-none">// MANDATORY DECLARATIONS</div>
                      <div className="space-y-2 bg-black/35 p-3 border border-white/10 rounded">
                        {[
                          { key: "declWorkingPrototype", text: "33. Working Prototype: We confirm that this is a working physical prototype." },
                          { key: "declOriginality", text: "34. Originality: We certify that this prototype was primarily developed by us." },
                          { key: "declSafetyRules", text: "35. Safety & Event Rules: We agree to follow all safety regulations of AURA 2026." },
                          { key: "declMediaPermission", text: "36. Media Permission: We permit AURA 2026 to showcase our project." },
                          { key: "declFinalConfirmation", text: "37. Final Confirmation: We confirm that all info provided is accurate." }
                        ].map((decl) => (
                          <label key={decl.key} className="flex items-start gap-2.5 cursor-pointer text-xs text-white hover:text-[#4682BF] transition select-none leading-relaxed">
                            <input
                              type="checkbox"
                              checked={formData[decl.key]}
                              onChange={(e) => setFormData({ ...formData, [decl.key]: e.target.checked })}
                              className="mt-0.5 w-3.5 h-3.5 bg-black border border-white/25 rounded text-[#4682BF] focus:ring-0 cursor-pointer"
                            />
                            <span>{decl.text}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Wizard Footer Controls */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10 select-none flex-shrink-0">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1}
                className={`px-4 py-1.5 border text-[10px] font-bold tracking-widest uppercase transition-all duration-150 cursor-pointer ${
                  currentStep === 1
                    ? 'opacity-20 cursor-not-allowed border-white/10 text-white/30 bg-transparent'
                    : 'border-white bg-black/40 hover:bg-white hover:text-black text-white shadow-lg'
                }`}
              >
                ← Prev
              </button>

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-5 py-1.5 border border-[#4682BF] rounded bg-transparent hover:bg-[#4682BF] hover:text-black text-white text-[10px] font-bold tracking-widest uppercase transition-all duration-150 cursor-pointer shadow-lg"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleSubmit}
                  className={`border rounded px-6 py-1.5 text-[10px] font-bold tracking-widest uppercase transition-all duration-150 cursor-pointer shadow-lg ${
                    isPending 
                      ? 'opacity-40 cursor-not-allowed border-white/20 bg-transparent text-white/40' 
                      : 'border-[#4682BF] bg-[#4682BF]/20 text-[#4682BF] hover:bg-[#4682BF] hover:text-black hover:border-[#4682BF]'
                  }`}
                >
                  {isPending ? "Running..." : "Execute Submit"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}