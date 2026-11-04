import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Upload,
  QrCode,
  Users,
  CreditCard,
  ArrowLeft,
  RefreshCw,
  Clock,
  Download,
  Building,
  Check,
  XCircle,
  AlertTriangle,
  FileText,
} from "lucide-react";

import auraLogo from "../../assets/AURA_26_LOGO.png";
import paymentQrImage from "../../assets/payment_qr.jpeg";

const PAYMENT_QR_URL =
  "https://res.cloudinary.com/dxkje9whm/image/upload/v1793797831/payment-qr-aura_vyvsvw.jpg";

const rawApiUrl = import.meta.env.VITE_API_URL;
const API_URL =
  rawApiUrl && rawApiUrl !== "undefined"
    ? rawApiUrl.replace(/\/$/, "")
    : import.meta.env.DEV
    ? "http://localhost:5000"
    : "";

const SESSION_TOKEN_KEY = "aura_2026_rsvp_token";
const SESSION_REG_ID_KEY = "aura_2026_rsvp_reg_id";
const SESSION_EMAIL_KEY = "aura_2026_rsvp_email";

export default function RsvpPage() {
  // Verification step state
  const [step, setStep] = useState("auth"); // 'auth' | 'dashboard' | 'success'
  const [registrationId, setRegistrationId] = useState(
    () => sessionStorage.getItem(SESSION_REG_ID_KEY) || ""
  );
  const [email, setEmail] = useState(
    () => sessionStorage.getItem(SESSION_EMAIL_KEY) || ""
  );
  const [token, setToken] = useState(
    () => sessionStorage.getItem(SESSION_TOKEN_KEY) || ""
  );

  // Loading & error state
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);

  // Team & RSVP details
  const [teamData, setTeamData] = useState(null);
  const [calculation, setCalculation] = useState(null);
  const [rsvpRecord, setRsvpRecord] = useState(null);

  // Payment form state
  const [paymentRefNumber, setPaymentRefNumber] = useState("");
  const [paymentScreenshotFile, setPaymentScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Fetch RSVP Details with Session Token
  const fetchRsvpDetails = useCallback(async (sessionToken) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch(`${API_URL}/api/rsvp/details`, {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Session expired. Please sign in again.");
      }

      setTeamData(data.registration);
      setCalculation(data.calculation);
      setRsvpRecord(data.rsvp);

      if (data.rsvp && data.rsvp.rsvpStatus !== "not_submitted") {
        setStep("success");
      } else {
        setStep("dashboard");
      }
    } catch (err) {
      console.error("Failed to fetch RSVP details:", err);
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
      setToken("");
      setStep("auth");
      setErrorMessage(err.message || "Failed to load RSVP details.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Check existing session token on mount
  useEffect(() => {
    const savedToken = sessionStorage.getItem(SESSION_TOKEN_KEY);
    if (savedToken) {
      fetchRsvpDetails(savedToken);
    }
  }, [fetchRsvpDetails]);

  // 1. Verify Team Registration ID & Leader Email
  const handleVerifyCredentials = async (e) => {
    e?.preventDefault();
    const trimmedRegId = registrationId.trim().toUpperCase();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedRegId) {
      setErrorMessage("Please enter your Team Registration ID.");
      return;
    }

    if (!trimmedEmail) {
      setErrorMessage("Please enter the registered Team Leader Email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage("Please enter a valid email address format.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch(`${API_URL}/api/rsvp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: trimmedRegId,
          email: trimmedEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Invalid Registration ID or Leader Email.");
      }

      sessionStorage.setItem(SESSION_TOKEN_KEY, data.token);
      sessionStorage.setItem(SESSION_REG_ID_KEY, data.registrationId);
      sessionStorage.setItem(SESSION_EMAIL_KEY, trimmedEmail);

      setToken(data.token);
      await fetchRsvpDetails(data.token);
    } catch (err) {
      setErrorMessage(err.message || "Verification failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Screenshot File Selection
  const handleScreenshotChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErrorMessage("Please upload an image file (JPG, PNG, or WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Screenshot file size must be less than 5 MB.");
      return;
    }

    setPaymentScreenshotFile(file);
    setScreenshotPreview(URL.createObjectURL(file));
    setErrorMessage("");
  };

  // 3. Submit RSVP Confirmation
  const handleSubmitRsvp = async (e) => {
    e?.preventDefault();
    const amount = calculation?.amountPayable || 0;

    if (amount > 0) {
      if (!paymentRefNumber || !paymentRefNumber.trim()) {
        setErrorMessage("Please enter the Payment Reference / UTR Number.");
        return;
      }
      if (!paymentScreenshotFile && !rsvpRecord?.paymentScreenshotUrl) {
        setErrorMessage("Please upload the payment transaction screenshot.");
        return;
      }
    }

    if (!agreedToTerms) {
      setErrorMessage("Please check the confirmation box to proceed.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const formData = new FormData();
      if (amount > 0) {
        formData.append("paymentReferenceNumber", paymentRefNumber.trim());
        if (paymentScreenshotFile) {
          formData.append("paymentScreenshot", paymentScreenshotFile);
        }
      }

      const res = await fetch(`${API_URL}/api/rsvp/submit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to submit RSVP.");
      }

      setRsvpRecord(data.rsvp);
      setSuccessMessage(data.message);
      setStep("success");
    } catch (err) {
      setErrorMessage(err.message || "Submission failed. Please check inputs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Logout / Switch Team
  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    sessionStorage.removeItem(SESSION_REG_ID_KEY);
    sessionStorage.removeItem(SESSION_EMAIL_KEY);
    setToken("");
    setRegistrationId("");
    setEmail("");
    setTeamData(null);
    setCalculation(null);
    setRsvpRecord(null);
    setStep("auth");
    setErrorMessage("");
    setSuccessMessage("");
  };

  return (
    <div className="min-h-screen bg-[#0b0909] text-white selection:bg-purple-500 selection:text-white relative">
      {/* Background Dots Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1.5px,transparent_1.5px)] [background-size:28px_28px] pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-20 border-b border-white/10 bg-black/60 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-heading text-xs tracking-wider uppercase hidden sm:inline">Back to Home</span>
          </Link>
          <div className="h-4 w-px bg-white/20 hidden sm:block" />
          <Link to="/" className="flex items-center gap-2">
            <img src={auraLogo} alt="AURA 2K26" className="w-8 h-auto filter brightness-200" />
            <span className="font-heading font-black tracking-widest text-sm text-white">AURA 2K26</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] sm:text-xs font-mono text-purple-300 font-bold px-2.5 py-1 bg-purple-950/60 border border-purple-500/30 rounded-full">
            RSVP & Payment Portal
          </span>
          {token && (
            <button
              onClick={handleLogout}
              className="text-[11px] font-mono text-white/60 hover:text-white border border-white/20 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Error / Success Toast Banner */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 flex items-start gap-3 text-sm">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
            <button onClick={() => setErrorMessage("")} className="text-red-400 hover:text-white cursor-pointer">✕</button>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 flex items-start gap-3 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">{successMessage}</div>
            <button onClick={() => setSuccessMessage("")} className="text-emerald-400 hover:text-white cursor-pointer">✕</button>
          </div>
        )}

        {/* ================= STEP 1: CREDENTIAL VERIFICATION ================= */}
        {step === "auth" && (
          <div className="bg-black/60 border border-white/10 rounded-2xl p-6 sm:p-10 backdrop-blur-xl shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-purple-900/40 to-cyan-900/40 border border-purple-500/30 mb-2">
                <ShieldCheck className="w-8 h-8 text-purple-300" />
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl uppercase tracking-wider text-white">
                Team RSVP Verification
              </h1>
              <p className="font-body text-xs sm:text-sm text-white/60 max-w-lg mx-auto">
                Enter your Team Registration ID and the Team Leader's registered email address to access your RSVP dashboard and confirmation details.
              </p>
            </div>

            <form onSubmit={handleVerifyCredentials} className="max-w-md mx-auto space-y-4">
              <div className="space-y-1.5">
                <label className="block font-heading text-xs uppercase tracking-wider text-white/80 font-bold">
                  Registration ID
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={registrationId}
                  onChange={(e) => setRegistrationId(e.target.value)}
                  placeholder="e.g. AURA2K26-ABC123"
                  className="w-full bg-black/60 border border-white/20 focus:border-purple-400 text-white font-mono uppercase text-sm p-3.5 rounded-xl focus:outline-none transition-all placeholder:text-white/30 tracking-wider"
                  disabled={loading}
                />
                <p className="text-[11px] font-mono text-white/40">
                  Unique Registration ID issued upon team registration submission.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block font-heading text-xs uppercase tracking-wider text-white/80 font-bold">
                  Team Leader's Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="leader@gmail.com"
                  className="w-full bg-black/60 border border-white/20 focus:border-purple-400 text-white font-body text-sm p-3.5 rounded-xl focus:outline-none transition-all placeholder:text-white/30"
                  disabled={loading}
                />
                <p className="text-[11px] font-mono text-white/40">
                  Must match the registered email address of the team leader.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !registrationId.trim() || !email.trim()}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-heading text-xs font-black tracking-widest uppercase transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify &amp; Continue</span>
                  </>
                )}
              </button>
            </form>

            <div className="border-t border-white/5 pt-4 text-center">
              <p className="font-mono text-[11px] text-white/40">
                🔒 Direct verification: No email delivery or OTP required. Both details must match an existing team record.
              </p>
            </div>
          </div>
        )}

        {/* ================= STEP 3: DASHBOARD & SUBMISSION ================= */}
        {step === "dashboard" && teamData && calculation && (
          <div className="space-y-8">
            {/* Team Overview Card */}
            <div className="bg-black/60 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                <div>
                  <span className="text-[10px] font-mono tracking-widest uppercase text-purple-400 font-bold">
                    Hackathon Registration
                  </span>
                  <h2 className="font-heading font-black text-2xl sm:text-3xl text-white uppercase tracking-wider">
                    {teamData.teamName}
                  </h2>
                  <p className="font-body text-xs text-white/60 mt-1">
                    Project: <span className="text-white font-medium">{teamData.projectTitle}</span>
                  </p>
                </div>

                <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/80 border border-purple-500/30 text-purple-300 font-mono text-xs font-bold">
                    <span>ID:</span>
                    <span className="text-white">{teamData.registrationId}</span>
                  </div>
                  <span
                    className={`text-[10px] font-heading uppercase tracking-wider font-bold px-3 py-1 rounded-full border ${
                      calculation.teamCategory === "internal"
                        ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                        : calculation.teamCategory === "mixed"
                        ? "bg-amber-950/60 border-amber-500/40 text-amber-300"
                        : "bg-blue-950/60 border-blue-500/40 text-blue-300"
                    }`}
                  >
                    {calculation.teamCategory === "internal"
                      ? "Category A: Internal (Aliah)"
                      : calculation.teamCategory === "mixed"
                      ? "Category C: Mixed Team"
                      : "Category B: External Team"}
                  </span>
                </div>
              </div>

              {/* Team Leader Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs font-body">
                <div>
                  <span className="text-white/40 block">Team Leader</span>
                  <span className="text-white font-medium">{teamData.teamLeaderName}</span>
                </div>
                <div>
                  <span className="text-white/40 block">Email Address</span>
                  <span className="text-white font-mono">{teamData.teamLeaderEmail}</span>
                </div>
                <div>
                  <span className="text-white/40 block">Phone</span>
                  <span className="text-white font-mono">{teamData.teamLeaderPhone}</span>
                </div>
              </div>
            </div>

            {/* Participant Breakdown & Fee Calculation Card */}
            <div className="bg-black/60 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-heading font-black text-lg sm:text-xl uppercase tracking-wider text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-400" />
                    <span>Participant Breakdown</span>
                  </h3>
                  <p className="font-body text-xs text-white/50">
                    Aliah University participants are exempt (₹0). External participants are ₹400 each.
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Internal: {calculation.internalParticipants}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>External: {calculation.externalParticipants}</span>
                  </div>
                </div>
              </div>

              {/* Member Table */}
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-left font-body text-xs">
                  <thead className="bg-white/5 border-b border-white/10 font-heading uppercase text-white/60 text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Participant</th>
                      <th className="py-3 px-4">Institution / College</th>
                      <th className="py-3 px-4">Classification</th>
                      <th className="py-3 px-4 text-right">Fee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {calculation.participantBreakdown.map((member, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4 font-medium text-white">
                          <div className="flex items-center gap-2">
                            <span>{member.name}</span>
                            {member.role === "Leader" && (
                              <span className="text-[9px] font-heading uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-950 border border-purple-500/40 text-purple-300 font-bold">
                                Leader
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-white/70 flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-white/40 shrink-0" />
                          <span>{member.universityName}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          {member.isInternal ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-mono text-[11px] bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                              <Check className="w-3 h-3" />
                              <span>Internal (Exempt)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-300 font-mono text-[11px] bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
                              <span>External Participant</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-sm">
                          {member.fee === 0 ? (
                            <span className="text-emerald-400">₹0</span>
                          ) : (
                            <span className="text-white">₹{member.fee}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Payable Summary Banner */}
              <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-white/[0.03] to-white/[0.08] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="font-heading text-xs uppercase tracking-wider text-white/60 block">
                    Total Payable Amount
                  </span>
                  <span className="text-xs text-white/40 font-body">
                    {calculation.externalParticipants === 0
                      ? "100% Free RSVP for Aliah University teams"
                      : `${calculation.externalParticipants} external participant(s) × ₹400`}
                  </span>
                </div>
                <div className="text-right">
                  <span
                    className={`font-mono text-3xl sm:text-4xl font-black ${
                      calculation.amountPayable === 0 ? "text-emerald-400" : "text-white"
                    }`}
                  >
                    ₹{calculation.amountPayable}
                  </span>
                </div>
              </div>
            </div>

            {/* If previously rejected, show resubmission alert */}
            {rsvpRecord && rsvpRecord.paymentStatus === "rejected" && (
              <div className="p-5 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-200 space-y-2">
                <div className="flex items-center gap-2 font-heading font-bold text-sm uppercase text-red-300">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <span>Previous Payment Verification Was Rejected</span>
                </div>
                <p className="text-xs font-body text-white/80">
                  Reason provided by organizers:{" "}
                  <strong className="text-white font-mono">{rsvpRecord.rejectionReason}</strong>
                </p>
                <p className="text-xs font-body text-white/60">
                  Please verify your transaction, upload a clear screenshot, and re-enter your valid UTR/Reference number below.
                </p>
              </div>
            )}

            {/* Submission Form Section */}
            <form onSubmit={handleSubmitRsvp} className="space-y-8">
              {/* CATEGORY A: FREE RSVP */}
              {calculation.amountPayable === 0 ? (
                <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-2xl p-6 sm:p-8 backdrop-blur-xl space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-heading font-black text-lg uppercase tracking-wider text-emerald-300">
                        Eligible for Free Team RSVP
                      </h4>
                      <p className="font-body text-xs sm:text-sm text-emerald-100/80 mt-1 leading-relaxed">
                        All participants in your team are enrolled at Aliah University. No registration or RSVP payment is required. Please confirm your attendance below to lock in your hackathon presentation slot.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* CATEGORY B & C: PAYMENT REQUIRED */
                <div className="bg-black/60 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-xl space-y-8">
                  <div className="space-y-1">
                    <h3 className="font-heading font-black text-lg sm:text-xl uppercase tracking-wider text-white flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-purple-400" />
                      <span>Payment Verification Details</span>
                    </h3>
                    <p className="font-body text-xs text-white/50">
                      Scan the official QR code to pay <strong>₹{calculation.amountPayable}</strong>, then upload proof and enter your reference number.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {/* Official QR Code Box */}
                    <div className="bg-black/80 border border-white/20 p-5 rounded-2xl flex flex-col items-center text-center space-y-3">
                      <div className="flex items-center gap-1.5 text-xs font-heading font-bold uppercase tracking-wider text-purple-300">
                        <QrCode className="w-4 h-4" />
                        <span>Official Payment QR</span>
                      </div>

                      <div className="p-2 bg-white rounded-xl shadow-xl">
                        <img
                          src={PAYMENT_QR_URL}
                          alt="Official AURA Payment QR Code"
                          onError={(e) => {
                            if (e.currentTarget.src !== paymentQrImage) {
                              e.currentTarget.src = paymentQrImage;
                            }
                          }}
                          className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-lg"
                        />
                      </div>

                      <div className="space-y-1 text-center">
                        <span className="text-xs font-mono text-white/80 block">
                          Pay Exact Amount: <strong className="text-purple-300 font-bold">₹{calculation.amountPayable}</strong>
                        </span>
                        <p className="text-[11px] font-body text-white/50">
                          Supports Google Pay, PhonePe, Paytm, BHIM, or any UPI App
                        </p>
                      </div>
                    </div>

                    {/* Payment Proof Inputs */}
                    <div className="space-y-5">
                      {/* UTR / Reference Number */}
                      <div className="space-y-1.5">
                        <label className="block font-heading text-xs uppercase tracking-wider text-white font-bold">
                          Payment Reference Number / UTR *
                        </label>
                        <input
                          type="text"
                          required
                          value={paymentRefNumber}
                          onChange={(e) => setPaymentRefNumber(e.target.value)}
                          placeholder="e.g. 12-digit UTR or Transaction ID"
                          className="w-full bg-black/60 border border-white/20 focus:border-purple-400 text-white font-mono text-sm p-3.5 rounded-xl focus:outline-none transition-all placeholder:text-white/30"
                        />
                        <span className="text-[11px] text-white/40 block">
                          You can find the 12-digit UTR/UPI Ref ID in your banking/UPI receipt.
                        </span>
                      </div>

                      {/* Screenshot Upload Dropzone */}
                      <div className="space-y-1.5">
                        <label className="block font-heading text-xs uppercase tracking-wider text-white font-bold">
                          Payment Screenshot * (JPG, PNG, WEBP &le; 5MB)
                        </label>

                        {screenshotPreview ? (
                          <div className="relative border border-emerald-500/40 rounded-xl p-3 bg-black/40 flex items-center gap-3">
                            <img
                              src={screenshotPreview}
                              alt="Screenshot Preview"
                              className="w-16 h-16 object-cover rounded-lg border border-white/20"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-white font-medium truncate">
                                {paymentScreenshotFile?.name || "Uploaded Screenshot"}
                              </p>
                              <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Ready for upload
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setPaymentScreenshotFile(null);
                                setScreenshotPreview("");
                              }}
                              className="p-1.5 text-white/50 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <label className="border-2 border-dashed border-white/20 hover:border-purple-400 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-black/40 group">
                            <Upload className="w-8 h-8 text-white/40 group-hover:text-purple-400 transition-colors mb-2" />
                            <span className="text-xs font-heading uppercase tracking-wider text-white font-bold">
                              Click or Drag & Drop Screenshot
                            </span>
                            <span className="text-[11px] text-white/40 mt-1">
                              Max 5MB &bull; Clean readable receipt image
                            </span>
                            <input
                              type="file"
                              accept="image/jpeg, image/png, image/webp"
                              onChange={handleScreenshotChange}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirmation Checkbox */}
              <div className="bg-black/40 border border-white/10 p-4 rounded-xl flex items-start gap-3">
                <input
                  type="checkbox"
                  id="confirm-rsvp-check"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-white/30 text-purple-600 focus:ring-purple-500 bg-black/60 cursor-pointer"
                />
                <label htmlFor="confirm-rsvp-check" className="text-xs font-body text-white/80 cursor-pointer select-none">
                  I confirm that all team details are accurate, the listed participants will attend the AURA 2K26 Hardware Hackathon in-person at Aliah University Newtown Campus, and all team members will carry valid original College ID cards.
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full sm:w-auto px-6 py-3 border border-white/20 rounded-xl font-heading text-xs tracking-wider uppercase text-white/70 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel / Sign Out
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !agreedToTerms}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-heading text-xs sm:text-sm font-black tracking-widest uppercase transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xl flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Submitting RSVP...</span>
                    </>
                  ) : calculation.amountPayable === 0 ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Confirm Free Team RSVP</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      <span>Submit Payment & Confirm RSVP</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= STEP 4: SUBMITTED / CONFIRMED SUCCESS ================= */}
        {step === "success" && rsvpRecord && (
          <div className="bg-black/60 border border-white/10 rounded-2xl p-6 sm:p-10 backdrop-blur-xl shadow-2xl space-y-8 text-center">
            <div className="inline-flex p-4 rounded-3xl bg-gradient-to-tr from-emerald-950/60 to-teal-950/60 border border-emerald-500/40">
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            </div>

            <div className="space-y-2">
              <h2 className="font-heading font-black text-2xl sm:text-3xl uppercase tracking-wider text-white">
                {rsvpRecord.paymentStatus === "not_required"
                  ? "RSVP Confirmed Successfully!"
                  : rsvpRecord.paymentStatus === "verified"
                  ? "Payment Verified & RSVP Confirmed!"
                  : "RSVP & Payment Proof Submitted!"}
              </h2>
              <p className="font-body text-xs sm:text-sm text-white/60 max-w-lg mx-auto">
                {rsvpRecord.paymentStatus === "not_required"
                  ? "Your team is fully confirmed for on-site participation at AURA 2K26. We look forward to seeing your prototype demo!"
                  : rsvpRecord.paymentStatus === "verified"
                  ? "Your payment transaction has been verified by the organizing team. Your team slot is officially locked."
                  : "Thank you! Your payment details and screenshot have been received and are currently under verification by our finance desk."}
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="max-w-md mx-auto text-left bg-black/80 border border-white/10 rounded-xl p-5 space-y-3 font-body text-xs">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/50">Team Name</span>
                <span className="text-white font-heading font-bold">{rsvpRecord.teamName}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/50">Registration ID</span>
                <span className="text-purple-300 font-mono font-bold">{rsvpRecord.registrationId}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/50">RSVP Status</span>
                <span className="text-emerald-400 font-heading font-bold uppercase">{rsvpRecord.rsvpStatus}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/50">Payment Status</span>
                <span
                  className={`font-mono font-bold uppercase ${
                    rsvpRecord.paymentStatus === "verified" || rsvpRecord.paymentStatus === "not_required"
                      ? "text-emerald-400"
                      : "text-amber-400"
                  }`}
                >
                  {rsvpRecord.paymentStatus.replace("_", " ")}
                </span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/50">Amount Paid</span>
                <span className="text-white font-mono font-bold">₹{rsvpRecord.amountPayable}</span>
              </div>
              {rsvpRecord.paymentReferenceNumber && (
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-white/50">Payment Reference / UTR</span>
                  <span className="text-white font-mono">{rsvpRecord.paymentReferenceNumber}</span>
                </div>
              )}
              {rsvpRecord.paymentScreenshotUrl && (
                <div className="pt-1">
                  <span className="text-white/50 block mb-1">Attached Receipt</span>
                  <a
                    href={rsvpRecord.paymentScreenshotUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-purple-400 hover:text-purple-300 underline font-mono text-[11px]"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Uploaded Proof</span>
                  </a>
                </div>
              )}
            </div>

            {/* Print and Navigation Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white font-heading text-xs tracking-wider uppercase flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Print Confirmation</span>
              </button>
              <Link
                to="/"
                className="px-6 py-2.5 rounded-xl bg-white text-black font-heading text-xs font-black tracking-wider uppercase hover:bg-white/90 transition-colors shadow-lg"
              >
                Return to Website
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
