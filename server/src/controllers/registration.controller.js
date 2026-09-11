import { uploadToCloudinary, uploadImage } from "../config/cloudinary.js";
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
      workingPrototypeDeclaration: rawWorkingPrototypeDeclaration,
      originalityDeclaration: rawOriginalityDeclaration,
      safetyEventRulesAgreement: rawSafetyEventRulesAgreement,
      mediaPermission: rawMediaPermission,
      finalConfirmation: rawFinalConfirmation,
    } = req.body;

    const parsedTeamSize = parseNumber(rawTeamSize);
    let parsedAliahMembers = parseNumber(rawAliahMembers);
    let parsedOtherInstitutionMembers = parseNumber(rawOtherInstitutionMembers);
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

    // Basic required field validation
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

    if (![2, 3, 4].includes(parsedTeamSize)) {
      return res.status(400).json({
        success: false,
        message: "Team size must be 2, 3, or 4 members.",
      });
    }

    // Declarations validation
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

    // Team affiliation and member count validation
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
    } else if (teamAffiliation === "all_aliah") {
      parsedAliahMembers = parsedTeamSize;
      parsedOtherInstitutionMembers = 0;
    } else if (teamAffiliation === "all_other") {
      parsedAliahMembers = 0;
      parsedOtherInstitutionMembers = parsedTeamSize;
    }

    // Duplicate check for teamName and teamLeaderEmail
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

    // Extract uploaded files from req.files
    const teamLeaderIdCardFile = req.files?.teamLeaderIdCard?.[0];
    const member1IdCardFile = req.files?.member1IdCard?.[0];
    const member2IdCardFile = req.files?.member2IdCard?.[0];
    const member3IdCardFile = req.files?.member3IdCard?.[0];
    const abstractPdfFile = req.files?.abstractPdf?.[0];
    const paymentFile = req.files?.paymentScreenshot?.[0];

    // Validate ID cards according to team size
    if (!teamLeaderIdCardFile) {
      return res.status(400).json({
        success: false,
        message: "Team Leader College ID Card is required.",
      });
    }

    if (!member1IdCardFile) {
      return res.status(400).json({
        success: false,
        message: "Member 1 College ID Card is required.",
      });
    }

    if (parsedTeamSize >= 3 && !member2IdCardFile) {
      return res.status(400).json({
        success: false,
        message: "Member 2 College ID Card is required for teams of 3 or 4.",
      });
    }

    if (parsedTeamSize >= 4 && !member3IdCardFile) {
      return res.status(400).json({
        success: false,
        message: "Member 3 College ID Card is required for teams of 4.",
      });
    }

    // Validate Abstract PDF / DOC
    if (!abstractPdfFile) {
      return res.status(400).json({
        success: false,
        message: "Abstract Idea document (PDF/DOCX) is required.",
      });
    }

    // Validate Fee and Payment Screenshot
    let finalFee = 0;
    if (registrationFeeStatus === "external_fee") {
      finalFee = parsedRegistrationFee !== undefined ? parsedRegistrationFee : 0;
      if (finalFee <= 0) {
        return res.status(400).json({
          success: false,
          message: "A valid positive registration fee is required for external fee status.",
        });
      }
      if (!transactionId || !transactionId.trim()) {
        return res.status(400).json({
          success: false,
          message: "Transaction ID is required for paid registrations.",
        });
      }
      if (!paymentFile) {
        return res.status(400).json({
          success: false,
          message: "Payment screenshot image is required for paid registrations.",
        });
      }
    } else {
      finalFee = 0;
    }

    // Ensure Cloudinary configuration exists
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      console.error("Cloudinary config missing from environment variables.");
      return res.status(500).json({
        success: false,
        message:
          "Cloudinary configuration is incomplete. Please ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set in the .env file.",
      });
    }

    // Upload files to Cloudinary
    let teamLeaderIdCardUrl = "";
    let member1IdCardUrl = "";
    let member2IdCardUrl = "";
    let member3IdCardUrl = "";
    let abstractPdfUrl = "";
    let paymentScreenshotUrl = "";

    try {
      const uploadTasks = [
        uploadToCloudinary(teamLeaderIdCardFile.buffer, {
          folder: "aura-registrations/id-cards",
          resource_type: "auto",
        }),
        uploadToCloudinary(member1IdCardFile.buffer, {
          folder: "aura-registrations/id-cards",
          resource_type: "auto",
        }),
        member2IdCardFile && parsedTeamSize >= 3
          ? uploadToCloudinary(member2IdCardFile.buffer, {
              folder: "aura-registrations/id-cards",
              resource_type: "auto",
            })
          : Promise.resolve(null),
        member3IdCardFile && parsedTeamSize >= 4
          ? uploadToCloudinary(member3IdCardFile.buffer, {
              folder: "aura-registrations/id-cards",
              resource_type: "auto",
            })
          : Promise.resolve(null),
        uploadToCloudinary(abstractPdfFile.buffer, {
          folder: "aura-registrations/abstracts",
          resource_type: "auto",
        }),
        paymentFile && registrationFeeStatus === "external_fee"
          ? uploadToCloudinary(paymentFile.buffer, {
              folder: "aura-registrations/payment-screenshots",
              resource_type: "image",
            })
          : Promise.resolve(null),
      ];

      const [
        teamLeaderUpload,
        member1Upload,
        member2Upload,
        member3Upload,
        abstractUpload,
        paymentUpload,
      ] = await Promise.all(uploadTasks);

      teamLeaderIdCardUrl = teamLeaderUpload?.secure_url || "";
      member1IdCardUrl = member1Upload?.secure_url || "";
      member2IdCardUrl = member2Upload?.secure_url || "";
      member3IdCardUrl = member3Upload?.secure_url || "";
      abstractPdfUrl = abstractUpload?.secure_url || "";
      paymentScreenshotUrl = paymentUpload?.secure_url || "";
    } catch (uploadError) {
      console.error("Cloudinary file upload failed:", uploadError);
      return res.status(500).json({
        success: false,
        message: "Failed to upload files. Please check file sizes and try again.",
        error: uploadError.message,
      });
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
      teamLeaderIdCard: teamLeaderIdCardUrl,
      member1IdCard: member1IdCardUrl,
      member2IdCard: member2IdCardUrl || undefined,
      member3IdCard: member3IdCardUrl || undefined,
      projectTitle: projectTitle.trim(),
      hardwareProjectCategories: parsedHardwareProjectCategories,
      prototypeType,
      currentWorkingStatus,
      problemStatement: problemStatement.trim(),
      solutionDescription: solutionDescription.trim(),
      innovationDescription: innovationDescription.trim(),
      abstractPdf: abstractPdfUrl,
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
