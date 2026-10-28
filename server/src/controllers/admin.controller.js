import jwt from "jsonwebtoken";
import Registration from "../models/Registration.js";

const JWT_SECRET =
  process.env.ADMIN_JWT_SECRET || "aura_admin_super_secret_jwt_key_2026_fest";
const ADMIN_USER_ID =
  process.env.ADMIN_USER_ID || process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "aura2026admin";

/**
 * Admin Login Authentication
 */
export const loginAdmin = async (req, res) => {
  try {
    const { userId, username, password } = req.body;
    const providedUser = (userId || username || "").toString().trim();
    const providedPass = (password || "").toString().trim();

    if (!providedUser || !providedPass) {
      return res.status(400).json({
        success: false,
        message: "Both User ID and password are required.",
      });
    }

    const expectedUser = ADMIN_USER_ID.trim();
    const expectedPass = ADMIN_PASSWORD.trim();

    if (providedUser !== expectedUser || providedPass !== expectedPass) {
      return res.status(401).json({
        success: false,
        message: "Invalid User ID or Password.",
      });
    }

    // Generate JWT token valid for 7 days
    const token = jwt.sign(
      {
        userId: providedUser,
        role: "admin",
        authenticatedAt: new Date().toISOString(),
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      message: "Admin authentication successful",
      token,
      admin: {
        userId: providedUser,
        role: "admin",
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during authentication",
      error: error.message,
    });
  }
};

/**
 * Verify current Admin Session Token
 */
export const verifySession = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Admin session is valid",
    admin: req.admin,
  });
};

/**
 * Get All Registrations with Search and Filter capabilities
 */
export const getAllRegistrations = async (req, res) => {
  try {
    const {
      search,
      affiliation,
      prototypeStatus,
      emailStatus,
      feeStatus,
      prototypeType,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = {};

    // 1. Text Search across key registration fields
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { teamName: searchRegex },
        { teamLeaderName: searchRegex },
        { teamLeaderEmail: searchRegex },
        { teamLeaderPhone: searchRegex },
        { registrationId: searchRegex },
        { projectTitle: searchRegex },
        { teamMemberDetails: searchRegex },
      ];
    }

    // 2. Specific filters
    if (affiliation && affiliation !== "all") {
      query.teamAffiliation = affiliation;
    }

    if (prototypeStatus && prototypeStatus !== "all") {
      query.hasWorkingPrototype = prototypeStatus;
    }

    if (emailStatus && emailStatus !== "all") {
      query.emailStatus = emailStatus;
    }

    if (feeStatus && feeStatus !== "all") {
      query.registrationFeeStatus = feeStatus;
    }

    if (prototypeType && prototypeType !== "all") {
      query.prototypeType = prototypeType;
    }

    // Sorting
    const sortField = sortBy || "createdAt";
    const sortDirection = sortOrder === "asc" ? 1 : -1;
    const sortOptions = { [sortField]: sortDirection };

    const totalCount = await Registration.countDocuments();
    const matchedCount = await Registration.countDocuments(query);
    const registrations = await Registration.find(query)
      .sort(sortOptions)
      .lean();

    return res.status(200).json({
      success: true,
      totalCount,
      matchedCount,
      registrations,
    });
  } catch (error) {
    console.error("Error fetching registrations for admin:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch registrations",
      error: error.message,
    });
  }
};

/**
 * Get Single Registration by ID or RegistrationId
 */
export const getRegistrationById = async (req, res) => {
  try {
    const { id } = req.params;

    let registration = null;
    if (id.startsWith("AURA2K26-")) {
      registration = await Registration.findOne({ registrationId: id }).lean();
    } else {
      registration = await Registration.findById(id).lean();
    }

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration record not found",
      });
    }

    return res.status(200).json({
      success: true,
      registration,
    });
  } catch (error) {
    console.error("Error retrieving registration details:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve registration detail",
      error: error.message,
    });
  }
};

/**
 * Compute High-Level Metrics and Statistics for Admin Dashboard
 */
export const getDashboardStats = async (req, res) => {
  try {
    const registrations = await Registration.find().lean();
    const totalRegistrations = registrations.length;

    let totalParticipants = 0;
    let aliahParticipants = 0;
    let externalParticipants = 0;

    let fullyWorking = 0;
    let minorLimitations = 0;
    let noPrototype = 0;

    let allAliah = 0;
    let allOther = 0;
    let mixed = 0;

    let emailSent = 0;
    let emailPending = 0;
    let emailFailed = 0;

    let useAiCount = 0;
    let useIotCount = 0;
    let continuousSupervisionRequired = 0;

    let totalDevCost = 0;
    let totalFees = 0;

    const categoryCounts = {};
    const prototypeTypeCounts = {};

    for (const reg of registrations) {
      const size = Number(reg.teamSize) || 0;
      totalParticipants += size;
      aliahParticipants += Number(reg.aliahMembers) || 0;
      externalParticipants += Number(reg.otherInstitutionMembers) || 0;

      // Prototype readiness
      if (reg.hasWorkingPrototype === "fully_working") fullyWorking++;
      else if (reg.hasWorkingPrototype === "minor_limitations") minorLimitations++;
      else if (reg.hasWorkingPrototype === "no_prototype") noPrototype++;

      // Affiliation
      if (reg.teamAffiliation === "all_aliah") allAliah++;
      else if (reg.teamAffiliation === "all_other") allOther++;
      else if (reg.teamAffiliation === "mixed") mixed++;

      // Email status
      if (reg.emailStatus === "sent") emailSent++;
      else if (reg.emailStatus === "failed") emailFailed++;
      else emailPending++;

      // Tech tags
      if (reg.useAi) useAiCount++;
      if (reg.useIot) useIotCount++;
      if (reg.requiresContinuousSupervision) continuousSupervisionRequired++;

      // Cost & Fees
      if (reg.prototypeDevelopmentCost) {
        totalDevCost += Number(reg.prototypeDevelopmentCost) || 0;
      }
      if (reg.registrationFee) {
        totalFees += Number(reg.registrationFee) || 0;
      }

      // Categories
      if (Array.isArray(reg.hardwareProjectCategories)) {
        for (const cat of reg.hardwareProjectCategories) {
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        }
      }

      // Prototype Types
      if (reg.prototypeType) {
        prototypeTypeCounts[reg.prototypeType] =
          (prototypeTypeCounts[reg.prototypeType] || 0) + 1;
      }
    }

    return res.status(200).json({
      success: true,
      stats: {
        totalRegistrations,
        totalParticipants,
        aliahParticipants,
        externalParticipants,
        readiness: {
          fullyWorking,
          minorLimitations,
          noPrototype,
        },
        affiliation: {
          allAliah,
          allOther,
          mixed,
        },
        emails: {
          sent: emailSent,
          pending: emailPending,
          failed: emailFailed,
        },
        tech: {
          useAiCount,
          useIotCount,
          continuousSupervisionRequired,
        },
        financials: {
          totalDevCost,
          totalFees,
        },
        categoryCounts,
        prototypeTypeCounts,
      },
    });
  } catch (error) {
    console.error("Error computing admin stats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate dashboard statistics",
      error: error.message,
    });
  }
};

/**
 * Export all registrations as CSV file
 */
export const exportRegistrationsCsv = async (req, res) => {
  try {
    const registrations = await Registration.find().sort({ createdAt: -1 }).lean();

    const headers = [
      "Registration ID",
      "Created At",
      "Team Name",
      "Team Size",
      "Team Affiliation",
      "Aliah Members",
      "Other Members",
      "Team Leader Name",
      "Team Leader Email",
      "Team Leader Phone",
      "Team Member Details",
      "Project Title",
      "Categories",
      "Prototype Type",
      "Working Status",
      "Has Working Prototype",
      "Problem Statement",
      "Solution Description",
      "Innovation Description",
      "Working Principle",
      "Major Components",
      "Use AI",
      "Use IoT",
      "Power Source",
      "Potential Impact",
      "Product Potential",
      "Prototype Dev Cost (INR)",
      "AURA Demo Highlight",
      "Safety Hazards",
      "Safety Precautions",
      "Continuous Supervision",
      "Previously Exhibited",
      "Fee Status",
      "Fee Amount",
      "Transaction ID",
      "Email Status",
      "Team Leader ID Card URL",
      "Member 1 ID Card URL",
      "Member 2 ID Card URL",
      "Member 3 ID Card URL",
      "Abstract PDF URL",
      "Payment Screenshot URL",
    ];

    const escapeCsv = (val) => {
      if (val === undefined || val === null) return '""';
      let str = String(val);
      if (Array.isArray(val)) str = val.join("; ");
      if (typeof val === "object" && !(val instanceof Date)) {
        str = JSON.stringify(val);
      }
      str = str.replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvRows = [headers.join(",")];

    for (const reg of registrations) {
      const row = [
        escapeCsv(reg.registrationId || ""),
        escapeCsv(reg.createdAt ? new Date(reg.createdAt).toISOString() : ""),
        escapeCsv(reg.teamName || ""),
        escapeCsv(reg.teamSize || ""),
        escapeCsv(reg.teamAffiliation || ""),
        escapeCsv(reg.aliahMembers || 0),
        escapeCsv(reg.otherInstitutionMembers || 0),
        escapeCsv(reg.teamLeaderName || ""),
        escapeCsv(reg.teamLeaderEmail || ""),
        escapeCsv(reg.teamLeaderPhone || ""),
        escapeCsv(reg.teamMemberDetails || ""),
        escapeCsv(reg.projectTitle || ""),
        escapeCsv(reg.hardwareProjectCategories || []),
        escapeCsv(reg.prototypeType || ""),
        escapeCsv(reg.currentWorkingStatus || ""),
        escapeCsv(reg.hasWorkingPrototype || ""),
        escapeCsv(reg.problemStatement || ""),
        escapeCsv(reg.solutionDescription || ""),
        escapeCsv(reg.innovationDescription || ""),
        escapeCsv(reg.workingPrinciple || ""),
        escapeCsv(reg.majorHardwareComponents || []),
        escapeCsv(reg.useAi ? "Yes" : "No"),
        escapeCsv(reg.useIot ? "Yes" : "No"),
        escapeCsv(reg.powerSource || ""),
        escapeCsv(reg.potentialImpact || ""),
        escapeCsv(reg.productPotential || ""),
        escapeCsv(reg.prototypeDevelopmentCost || 0),
        escapeCsv(reg.auraDemoHighlight || ""),
        escapeCsv(reg.safetyHazards || []),
        escapeCsv(reg.safetyPrecautions || ""),
        escapeCsv(reg.requiresContinuousSupervision ? "Yes" : "No"),
        escapeCsv(reg.previouslyExhibited ? "Yes" : "No"),
        escapeCsv(reg.registrationFeeStatus || "no_fee"),
        escapeCsv(reg.registrationFee || 0),
        escapeCsv(reg.transactionId || ""),
        escapeCsv(reg.emailStatus || "pending"),
        escapeCsv(reg.teamLeaderIdCard || ""),
        escapeCsv(reg.member1IdCard || ""),
        escapeCsv(reg.member2IdCard || ""),
        escapeCsv(reg.member3IdCard || ""),
        escapeCsv(reg.abstractPdf || ""),
        escapeCsv(reg.paymentScreenshot || ""),
      ];
      csvRows.push(row.join(","));
    }

    const csvString = csvRows.join("\r\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="aura2k26_registrations_${new Date().toISOString().slice(0, 10)}.csv"`
    );

    return res.status(200).send(csvString);
  } catch (error) {
    console.error("Error exporting CSV:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate CSV export",
      error: error.message,
    });
  }
};
