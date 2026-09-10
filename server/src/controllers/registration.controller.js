import { uploadImage } from "../config/cloudinary.js";
import Registration from "../models/Registration.js";

const parseBoolean = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === "boolean") return value;
  return value.toString().toLowerCase() === "true";
};

const parseNumber = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const num = Number(value);
  return isNaN(num) ? undefined : num;
};

const parseArray = (value) => {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        return JSON.parse(trimmed);
      } catch (e) {}
    }
    if (trimmed.includes(",")) {
      return trimmed
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return trimmed ? [trimmed] : [];
  }
  return [value];
};

export const createRegistration = async (req, res) => {
  try {
    const {
      teamName,
      teamSize: rawTeamSize,
      hasWorkingPrototype,
      teamAffiliation,
      aliahMembers: rawAliahMembers,
      otherInstitutionMembers: rawOtherInstitutionMembers,
      teamLeaderName,
      teamLeaderEmail,
      teamLeaderPhone,
      teamMemberDetails,
      teamMembers: rawTeamMembers,
      projectTitle,
      hardwareProjectCategories: rawHardwareProjectCategories,
      prototypeType,
      currentWorkingStatus,
      problemStatement,
      solutionDescription,
      innovationDescription,
      intendedBeneficiaries: rawIntendedBeneficiaries,
      workingPrinciple,
      majorHardwareComponents: rawMajorHardwareComponents,
      useAi: rawUseAi,
      useIot: rawUseIot,
      powerSource,
      potentialImpact,
      productPotential,
      prototypeDevelopmentCost: rawPrototypeDevelopmentCost,
      auraDemoHighlight,
      safetyHazards: rawSafetyHazards,
      safetyPrecautions,
      requiresContinuousSupervision: rawRequiresContinuousSupervision,
      prototypeDevelopedByTeam,
      previouslyExhibited: rawPreviouslyExhibited,
      previousExhibitionDetails,
      registrationFeeStatus,
      transactionId,
      registrationFee: rawRegistrationFee,
      projectGitHub,
      projectVideoDemo,
      projectPresentation,
      workingPrototypeDeclaration: rawWorkingPrototypeDeclaration,
      originalityDeclaration: rawOriginalityDeclaration,
      safetyEventRulesAgreement: rawSafetyEventRulesAgreement,
      mediaPermission: rawMediaPermission,
      finalConfirmation: rawFinalConfirmation,
    } = req.body;

    const parsedTeamSize = parseNumber(rawTeamSize);
    const parsedAliahMembers = parseNumber(rawAliahMembers);
    const parsedOtherInstitutionMembers = parseNumber(
      rawOtherInstitutionMembers,
    );
    const parsedHardwareProjectCategories = parseArray(
      rawHardwareProjectCategories,
    );
    const parsedIntendedBeneficiaries = parseArray(rawIntendedBeneficiaries);
    const parsedMajorHardwareComponents = parseArray(
      rawMajorHardwareComponents,
    );
    const parsedUseAi = parseBoolean(rawUseAi);
    const parsedUseIot = parseBoolean(rawUseIot);
    const parsedPrototypeDevelopmentCost = parseNumber(
      rawPrototypeDevelopmentCost,
    );
    const parsedSafetyHazards = parseArray(rawSafetyHazards);
    const parsedRequiresContinuousSupervision = parseBoolean(
      rawRequiresContinuousSupervision,
    );
    const parsedPreviouslyExhibited = parseBoolean(rawPreviouslyExhibited);
    const parsedRegistrationFee = parseNumber(rawRegistrationFee);
    const parsedWorkingPrototypeDeclaration = parseBoolean(
      rawWorkingPrototypeDeclaration,
    );
    const parsedOriginalityDeclaration = parseBoolean(
      rawOriginalityDeclaration,
    );
    const parsedSafetyEventRulesAgreement = parseBoolean(
      rawSafetyEventRulesAgreement,
    );
    const parsedMediaPermission = parseBoolean(rawMediaPermission);
    const parsedFinalConfirmation = parseBoolean(rawFinalConfirmation);

    let parsedTeamMembers = [];
    if (rawTeamMembers) {
      try {
        const raw = typeof rawTeamMembers === "string" ? JSON.parse(rawTeamMembers) : rawTeamMembers;
        if (Array.isArray(raw)) {
          parsedTeamMembers = raw.map((m) => ({
            name: m.name?.trim() || "",
            email: m.email?.trim().toLowerCase() || "",
            phone: m.phone?.trim() || "",
            college: m.college?.trim() || "",
            year: m.year?.trim() || "",
            branch: m.branch?.trim() || "",
          }));
        }
      } catch (e) {
        parsedTeamMembers = [];
      }
    }

    if (
      !teamName ||
      !parsedTeamSize ||
      !hasWorkingPrototype ||
      !teamAffiliation ||
      !teamLeaderName ||
      !teamLeaderEmail ||
      !teamLeaderPhone ||
      !teamMemberDetails ||
      !projectTitle ||
      !parsedHardwareProjectCategories.length ||
      !prototypeType ||
      !currentWorkingStatus ||
      !problemStatement ||
      !solutionDescription ||
      !innovationDescription ||
      !parsedIntendedBeneficiaries.length ||
      !workingPrinciple ||
      !parsedMajorHardwareComponents.length ||
      !powerSource ||
      !potentialImpact ||
      !productPotential ||
      parsedPrototypeDevelopmentCost === undefined ||
      !auraDemoHighlight ||
      !parsedSafetyHazards.length ||
      !safetyPrecautions ||
      !prototypeDevelopedByTeam ||
      !registrationFeeStatus
    ) {
      return res.status(400).json({
        success: false,
        message: "One or more required fields are missing or empty",
      });
    }

    if (
      !parsedWorkingPrototypeDeclaration ||
      !parsedOriginalityDeclaration ||
      !parsedSafetyEventRulesAgreement ||
      !parsedFinalConfirmation
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You must accept all required declarations (Working Prototype, Originality, Safety Rules, and Final Confirmation)",
      });
    }

    // 5. Team affiliation validation
    if (teamAffiliation === "mixed") {
      if (
        parsedAliahMembers === undefined ||
        parsedOtherInstitutionMembers === undefined
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Number of Aliah and other institution members are required for mixed affiliation",
        });
      }
      if (
        parsedAliahMembers + parsedOtherInstitutionMembers !==
        parsedTeamSize
      ) {
        return res.status(400).json({
          success: false,
          message: `The sum of Aliah members (${parsedAliahMembers}) and other institution members (${parsedOtherInstitutionMembers}) must equal the total team size (${parsedTeamSize})`,
        });
      }
    }

    const trimmedEmail = teamLeaderEmail.trim().toLowerCase();
    const existingRegistration = await Registration.findOne({
      $or: [{ teamName: teamName.trim() }, { teamLeaderEmail: trimmedEmail }],
    });

    if (existingRegistration) {
      if (
        existingRegistration.teamName.toLowerCase() ===
        teamName.trim().toLowerCase()
      ) {
        return res.status(400).json({
          success: false,
          message: "A team with this name is already registered.",
        });
      }
      if (existingRegistration.teamLeaderEmail === trimmedEmail) {
        return res.status(400).json({
          success: false,
          message: "A team leader with this email is already registered.",
        });
      }
    }

    let paymentScreenshotUrl = "";
    let finalFee = 0;

    const hasCloudinary =
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET;

    // Helper to upload a single file buffer to Cloudinary
    const uploadToCloudinary = async (buffer, folder) => {
      if (!hasCloudinary) return "";
      try {
        const result = await uploadImage(buffer, folder);
        return result.secure_url;
      } catch (err) {
        console.error(`Cloudinary upload failed for ${folder}:`, err);
        return "";
      }
    };

    // Upload ID cards from req.files
    const files = req.files || {};
    const teamLeaderIdCardUrl = files.teamLeaderIdCard?.[0]
      ? await uploadToCloudinary(files.teamLeaderIdCard[0].buffer, "aura-registrations/id-cards")
      : "";
    const member1IdCardUrl = files.member1IdCard?.[0]
      ? await uploadToCloudinary(files.member1IdCard[0].buffer, "aura-registrations/id-cards")
      : "";
    const member2IdCardUrl = files.member2IdCard?.[0]
      ? await uploadToCloudinary(files.member2IdCard[0].buffer, "aura-registrations/id-cards")
      : "";
    const member3IdCardUrl = files.member3IdCard?.[0]
      ? await uploadToCloudinary(files.member3IdCard[0].buffer, "aura-registrations/id-cards")
      : "";

    // Upload abstract PDF
    const abstractPdfUrl = files.abstractPdf?.[0]
      ? await uploadToCloudinary(files.abstractPdf[0].buffer, "aura-registrations/abstracts")
      : "";

    if (registrationFeeStatus === "external_fee") {
      finalFee = 400;
      if (parsedRegistrationFee !== 400) {
        return res.status(400).json({
          success: false,
          message: "Registration fee must be 400 for external fee status",
        });
      }
      if (!transactionId || !transactionId.trim()) {
        return res.status(400).json({
          success: false,
          message: "Transaction ID is required for paid registrations",
        });
      }

      if (!files.paymentScreenshot?.[0]) {
        return res.status(400).json({
          success: false,
          message:
            "Payment screenshot image is required for paid registrations",
        });
      }

      if (!hasCloudinary) {
        console.error("Cloudinary config missing from environment variables.");
        return res.status(500).json({
          success: false,
          message:
            "Cloudinary configuration is incomplete. Please ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set in the .env file.",
        });
      }

      try {
        const uploadResult = await uploadImage(files.paymentScreenshot[0].buffer);
        paymentScreenshotUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error("Cloudinary upload failed:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload payment screenshot. Please try again.",
          error: uploadError.message,
        });
      }
    } else {
      finalFee = 0;
      if (parsedRegistrationFee !== 0) {
        return res.status(400).json({
          success: false,
          message: "Registration fee must be 0 for free registration status",
        });
      }
    }

    const newRegistrationData = {
      teamName: teamName.trim(),
      teamSize: parsedTeamSize,
      hasWorkingPrototype,
      teamAffiliation,
      aliahMembers:
        teamAffiliation === "mixed" ? parsedAliahMembers : undefined,
      otherInstitutionMembers:
        teamAffiliation === "mixed" ? parsedOtherInstitutionMembers : undefined,
      teamLeaderName: teamLeaderName.trim(),
      teamLeaderEmail: trimmedEmail,
      teamLeaderPhone: teamLeaderPhone.trim(),
      teamMemberDetails: teamMemberDetails.trim(),
      teamMembers: parsedTeamMembers.length > 0 ? parsedTeamMembers : undefined,
      teamLeaderIdCard: teamLeaderIdCardUrl || undefined,
      member1IdCard: member1IdCardUrl || undefined,
      member2IdCard: member2IdCardUrl || undefined,
      member3IdCard: member3IdCardUrl || undefined,
      abstractPdf: abstractPdfUrl || undefined,
      projectTitle: projectTitle.trim(),
      hardwareProjectCategories: parsedHardwareProjectCategories,
      prototypeType,
      currentWorkingStatus,
      problemStatement: problemStatement.trim(),
      solutionDescription: solutionDescription.trim(),
      innovationDescription: innovationDescription.trim(),
      intendedBeneficiaries: parsedIntendedBeneficiaries,
      workingPrinciple: workingPrinciple.trim(),
      majorHardwareComponents: parsedMajorHardwareComponents,
      useAi: parsedUseAi,
      useIot: parsedUseIot,
      powerSource,
      potentialImpact: potentialImpact.trim(),
      productPotential,
      prototypeDevelopmentCost: parsedPrototypeDevelopmentCost,
      auraDemoHighlight: auraDemoHighlight.trim(),
      safetyHazards: parsedSafetyHazards,
      safetyPrecautions: safetyPrecautions.trim(),
      requiresContinuousSupervision: parsedRequiresContinuousSupervision,
      prototypeDevelopedByTeam,
      previouslyExhibited: parsedPreviouslyExhibited,
      previousExhibitionDetails: parsedPreviouslyExhibited
        ? previousExhibitionDetails?.trim()
        : undefined,
      registrationFeeStatus,
      transactionId:
        registrationFeeStatus === "external_fee"
          ? transactionId.trim()
          : undefined,
      paymentScreenshot:
        registrationFeeStatus === "external_fee"
          ? paymentScreenshotUrl
          : undefined,
      registrationFee: finalFee,
      projectGitHub: projectGitHub?.trim() || undefined,
      projectVideoDemo: projectVideoDemo?.trim() || undefined,
      projectPresentation: projectPresentation?.trim() || undefined,
      workingPrototypeDeclaration: parsedWorkingPrototypeDeclaration,
      originalityDeclaration: parsedOriginalityDeclaration,
      safetyEventRulesAgreement: parsedSafetyEventRulesAgreement,
      mediaPermission: parsedMediaPermission,
      finalConfirmation: parsedFinalConfirmation,
    };

    const registration = await Registration.create(newRegistrationData);

    return res.status(201).json({
      success: true,
      message: "Registration successfully completed!",
      data: registration,
    });
  } catch (error) {
    console.error("Registration submission error:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: messages,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong while completing the registration.",
      error: error.message,
    });
  }
};

export const checkEmailOrTeamName = async (req, res) => {
  try {
    const { email, teamName } = req.query;
    if (!email && !teamName) {
      return res.status(400).json({
        success: false,
        message: "Either email or teamName query parameter is required.",
      });
    }

    const query = [];
    if (email) query.push({ teamLeaderEmail: email.trim().toLowerCase() });
    if (teamName) query.push({ teamName: teamName.trim() });

    const existing = await Registration.findOne({ $or: query });

    if (existing) {
      const isEmailMatch =
        email && existing.teamLeaderEmail === email.trim().toLowerCase();
      return res.status(200).json({
        success: true,
        exists: true,
        message: isEmailMatch
          ? "Email is already registered"
          : "Team name is already registered",
        field: isEmailMatch ? "email" : "teamName",
      });
    }

    return res.status(200).json({
      success: true,
      exists: false,
      message: "Available for registration",
    });
  } catch (error) {
    console.error("Check status error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error checking status",
      error: error.message,
    });
  }
};

const escapeCSV = (value) => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const exportRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find().sort({ createdAt: -1 });

    if (registrations.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No registrations found to export",
      });
    }

    const headers = [
      "S.No",
      "Team Name",
      "Team Size",
      "Working Prototype",
      "Team Affiliation",
      "Aliah Members",
      "Other Institution Members",
      "Team Leader Name",
      "Team Leader Email",
      "Team Leader Phone",
      "Team Member Details",
      "Team Members (Structured)",
      "Team Leader ID Card URL",
      "Member 1 ID Card URL",
      "Member 2 ID Card URL",
      "Member 3 ID Card URL",
      "Project Title",
      "Hardware Categories",
      "Prototype Type",
      "Working Status",
      "Problem/Solution/Innovation",
      "Abstract PDF URL",
      "Intended Beneficiaries",
      "Working Principle",
      "Hardware Components",
      "Uses AI",
      "Uses IoT",
      "Power Source",
      "Potential Impact",
      "Product Potential",
      "Development Cost (INR)",
      "Demo Highlight",
      "Safety Hazards",
      "Safety Precautions",
      "Requires Supervision",
      "Developed By Team",
      "Previously Exhibited",
      "Exhibition Details",
      "Fee Status",
      "Registration Fee",
      "Transaction ID",
      "Payment Screenshot URL",
      "Project GitHub",
      "Project Video Demo",
      "Project Presentation",
      "Working Prototype Declaration",
      "Originality Declaration",
      "Safety Rules Agreement",
      "Media Permission",
      "Final Confirmation",
      "Created At",
    ];

    const rows = registrations.map((r, i) => {
      const teamMembersStr = (r.teamMembers || [])
        .map((m) => `${m.name} (${m.college || "N/A"}, ${m.year || "N/A"}, ${m.branch || "N/A"})`)
        .join("; ");

      return [
        i + 1,
        r.teamName,
        r.teamSize,
        r.hasWorkingPrototype,
        r.teamAffiliation,
        r.aliahMembers ?? "",
        r.otherInstitutionMembers ?? "",
        r.teamLeaderName,
        r.teamLeaderEmail,
        r.teamLeaderPhone,
        r.teamMemberDetails,
        teamMembersStr,
        r.teamLeaderIdCard ?? "",
        r.member1IdCard ?? "",
        r.member2IdCard ?? "",
        r.member3IdCard ?? "",
        r.projectTitle,
        (r.hardwareProjectCategories || []).join("; "),
        r.prototypeType,
        r.currentWorkingStatus,
        r.problemStatement,
        r.abstractPdf ?? "",
        (r.intendedBeneficiaries || []).join("; "),
        r.workingPrinciple,
        (r.majorHardwareComponents || []).join("; "),
        r.useAi ? "Yes" : "No",
        r.useIot ? "Yes" : "No",
        r.powerSource,
        r.potentialImpact,
        r.productPotential,
        r.prototypeDevelopmentCost,
        r.auraDemoHighlight,
        (r.safetyHazards || []).join("; "),
        r.safetyPrecautions,
        r.requiresContinuousSupervision ? "Yes" : "No",
        r.prototypeDevelopedByTeam,
        r.previouslyExhibited ? "Yes" : "No",
        r.previousExhibitionDetails ?? "",
        r.registrationFeeStatus,
        r.registrationFee,
        r.transactionId ?? "",
        r.paymentScreenshot ?? "",
        r.projectGitHub ?? "",
        r.projectVideoDemo ?? "",
        r.projectPresentation ?? "",
        r.workingPrototypeDeclaration ? "Yes" : "No",
        r.originalityDeclaration ? "Yes" : "No",
        r.safetyEventRulesAgreement ? "Yes" : "No",
        r.mediaPermission ? "Yes" : "No",
        r.finalConfirmation ? "Yes" : "No",
        r.createdAt ? new Date(r.createdAt).toISOString() : "",
      ];
    });

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=aura_2026_registrations_${Date.now()}.csv`
    );
    res.status(200).send("\uFEFF" + csvContent);
  } catch (error) {
    console.error("Export registrations error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to export registrations",
      error: error.message,
    });
  }
};
