import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema(
  {
    teamName: {
      type: String,
      required: true,
      trim: true,
    },
    teamSize: {
      type: Number,
      enum: [2, 3, 4],
      required: true,
    },
    hasWorkingPrototype: {
      type: String,
      enum: ["fully_working", "minor_limitations", "no_prototype"],
      required: true,
    },
    teamAffiliation: {
      type: String,
      enum: ["all_aliah", "all_other", "mixed"],
      required: true,
      trim: true,
    },
    aliahMembers: {
      type: Number,
      min: 1,
      max: 3,
    },
    otherInstitutionMembers: {
      type: Number,
      min: 1,
      max: 3,
    },
    teamLeaderName: {
      type: String,
      required: true,
      trim: true,
    },
    teamLeaderEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    teamLeaderPhone: {
      type: String,
      required: true,
      trim: true,
    },
    teamMemberDetails: {
      type: String,
      required: true,
      trim: true,
    },

    projectTitle: {
      type: String,
      required: true,
      trim: true,
    },
    hardwareProjectCategories: {
      type: [String],
      enum: [
        "Robotics",
        "Embedded Systems",
        "IoT & Smart Devices",
        "Electronics & Communication",
        "Electrical Systems",
        "Mechanical Systems",
        "Mechatronics",
        "Automation & Control",
        "AI-Enabled Hardware",
        "Biomedical / Healthcare Devices",
        "Assistive Technology",
        "Renewable Energy / Clean Technology",
        "Smart Agriculture",
        "Smart Mobility / Transportation",
        "Drone / Autonomous Systems",
        "Environmental Technology",
        "Industrial / Manufacturing Technology",
        "Safety & Security Systems",
        "Other",
      ],
      required: true,
    },

    prototypeType: {
      type: String,
      enum: [
        "Standalone Hardware Device",
        "Robotic System",
        "Embedded System",
        "IoT Device",
        "Smart Product",
        "Electromechanical System",
        "Wearable Device",
        "Autonomous System",
        "Hardware + Software System",
        "Other",
      ],
      required: true,
      trim: true,
    },

    currentWorkingStatus: {
      type: String,
      enum: [
        "Fully functional and ready for live demonstration",
        "Functional but requires minor setup/calibration",
        "Functional under controlled conditions",
      ],
      required: true,
      trim: true,
    },

    problemStatement: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    solutionDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1300,
    },
    innovationDescription: {
      type: String,
      required: true,
      trim: true,
    },

    intendedBeneficiaries: {
      type: [String],
      enum: [
        "General Public",
        "Industry",
        "Healthcare",
        "Agriculture",
        "Transportation",
        "Education",
        "Government / Public Services",
        "Rural Communities",
        "Urban Communities",
        "Persons with Disabilities",
        "Other",
      ],
      required: true,
    },

    workingPrinciple: {
      type: String,
      required: true,
      trim: true,
    },
    majorHardwareComponents: {
      type: [String],
      required: true,
    },

    useAi: {
      type: Boolean,
      required: true,
    },
    useIot: {
      type: Boolean,
      required: true,
    },

    powerSource: {
      type: String,
      enum: [
        "battery",
        "usb",
        "dc_power_supply",
        "ac_supply",
        "solar",
        "other",
      ],
      required: true,
    },

    potentialImpact: {
      type: String,
      required: true,
      trim: true,
    },

    productPotential: {
      type: String,
      enum: ["yes", "potentially", "no"],
      required: true,
    },

    prototypeDevelopmentCost: {
      type: Number,
      required: true,
      min: 0,
    },

    auraDemoHighlight: {
      type: String,
      required: true,
      trim: true,
    },

    safetyHazards: {
      type: [String],
      enum: [
        "high_voltage",
        "high_current",
        "high_temperature",
        "moving_rotating_machinery",
        "sharp_mechanical_components",
        "high_power_batteries",
        "laser_intense_light",
        "chemicals",
        "pressurized_systems",
        "drone_flying_equipment",
        "fire_combustion",
        "water_near_electrical_equipment",
        "none",
      ],
      required: true,
    },

    safetyPrecautions: {
      type: String,
      required: true,
      trim: true,
    },

    requiresContinuousSupervision: {
      type: Boolean,
      required: true,
    },

    prototypeDevelopedByTeam: {
      type: String,
      enum: ["yes", "no", "external_assistance"],
      required: true,
    },

    previouslyExhibited: {
      type: Boolean,
      required: true,
    },

    previousExhibitionDetails: {
      type: String,
      trim: true,
    },

    registrationFeeStatus: {
      type: String,
      enum: ["no_fee", "external_fee"],
      required: true,
    },

    transactionId: {
      type: String,
      trim: true,
    },

    paymentScreenshot: {
      type: String,
      trim: true,
    },

    registrationFee: {
      type: Number,
      enum: [0, 400],
      required: true,
    },

    workingPrototypeDeclaration: {
      type: Boolean,
      required: true,
      validate: {
        validator: (value) => value === true,
        message: "Working Prototype Declaration must be accepted",
      },
    },

    originalityDeclaration: {
      type: Boolean,
      required: true,
      validate: {
        validator: (value) => value === true,
        message: "Originality Declaration must be accepted",
      },
    },

    safetyEventRulesAgreement: {
      type: Boolean,
      required: true,
      validate: {
        validator: (value) => value === true,
        message: "Safety & Event Rules must be accepted",
      },
    },

    mediaPermission: {
      type: Boolean,
      required: true,
    },

    finalConfirmation: {
      type: Boolean,
      required: true,
      validate: {
        validator: (value) => value === true,
        message: "Final Confirmation must be accepted",
      },
    },
  },
  {
    timestamps: true,
  },
);

const Registration = mongoose.model("Registration", registrationSchema);

export default Registration;
