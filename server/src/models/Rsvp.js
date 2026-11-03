import mongoose from "mongoose";

const participantItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    universityName: { type: String, required: true, trim: true },
    isInternal: { type: Boolean, required: true },
    fee: { type: Number, required: true },
    role: { type: String, enum: ["Leader", "Member"], default: "Member" },
  },
  { _id: false },
);

const rsvpSchema = new mongoose.Schema(
  {
    registration: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Registration",
      required: true,
      unique: true,
      index: true,
    },
    registrationId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    teamName: {
      type: String,
      required: true,
      trim: true,
    },
    teamLeaderEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    teamLeaderName: {
      type: String,
      required: true,
      trim: true,
    },
    teamLeaderPhone: {
      type: String,
      required: true,
      trim: true,
    },
    teamCategory: {
      type: String,
      enum: ["internal", "external", "mixed"],
      required: true,
    },
    totalParticipants: {
      type: Number,
      required: true,
      min: 1,
    },
    internalParticipants: {
      type: Number,
      required: true,
      min: 0,
    },
    externalParticipants: {
      type: Number,
      required: true,
      min: 0,
    },
    amountPayable: {
      type: Number,
      required: true,
      min: 0,
    },
    participantBreakdown: {
      type: [participantItemSchema],
      default: [],
    },
    paymentReferenceNumber: {
      type: String,
      trim: true,
    },
    paymentScreenshotUrl: {
      type: String,
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: ["not_required", "pending_verification", "verified", "rejected"],
      default: "pending_verification",
      index: true,
    },
    rsvpStatus: {
      type: String,
      enum: ["not_submitted", "submitted", "confirmed"],
      default: "not_submitted",
      index: true,
    },
    submittedAt: {
      type: Date,
    },
    verifiedAt: {
      type: Date,
    },
    verifiedBy: {
      type: String,
      trim: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    adminNotes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const Rsvp = mongoose.model("Rsvp", rsvpSchema);

export default Rsvp;
