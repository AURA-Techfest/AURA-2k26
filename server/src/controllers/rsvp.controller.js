import crypto from "crypto";
import Registration from "../models/Registration.js";
import Rsvp from "../models/Rsvp.js";
import RsvpOtp from "../models/RsvpOtp.js";
import { uploadPaymentScreenshot } from "../config/cloudinary.js";
import {
  sendRsvpOtpEmail,
  sendRsvpConfirmationEmail,
} from "../services/email.service.js";
import { rsvpRateLimiter } from "../middleware/rateLimiter.middleware.js";

const TOKEN_SECRET =
  process.env.ADMIN_JWT_SECRET ||
  process.env.JWT_SECRET ||
  "aura_2k26_rsvp_secret_salt_98371";

/**
 * Creates a cryptographically signed HMAC token for the session.
 */
export const signRsvpToken = (payload) => {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(data)
    .digest("base64url");
  return `${data}.${signature}`;
};

/**
 * Verifies and decodes a signed HMAC token.
 */
export const verifyRsvpToken = (token) => {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return null;
  }
  const [data, signature] = token.split(".");
  const expectedSignature = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(data)
    .digest("base64url");

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch (err) {
    return null;
  }
};

/**
 * Authentication Middleware for RSVP Endpoints
 */
export const requireRsvpAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please enter your registered email to receive an access code.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyRsvpToken(token);

    if (!decoded || !decoded.registrationId) {
      return res.status(401).json({
        success: false,
        message: "Your session has expired or is invalid. Please log in again.",
      });
    }

    req.rsvpUser = decoded;
    next();
  } catch (error) {
    console.error("RSVP Auth error:", error);
    return res.status(401).json({
      success: false,
      message: "Authentication failed.",
    });
  }
};

/**
 * Helper to parse participants and calculate payable fee.
 */
export const computeTeamRsvpBreakdown = (registration) => {
  const teamSize = Number(registration.teamSize) || 2;
  const affiliation = registration.teamAffiliation; // "all_aliah", "all_other", "mixed"
  const rawDetails = registration.teamMemberDetails || "";

  // Split member lines
  const lines = rawDetails
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const breakdown = [];

  // Team leader is always participant 1
  let leaderIsInternal = false;
  let leaderUniversity = "External University";

  if (affiliation === "all_aliah") {
    leaderIsInternal = true;
    leaderUniversity = "Aliah University";
  } else if (affiliation === "all_other") {
    leaderIsInternal = false;
    leaderUniversity = "External Institution";
  } else {
    // Mixed affiliation: check if details or affiliation indicates leader's university
    const leaderMatch = lines.find((l) =>
      l.toLowerCase().includes(registration.teamLeaderName.toLowerCase())
    );
    if (leaderMatch && leaderMatch.toLowerCase().includes("aliah")) {
      leaderIsInternal = true;
      leaderUniversity = "Aliah University";
    } else if (
      registration.aliahMembers > 0 &&
      (!lines.length || lines.every((l) => !l.toLowerCase().includes("aliah")))
    ) {
      // If team has aliah members and none of the other lines match aliah, leader is Aliah
      leaderIsInternal = true;
      leaderUniversity = "Aliah University";
    }
  }

  breakdown.push({
    name: registration.teamLeaderName,
    universityName: leaderUniversity,
    isInternal: leaderIsInternal,
    fee: leaderIsInternal ? 0 : 400,
    role: "Leader",
  });

  // Parse remaining members
  for (let i = 0; i < lines.length && breakdown.length < teamSize; i++) {
    const line = lines[i];
    // Skip if line represents leader
    if (line.toLowerCase().includes(registration.teamLeaderName.toLowerCase())) {
      continue;
    }

    const parts = line.split("|").map((p) => p.trim());
    const memberName = parts[0] || `Member ${breakdown.length + 1}`;
    const college = parts[1] || "";

    let isInternal = false;
    let universityName = college || "External Institution";

    if (affiliation === "all_aliah") {
      isInternal = true;
      universityName = "Aliah University";
    } else if (affiliation === "all_other") {
      isInternal = false;
      universityName = college || "External Institution";
    } else {
      // mixed
      const isAliahMatch =
        college.toLowerCase().includes("aliah") ||
        line.toLowerCase().includes("aliah");
      if (isAliahMatch) {
        isInternal = true;
        universityName = "Aliah University";
      } else {
        isInternal = false;
        universityName = college || "External Institution";
      }
    }

    breakdown.push({
      name: memberName,
      universityName,
      isInternal,
      fee: isInternal ? 0 : 400,
      role: "Member",
    });
  }

  // Pad remaining members up to teamSize if lines were fewer than teamSize
  while (breakdown.length < teamSize) {
    const index = breakdown.length + 1;
    const isAliah =
      affiliation === "all_aliah" ||
      (affiliation === "mixed" &&
        breakdown.filter((m) => m.isInternal).length < (registration.aliahMembers || 0));

    breakdown.push({
      name: `Member ${index}`,
      universityName: isAliah ? "Aliah University" : "External Institution",
      isInternal: isAliah,
      fee: isAliah ? 0 : 400,
      role: "Member",
    });
  }

  // Authoritative participant counts based on database records
  let internalCount = 0;
  let externalCount = 0;
  let teamCategory = "external";

  if (affiliation === "all_aliah") {
    internalCount = teamSize;
    externalCount = 0;
    teamCategory = "internal";
  } else if (affiliation === "all_other") {
    internalCount = 0;
    externalCount = teamSize;
    teamCategory = "external";
  } else if (affiliation === "mixed") {
    teamCategory = "mixed";
    internalCount =
      registration.aliahMembers !== undefined
        ? registration.aliahMembers
        : breakdown.filter((p) => p.isInternal).length;
    externalCount =
      registration.otherInstitutionMembers !== undefined
        ? registration.otherInstitutionMembers
        : teamSize - internalCount;
  }

  // Ensure breakdown counts match the authoritative numbers
  const calculatedFee = externalCount * 400;

  return {
    teamCategory,
    totalParticipants: teamSize,
    internalParticipants: internalCount,
    externalParticipants: externalCount,
    amountPayable: calculatedFee,
    participantBreakdown: breakdown,
  };
};

/**
 * 0. Verify Team Credentials (Registration ID + Team Leader Email)
 * Direct verification without email/OTP dependency.
 */
export const verifyRegistrationCredentials = async (req, res) => {
  try {
    const { registrationId, email } = req.body || {};
    const clientIp =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      "unknown";

    // 1. Validate presence of both fields
    if (
      !registrationId ||
      typeof registrationId !== "string" ||
      !registrationId.trim() ||
      !email ||
      typeof email !== "string" ||
      !email.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Both Team Registration ID and Team Leader Email are required.",
      });
    }

    const trimmedRegId = registrationId.trim().toUpperCase();
    const trimmedEmail = email.trim().toLowerCase();

    // 2. Validate email structure
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    // 3. Rate limiting check
    const rateStatus = rsvpRateLimiter.isRateLimited(clientIp, trimmedRegId);
    if (rateStatus.limited) {
      res.setHeader("Retry-After", rateStatus.retryAfterSeconds);
      return res.status(429).json({
        success: false,
        message: `Too many failed verification attempts. Please wait ${Math.ceil(
          rateStatus.retryAfterSeconds / 60
        )} minute(s) before trying again.`,
        retryAfter: rateStatus.retryAfterSeconds,
      });
    }

    rsvpRateLimiter.recordRequest(clientIp);

    // 4. Find the team using its Registration ID
    const registration = await Registration.findOne({
      registrationId: trimmedRegId,
    });

    // 5. Verify that the supplied email matches the registered team leader's email
    // Generic error message prevents revealing whether Registration ID or email exists independently
    if (
      !registration ||
      !registration.teamLeaderEmail ||
      registration.teamLeaderEmail.trim().toLowerCase() !== trimmedEmail
    ) {
      rsvpRateLimiter.recordFailure(clientIp, trimmedRegId);
      return res.status(401).json({
        success: false,
        message:
          "Invalid Registration ID or Team Leader Email address. Please verify your details.",
      });
    }

    // Successful match - clear failed attempts
    rsvpRateLimiter.recordSuccess(clientIp, trimmedRegId);

    // 6. Establish secure server-side verification session (HMAC-SHA256 signed token, 6 hr expiration)
    const token = signRsvpToken({
      registrationId: registration.registrationId,
      email: registration.teamLeaderEmail,
      teamName: registration.teamName,
      exp: Date.now() + 6 * 60 * 60 * 1000,
    });

    // 7. Return only necessary team info required for initial verification confirmation
    return res.status(200).json({
      success: true,
      message: "Credentials verified successfully!",
      token,
      registrationId: registration.registrationId,
      teamName: registration.teamName,
    });
  } catch (error) {
    console.error("Error in verifyRegistrationCredentials:", error);
    return res.status(500).json({
      success: false,
      message: "Server error verifying credentials. Please try again later.",
      error: error.message,
    });
  }
};

/**
 * 1. Request OTP for Team Leader
 */
export const requestOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Team leader email address is required.",
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check if email belongs to an existing registered team leader
    const registration = await Registration.findOne({
      teamLeaderEmail: trimmedEmail,
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message:
          "No team registration found for this email address. Please make sure you are using the team leader's registered email.",
      });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Save OTP to DB with 10 min TTL
    await RsvpOtp.deleteMany({ email: trimmedEmail });
    await RsvpOtp.create({
      email: trimmedEmail,
      otp,
      registrationId: registration.registrationId,
    });

    // Send email in background / parallel
    sendRsvpOtpEmail(trimmedEmail, otp, registration).catch((err) =>
      console.error("Failed to send OTP email:", err)
    );

    return res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been sent to ${trimmedEmail}.`,
      email: trimmedEmail,
    });
  } catch (error) {
    console.error("Error in requestOtp:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to request verification code. Please try again.",
      error: error.message,
    });
  }
};

/**
 * 2. Verify OTP & Issue Token
 */
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and 6-digit verification code are required.",
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedOtp = otp.toString().trim();

    const record = await RsvpOtp.findOne({ email: trimmedEmail });
    if (!record) {
      return res.status(400).json({
        success: false,
        message:
          "Verification code has expired or was not requested. Please request a new code.",
      });
    }

    if (record.otp !== trimmedOtp) {
      record.attempts = (record.attempts || 0) + 1;
      if (record.attempts >= 5) {
        await RsvpOtp.deleteMany({ email: trimmedEmail });
        return res.status(400).json({
          success: false,
          message:
            "Too many incorrect attempts. Please request a new verification code.",
        });
      }
      await record.save();
      return res.status(400).json({
        success: false,
        message: "Incorrect verification code. Please check and try again.",
      });
    }

    // Valid OTP - clean it up
    await RsvpOtp.deleteMany({ email: trimmedEmail });

    // Find registration to verify existence
    const registration = await Registration.findOne({
      registrationId: record.registrationId,
    });
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registered team not found.",
      });
    }

    // Issue signed session token valid for 6 hours
    const token = signRsvpToken({
      registrationId: registration.registrationId,
      email: trimmedEmail,
      teamName: registration.teamName,
      exp: Date.now() + 6 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Verification successful!",
      token,
      registrationId: registration.registrationId,
      teamName: registration.teamName,
    });
  } catch (error) {
    console.error("Error in verifyOtp:", error);
    return res.status(500).json({
      success: false,
      message: "Server error verifying code.",
      error: error.message,
    });
  }
};

/**
 * 3. Retrieve RSVP Details for Authenticated Team
 */
export const getRsvpDetails = async (req, res) => {
  try {
    const { registrationId } = req.rsvpUser;

    const registration = await Registration.findOne({ registrationId });
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Team registration record not found.",
      });
    }

    // Calculate participant breakdown and payment details
    const calculation = computeTeamRsvpBreakdown(registration);

    // Check if an RSVP record already exists
    const existingRsvp = await Rsvp.findOne({ registration: registration._id });

    return res.status(200).json({
      success: true,
      registration: {
        registrationId: registration.registrationId,
        teamName: registration.teamName,
        teamSize: registration.teamSize,
        teamAffiliation: registration.teamAffiliation,
        projectTitle: registration.projectTitle,
        prototypeType: registration.prototypeType,
        teamLeaderName: registration.teamLeaderName,
        teamLeaderEmail: registration.teamLeaderEmail,
        teamLeaderPhone: registration.teamLeaderPhone,
      },
      calculation,
      rsvp: existingRsvp || null,
    });
  } catch (error) {
    console.error("Error in getRsvpDetails:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve RSVP information.",
      error: error.message,
    });
  }
};

/**
 * 4. Submit RSVP Confirmation and Payment Proof
 */
export const submitRsvp = async (req, res) => {
  try {
    const { registrationId } = req.rsvpUser;
    const { paymentReferenceNumber } = req.body;
    const screenshotFile = req.file;

    const registration = await Registration.findOne({ registrationId });
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found.",
      });
    }

    // Compute fee strictly on the backend
    const calculation = computeTeamRsvpBreakdown(registration);
    const {
      teamCategory,
      totalParticipants,
      internalParticipants,
      externalParticipants,
      amountPayable,
      participantBreakdown,
    } = calculation;

    // Check for existing RSVP
    const existingRsvp = await Rsvp.findOne({ registration: registration._id });

    if (existingRsvp) {
      if (
        existingRsvp.paymentStatus === "verified" ||
        existingRsvp.rsvpStatus === "confirmed"
      ) {
        return res.status(400).json({
          success: false,
          message: "RSVP has already been confirmed for this team.",
        });
      }
      if (existingRsvp.paymentStatus === "pending_verification") {
        return res.status(400).json({
          success: false,
          message:
            "Your payment submission is already under verification by the organizing committee.",
        });
      }
      // If paymentStatus === "rejected", continue to allow resubmission!
    }

    let paymentScreenshotUrl = "";
    let finalPaymentStatus = "not_required";
    let finalRsvpStatus = "confirmed";

    if (amountPayable > 0) {
      // Payment is strictly required
      if (!paymentReferenceNumber || !paymentReferenceNumber.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Payment Reference / Transaction ID is required for paid RSVP submissions.",
        });
      }

      if (!screenshotFile) {
        return res.status(400).json({
          success: false,
          message:
            "Payment screenshot proof is required for paid RSVP submissions.",
        });
      }

      // Upload screenshot to Cloudinary in parallel
      try {
        const uploadResult = await uploadPaymentScreenshot(
          screenshotFile.buffer,
          "aura-registrations/payment-screenshots"
        );
        paymentScreenshotUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error("Cloudinary upload failed for RSVP:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload payment screenshot. Please try again.",
          error: uploadError.message,
        });
      }

      finalPaymentStatus = "pending_verification";
      finalRsvpStatus = "submitted";
    }

    // Atomic Upsert on Rsvp collection
    const rsvpDoc = await Rsvp.findOneAndUpdate(
      { registration: registration._id },
      {
        registration: registration._id,
        registrationId: registration.registrationId,
        teamName: registration.teamName,
        teamLeaderEmail: registration.teamLeaderEmail,
        teamLeaderName: registration.teamLeaderName,
        teamLeaderPhone: registration.teamLeaderPhone,
        teamCategory,
        totalParticipants,
        internalParticipants,
        externalParticipants,
        amountPayable,
        participantBreakdown,
        paymentReferenceNumber: paymentReferenceNumber?.trim() || undefined,
        paymentScreenshotUrl: paymentScreenshotUrl || undefined,
        paymentStatus: finalPaymentStatus,
        rsvpStatus: finalRsvpStatus,
        submittedAt: new Date(),
        rejectionReason: undefined, // Clear any prior rejection reason on resubmission
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Send confirmation email asynchronously (does not block response)
    sendRsvpConfirmationEmail(registration, rsvpDoc).catch((emailErr) =>
      console.error("Failed to send RSVP confirmation email:", emailErr)
    );

    return res.status(200).json({
      success: true,
      message:
        amountPayable === 0
          ? "RSVP confirmed successfully! We look forward to seeing your team at AURA 2K26."
          : "Payment proof and RSVP submitted successfully! Our desk will verify your transaction shortly.",
      rsvp: rsvpDoc,
    });
  } catch (error) {
    console.error("Error in submitRsvp:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to complete RSVP submission.",
      error: error.message,
    });
  }
};

/**
 * 5. Admin: List all RSVPs with payment verification status
 */
export const adminGetRsvps = async (req, res) => {
  try {
    const { status, category, search } = req.query;
    const query = {};

    if (status) query.paymentStatus = status;
    if (category) query.teamCategory = category;
    if (search) {
      query.$or = [
        { teamName: { $regex: search.trim(), $options: "i" } },
        { registrationId: { $regex: search.trim(), $options: "i" } },
        { teamLeaderEmail: { $regex: search.trim(), $options: "i" } },
        { paymentReferenceNumber: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const rsvps = await Rsvp.find(query).sort({ submittedAt: -1, createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: rsvps.length,
      rsvps,
    });
  } catch (error) {
    console.error("Error in adminGetRsvps:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching RSVPs.",
      error: error.message,
    });
  }
};

/**
 * 6. Admin: Verify or Reject RSVP Payment
 */
export const adminVerifyRsvp = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, rejectionReason, adminNotes } = req.body;

    if (!["verify", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be either 'verify' or 'reject'.",
      });
    }

    const rsvp = await Rsvp.findById(id);
    if (!rsvp) {
      return res.status(404).json({
        success: false,
        message: "RSVP record not found.",
      });
    }

    if (action === "verify") {
      rsvp.paymentStatus = "verified";
      rsvp.rsvpStatus = "confirmed";
      rsvp.verifiedAt = new Date();
      rsvp.verifiedBy = "Admin";
      rsvp.rejectionReason = undefined;
    } else {
      rsvp.paymentStatus = "rejected";
      rsvp.rejectionReason = rejectionReason || "Payment verification failed. Please check transaction reference.";
      rsvp.verifiedAt = new Date();
      rsvp.verifiedBy = "Admin";
    }

    if (adminNotes) {
      rsvp.adminNotes = adminNotes;
    }

    await rsvp.save();

    return res.status(200).json({
      success: true,
      message: `RSVP payment successfully marked as ${rsvp.paymentStatus}.`,
      rsvp,
    });
  } catch (error) {
    console.error("Error in adminVerifyRsvp:", error);
    return res.status(500).json({
      success: false,
      message: "Server error updating RSVP payment status.",
      error: error.message,
    });
  }
};

