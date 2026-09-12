import { uploadImage, uploadDocument } from "../config/cloudinary.js";
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
      registrationFeeStatus = "no_fee",
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
    const parsedOtherInstitutionMembers = parseNumber(rawOtherInstitutionMembers);
    const parsedHardwareProjectCategories = parseArray(rawHardwareProjectCategories);
    const parsedIntendedBeneficiaries = parseArray(rawIntendedBeneficiaries);
    const parsedMajorHardwareComponents = parseArray(rawMajorHardwareComponents);
    const parsedUseAi = parseBoolean(rawUseAi);
    const parsedUseIot = parseBoolean(rawUseIot);
    const parsedPrototypeDevelopmentCost = parseNumber(rawPrototypeDevelopmentCost);
    const parsedSafetyHazards = parseArray(rawSafetyHazards);
    const parsedRequiresContinuousSupervision = parseBoolean(rawRequiresContinuousSupervision);
    const parsedPreviouslyExhibited = parseBoolean(rawPreviouslyExhibited);
    const parsedRegistrationFee = parseNumber(rawRegistrationFee) ?? 0;
    const parsedWorkingPrototypeDeclaration = parseBoolean(rawWorkingPrototypeDeclaration);
    const parsedOriginalityDeclaration = parseBoolean(rawOriginalityDeclaration);
    const parsedSafetyEventRulesAgreement = parseBoolean(rawSafetyEventRulesAgreement);
    const parsedMediaPermission = parseBoolean(rawMediaPermission);
    const parsedFinalConfirmation = parseBoolean(rawFinalConfirmation);

    // 1. Mandatory text and selection fields validation
    if (
      !teamName ||
      !parsedTeamSize ||
      ![2, 3, 4].includes(parsedTeamSize) ||
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
      parsedPrototypeDevelopmentCost <= 0 ||
      !auraDemoHighlight ||
      !parsedSafetyHazards.length ||
      !safetyPrecautions ||
      !prototypeDevelopedByTeam
    ) {
      return res.status(400).json({
        success: false,
        message: "One or more required fields are missing, invalid, or empty.",
      });
    }

    // 2. Email format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const trimmedEmail = teamLeaderEmail.trim().toLowerCase();
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid Team Leader email address (e.g. leader@gmail.com).",
      });
    }

    // 3. Phone number validation (strictly 10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    const trimmedPhone = teamLeaderPhone.trim();
    if (!phoneRegex.test(trimmedPhone)) {
      return res.status(400).json({
        success: false,
        message: "Team Leader Phone must be exactly 10 numeric digits.",
      });
    }

    // 4. Previous exhibition details validation
    if (parsedPreviouslyExhibited && (!previousExhibitionDetails || !previousExhibitionDetails.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please provide details for previous exhibitions.",
      });
    }

    // 5. Mandatory declarations validation
    if (
      !parsedWorkingPrototypeDeclaration ||
      !parsedOriginalityDeclaration ||
      !parsedSafetyEventRulesAgreement ||
      !parsedFinalConfirmation
    ) {
      return res.status(400).json({
        success: false,
        message: "You must accept all required declarations (Working Prototype, Originality, Safety Rules, and Final Confirmation).",
      });
    }

    // 6. Team affiliation validation
    let finalAliahCount = 0;
    let finalOtherCount = 0;

    if (teamAffiliation === "all_aliah") {
      finalAliahCount = parsedTeamSize;
      finalOtherCount = 0;
    } else if (teamAffiliation === "all_other") {
      finalAliahCount = 0;
      finalOtherCount = parsedTeamSize;
    } else if (teamAffiliation === "mixed") {
      if (
        parsedAliahMembers === undefined ||
        parsedOtherInstitutionMembers === undefined
      ) {
        return res.status(400).json({
          success: false,
          message: "Number of Aliah and other institution members are required for mixed affiliation.",
        });
      }
      if (parsedAliahMembers + parsedOtherInstitutionMembers !== parsedTeamSize) {
        return res.status(400).json({
          success: false,
          message: `The sum of Aliah members (${parsedAliahMembers}) and other institution members (${parsedOtherInstitutionMembers}) must equal total team size (${parsedTeamSize}).`,
        });
      }
      finalAliahCount = parsedAliahMembers;
      finalOtherCount = parsedOtherInstitutionMembers;
    }

    // 7. Duplicate check for team name and email
    const existingRegistration = await Registration.findOne({
      $or: [
        { teamName: { $regex: new RegExp(`^${teamName.trim()}$`, "i") } },
        { teamLeaderEmail: trimmedEmail },
      ],
    });

    if (existingRegistration) {
      if (
        existingRegistration.teamName.toLowerCase() === teamName.trim().toLowerCase()
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

    // 8. Files validation
    const files = req.files || {};
    const teamLeaderIdCardFile = files.teamLeaderIdCard?.[0];
    const member1IdCardFile = files.member1IdCard?.[0];
    const member2IdCardFile = files.member2IdCard?.[0];
    const member3IdCardFile = files.member3IdCard?.[0];
    const abstractPdfFile = files.abstractPdf?.[0];
    const legacyPaymentScreenshotFile = files.paymentScreenshot?.[0];

    if (!teamLeaderIdCardFile) {
      return res.status(400).json({
        success: false,
        message: "Team Leader College ID Card file is required.",
      });
    }

    if (!member1IdCardFile) {
      return res.status(400).json({
        success: false,
        message: "Member 1 College ID Card file is required.",
      });
    }

    if (parsedTeamSize >= 3 && !member2IdCardFile) {
      return res.status(400).json({
        success: false,
        message: "Member 2 College ID Card file is required for teams of 3 or more.",
      });
    }

    if (parsedTeamSize >= 4 && !member3IdCardFile) {
      return res.status(400).json({
        success: false,
        message: "Member 3 College ID Card file is required for teams of 4.",
      });
    }

    if (!abstractPdfFile) {
      return res.status(400).json({
        success: false,
        message: "Abstract Idea document is required (PDF or DOCX).",
      });
    }

    // 9. Cloudinary Config Check
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

    // 10. Upload files to Cloudinary in parallel
    let teamLeaderIdCardUrl = "";
    let member1IdCardUrl = "";
    let member2IdCardUrl = "";
    let member3IdCardUrl = "";
    let abstractPdfUrl = "";
    let abstractPdfOriginalName = abstractPdfFile.originalname || "";
    let paymentScreenshotUrl = "";

    try {
      const uploadJobs = [
        uploadImage(teamLeaderIdCardFile.buffer, "aura-registrations/id-cards").then((res) => {
          teamLeaderIdCardUrl = res.secure_url;
        }),
        uploadImage(member1IdCardFile.buffer, "aura-registrations/id-cards").then((res) => {
          member1IdCardUrl = res.secure_url;
        }),
        uploadDocument(abstractPdfFile.buffer, "aura-registrations/abstract-docs", abstractPdfFile.originalname).then((res) => {
          abstractPdfUrl = res.secure_url;
        }),
      ];

      if (member2IdCardFile) {
        uploadJobs.push(
          uploadImage(member2IdCardFile.buffer, "aura-registrations/id-cards").then((res) => {
            member2IdCardUrl = res.secure_url;
          })
        );
      }

      if (member3IdCardFile) {
        uploadJobs.push(
          uploadImage(member3IdCardFile.buffer, "aura-registrations/id-cards").then((res) => {
            member3IdCardUrl = res.secure_url;
          })
        );
      }

      if (registrationFeeStatus === "external_fee" && legacyPaymentScreenshotFile) {
        uploadJobs.push(
          uploadImage(legacyPaymentScreenshotFile.buffer, "aura-registrations/payment-screenshots").then((res) => {
            paymentScreenshotUrl = res.secure_url;
          })
        );
      }

      await Promise.all(uploadJobs);
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError);
      return res.status(500).json({
        success: false,
        message: "Failed to upload files to Cloudinary. Please try again.",
        error: uploadError.message,
      });
    }

    // 11. Construct new Registration document
    const newRegistrationData = {
      teamName: teamName.trim(),
      teamSize: parsedTeamSize,
      hasWorkingPrototype,
      teamAffiliation,
      aliahMembers: finalAliahCount,
      otherInstitutionMembers: finalOtherCount,
      teamLeaderName: teamLeaderName.trim(),
      teamLeaderEmail: trimmedEmail,
      teamLeaderPhone: trimmedPhone,
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
      abstractPdfOriginalName: abstractPdfOriginalName || undefined,
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
      transactionId: transactionId ? transactionId.trim() : undefined,
      paymentScreenshot: paymentScreenshotUrl || undefined,
      registrationFee: parsedRegistrationFee,
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
    if (teamName) query.push({ teamName: { $regex: new RegExp(`^${teamName.trim()}$`, "i") } });

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

