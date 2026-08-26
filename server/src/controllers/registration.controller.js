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

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "Payment screenshot image is required for paid registrations",
        });
      }

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

      try {
        const uploadResult = await uploadImage(req.file.buffer);
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
